"""
Dashboard router: aggregated data for the main dashboard view.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models.db_models import Assessment, Challenge, ProgressEntry, Recommendation, User
from schemas.pydantic_schemas import (
    AssessmentResponse,
    BenchmarkData,
    ChallengeResponse,
    DashboardResponse,
    ProgressEntryResponse,
    RecommendationResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

INDIA_MONTHLY = 1900.0


def compute_badges(
    sustainability_score: float,
    completed_challenges: int,
    total_assessments: int,
    progress_entries: list,
) -> list[str]:
    """Compute earned badges based on user activity."""
    badges = []

    if total_assessments >= 1:
        badges.append("First Assessment")

    if sustainability_score >= 75:
        badges.append("Platinum Eco Warrior")
    elif sustainability_score >= 60:
        badges.append("Gold Contributor")
    elif sustainability_score >= 45:
        badges.append("Silver Steward")
    elif sustainability_score >= 25:
        badges.append("Bronze Beginner")

    if completed_challenges >= 1:
        badges.append("Challenge Accepted")
    if completed_challenges >= 5:
        badges.append("5 Challenges Completed")
    if completed_challenges >= 10:
        badges.append("Eco Champion")

    # Check for 30% reduction
    if len(progress_entries) >= 2:
        first = progress_entries[-1].total_monthly
        latest = progress_entries[0].total_monthly
        if first > 0 and (first - latest) / first >= 0.3:
            badges.append("30% Reducer")

    return badges


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all data needed for the main dashboard."""
    # Latest completed assessment
    assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.is_complete == True)
        .order_by(Assessment.created_at.desc())
        .first()
    )

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
        .filter(Challenge.user_id == current_user.id, Challenge.completed == False)
        .order_by(Challenge.created_at.desc())
        .limit(3)
        .all()
    )

    # Progress history (last 6 months)
    progress_entries = (
        db.query(ProgressEntry)
        .filter(ProgressEntry.user_id == current_user.id)
        .order_by(ProgressEntry.created_at.desc())
        .limit(6)
        .all()
    )

    # Total assessments count
    total_assessments = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.is_complete == True)
        .count()
    )

    # Completed challenges count
    completed_challenges_count = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id, Challenge.completed == True)
        .count()
    )

    # Cumulative CO2 saved vs. India average
    cumulative_saved = 0.0
    if progress_entries:
        for entry in progress_entries:
            saved = max(0, INDIA_MONTHLY - entry.total_monthly)
            cumulative_saved += saved

    # Compute badges
    sustainability_score = assessment.sustainability_score if assessment else 0.0
    badges = compute_badges(
        sustainability_score=sustainability_score,
        completed_challenges=completed_challenges_count,
        total_assessments=total_assessments,
        progress_entries=progress_entries,
    )

    # Build progress history as list of dicts
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
