"""
Progress router: timeline, cumulative savings, badges, and data export.
"""

import json
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models.db_models import Assessment, Challenge, ProgressEntry, Recommendation, User
from routers.dashboard import compute_badges
from schemas.pydantic_schemas import (
    AssessmentResponse,
    ChallengeResponse,
    ProgressEntryResponse,
    ProgressResponse,
)

router = APIRouter(prefix="/api/progress", tags=["progress"])

INDIA_MONTHLY = 1900.0


@router.get("", response_model=ProgressResponse)
def get_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full progress timeline, cumulative savings, challenges, and badges."""
    entries = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .order_by(ProgressEntry.created_at.asc())
        .all()
    )

    completed_challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id, Challenge.completed == True)
        .order_by(Challenge.completed_at.desc())
        .all()
    )

    total_assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.is_complete == True)
        .count()
    )

    # Cumulative CO2 saved vs. India average
    cumulative_saved = sum(
        max(0, INDIA_MONTHLY - e.total_monthly) for e in entries
    )

    # Latest sustainability score for badge computation
    latest_score = entries[-1].sustainability_score if entries else 0.0

    badges = compute_badges(
        sustainability_score=latest_score,
        completed_challenges=len(completed_challenges),
        total_assessments=total_assessments,
        progress_entries=list(reversed(entries)),
    )

    return ProgressResponse(
        entries=[ProgressEntryResponse.model_validate(e) for e in entries],
        cumulative_co2_saved=round(cumulative_saved, 2),
        completed_challenges=[ChallengeResponse.model_validate(c) for c in completed_challenges],
        badges=badges,
        total_assessments=total_assessments,
    )


@router.get("/export")
def export_user_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export all user data as a JSON download."""
    assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id)
        .all()
    )
    challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id)
        .all()
    )
    progress_entries = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .all()
    )
    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .all()
    )

    export_data = {
        "exported_at": datetime.now().isoformat(),
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "city": current_user.city,
            "created_at": current_user.created_at.isoformat(),
        },
        "assessments": [
            AssessmentResponse.model_validate(a).model_dump(mode="json")
            for a in assessments
        ],
        "challenges": [
            ChallengeResponse.model_validate(c).model_dump(mode="json")
            for c in challenges
        ],
        "progress": [
            ProgressEntryResponse.model_validate(e).model_dump(mode="json")
            for e in progress_entries
        ],
        "recommendations": [
            {
                "id": r.id,
                "category": r.category,
                "title": r.title,
                "description": r.description,
                "impact_kg_monthly": r.impact_kg_monthly,
                "created_at": r.created_at.isoformat(),
            }
            for r in recommendations
        ],
    }

    return JSONResponse(
        content=export_data,
        headers={
            "Content-Disposition": f'attachment; filename="ecomentor_export_{current_user.id}.json"',
            "Content-Type": "application/json",
        },
    )
