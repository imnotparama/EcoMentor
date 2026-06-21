"""
Integration tests for the agentic chat endpoint.
Mocks the Anthropic AsyncAnthropic client to test the full chat loop.
"""

from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from models.db_models import ChatMessage


def test_chat_endpoint_success(client: TestClient, db: Session, monkeypatch):
    """POST /api/chat should successfully route through the agent loop and persist messages."""
    # Configure mock API key and clear Gemini key to force mocked Anthropic path
    from config import settings
    monkeypatch.setattr(settings, "ANTHROPIC_API_KEY", "mock-anthropic-key")
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)

    # Register and login to retrieve a token
    client.post(
        "/api/auth/register",
        json={"email": "chat_user@example.com", "password": "Password123", "name": "Chat User"},
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "chat_user@example.com", "password": "Password123"},
    )
    token = login_resp.json()["access_token"]

    # Mock response object structural contract matching Claude's messages response
    class MockBlock:
        def __init__(self, text):
            self.text = text
        @property
        def type(self):
            return "text"

    class MockResponse:
        def __init__(self, text):
            self.stop_reason = "end_turn"
            self.content = [MockBlock(text)]

    mock_create = AsyncMock(return_value=MockResponse("I recommend reducing AC usage to save carbon."))

    # Patch AsyncAnthropic class instantiation
    with patch("anthropic.AsyncAnthropic") as mock_class:
        mock_instance = mock_class.return_value
        mock_instance.messages = AsyncMock()
        mock_instance.messages.create = mock_create

        response = client.post(
            "/api/chat",
            json={"message": "How can I reduce my carbon footprint?"},
            headers={"Authorization": f"Bearer {token}"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "user_message" in data
        assert "assistant_message" in data
        assert data["user_message"]["content"] == "How can I reduce my carbon footprint?"
        assert data["assistant_message"]["content"] == "I recommend reducing AC usage to save carbon."

        # Verify that the message turn is persisted to the DB
        stored_user = db.query(ChatMessage).filter(ChatMessage.content == "How can I reduce my carbon footprint?").first()
        stored_assistant = db.query(ChatMessage).filter(ChatMessage.content == "I recommend reducing AC usage to save carbon.").first()
        assert stored_user is not None
        assert stored_assistant is not None
        assert stored_user.role == "user"
        assert stored_assistant.role == "assistant"
