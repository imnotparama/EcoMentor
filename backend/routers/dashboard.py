"""
Dashboard router: aggregated data for the main dashboard view.
"""

from fastapi import APIRouter, Depends
from crud import get_latest_completed_assessment, get_completed_assessments_count
from sqlalchemy.orm import Session
from services.dashboard_engine import compute_badges

from auth_utils import get_current_user
from database import get_db
from models.db_models import Challenge, ProgressEntry, Recommendation, User
from schemas.pydantic_schemas import (
    AssessmentResponse,
    BenchmarkData,
    ChallengeResponse,
    DashboardResponse,
    RecommendationResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

INDIA_MONTHLY = 1900.0




@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all data needed for the main dashboard."""
    # Latest completed assessment
    assessment = get_latest_completed_assessment(db, current_user.id)

    # Latest recommendations
    recommendations = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .limit(5)
        .all()
    )

    # Active (incomplete) challenges
    active_challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id, Challenge.completed.is_(False))
        .order_by(Challenge.created_at.desc())
        .limit(3)
        .all()
    )

    # Progress history for user (queries once)
    progress_records = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .order_by(ProgressEntry.created_at.desc())
        .all()
    )

    # Slice in Python for the chart (last 6 months)
    progress_entries = progress_records[:6]

    # Total assessments count
    total_assessments = get_completed_assessments_count(db, current_user.id)

    # Completed challenges count
    completed_challenges_count = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id, Challenge.completed.is_(True))
        .count()
    )

    # Cumulative CO2 saved vs. India average using SQL aggregate
    from sqlalchemy import func, case
    cumulative_saved = db.query(
        func.sum(
            case(
                (ProgressEntry.total_monthly < INDIA_MONTHLY, INDIA_MONTHLY - ProgressEntry.total_monthly),
                else_=0.0
            )
        )
    ).filter(ProgressEntry.user_id == current_user.id).scalar() or 0.0

    # Compute badges using progress_records
    sustainability_score = assessment.sustainability_score if assessment else 0.0
    badges = compute_badges(
        sustainability_score=sustainability_score,
        completed_challenges=completed_challenges_count,
        total_assessments=total_assessments,
        progress_entries=progress_records,
    )

    # Build progress history as list of dicts for the last 6 months
    progress_history = [
        {
            "month_year": e.month_year,
            "total_monthly": e.total_monthly,
            "sustainability_score": e.sustainability_score,
            "transport": e.transport_emissions,
            "energy": e.energy_emissions,
            "food": e.food_emissions,
            "shopping": e.shopping_emissions,
            "waste": e.waste_emissions,
        }
        for e in reversed(progress_entries)
    ]

    return DashboardResponse(
        user=UserResponse.model_validate(current_user),
        latest_assessment=AssessmentResponse.model_validate(assessment) if assessment else None,
        recommendations=[RecommendationResponse.model_validate(r) for r in recommendations],
        active_challenges=[ChallengeResponse.model_validate(c) for c in active_challenges],
        benchmarks=BenchmarkData(),
        progress_history=progress_history,
        badges=badges,
        cumulative_co2_saved=round(cumulative_saved, 2),
    )
