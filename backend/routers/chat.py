"""
Chat router with rate limiting (10 req/min per user).
Uses the agentic tool-calling loop for all responses.
"""

import logging
from datetime import datetime, timezone

import anthropic
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from auth_utils import get_current_user, limiter
from config import settings
from database import get_db
from models.db_models import ChatMessage, User
from schemas.pydantic_schemas import ChatMessageRequest, ChatMessageResponse, ChatResponse
from services.ai_agent import run_agent_loop

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _build_conversation_history(messages: list[ChatMessage]) -> list[dict]:
    """Convert DB chat messages to Anthropic message format."""
    history = []
    for msg in messages:
        history.append({"role": msg.role, "content": msg.content})
    return history


@router.get("/history", response_model=list[ChatMessageResponse])
def get_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the user's full chat history."""
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )
    return [ChatMessageResponse.model_validate(m) for m in messages]


@router.delete("/history", status_code=status.HTTP_204_NO_CONTENT)
def clear_chat_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Clear the user's chat history."""
    db.query(ChatMessage).filter(ChatMessage.user_id == current_user.id).delete()
    db.commit()


@router.post("", response_model=ChatResponse)
@limiter.limit("10/minute")
async def send_message(
    request: Request,
    body: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to the AI agent and receive a grounded response.
    Rate limited to 10 requests per minute per IP.
    """
    if not settings.ANTHROPIC_API_KEY and not settings.GEMINI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not configured. Please set ANTHROPIC_API_KEY or GEMINI_API_KEY.",
        )

    # Sanitize input: strip whitespace, reject blank messages
    sanitized_message = body.message.strip()
    if not sanitized_message:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Message cannot be empty or whitespace only.",
        )

    # Save user message to DB
    user_msg = ChatMessage(
        user_id=current_user.id,
        role="user",
        content=sanitized_message,
    )

    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Load recent conversation history (last 20 messages for context window)
    history_records = (
        db.query(ChatMessage)
        .filter(ChatMessage.user_id == current_user.id)
        .order_by(ChatMessage.created_at.desc())
        .limit(20)
        .all()
    )
    history_records = list(reversed(history_records))
    # Exclude the message we just added (it will be added as the current turn)
    conversation_history = _build_conversation_history(history_records[:-1])

    # Run agentic loop
    try:
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
        ai_response, tools_called = await run_agent_loop(
            user_id=current_user.id,
            user_message=sanitized_message,
            conversation_history=conversation_history,
            db=db,
            anthropic_client=client,
        )
    except anthropic.RateLimitError:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI service rate limit reached. Please try again in a moment.",
        )
    except Exception as e:
        logger.error(f"AI agent error for user {current_user.id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="AI service encountered an error. Please try again.",
        )

    # Save AI response to DB
    assistant_msg = ChatMessage(
        user_id=current_user.id,
        role="assistant",
        content=ai_response,
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return ChatResponse(
        user_message=ChatMessageResponse.model_validate(user_msg),
        assistant_message=ChatMessageResponse.model_validate(assistant_msg),
        tools_called=tools_called,
    )
