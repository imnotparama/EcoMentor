"""
Challenges router: active challenges, challenge completion, and new challenge generation.
"""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from database import get_db
from models.db_models import Assessment, Challenge, User
from schemas.pydantic_schemas import ChallengeResponse
from services.carbon_engine import get_highest_emission_category, EmissionResult
from services.challenge_engine import generate_challenge_for_category

router = APIRouter(prefix="/api/challenges", tags=["challenges"])


@router.get("", response_model=list[ChallengeResponse])
def get_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all challenges for the current user (active + completed)."""
    challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id)
        .order_by(Challenge.created_at.desc())
        .all()
    )
    return [ChallengeResponse.model_validate(c) for c in challenges]


@router.get("/active", response_model=list[ChallengeResponse])
def get_active_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get only active (incomplete) challenges."""
    challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id, Challenge.completed == False)
        .order_by(Challenge.created_at.desc())
        .all()
    )
    return [ChallengeResponse.model_validate(c) for c in challenges]


@router.post("/{challenge_id}/complete", response_model=ChallengeResponse)
def complete_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a challenge as completed."""
    challenge = (
        db.query(Challenge)
        .filter(
            Challenge.id == challenge_id,
            Challenge.user_id == current_user.id,
        )
        .first()
    )

    if not challenge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Challenge not found",
        )

    if challenge.completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Challenge is already completed",
        )

    challenge.completed = True
    challenge.completed_at = datetime.now()
    db.commit()
    db.refresh(challenge)

    return ChallengeResponse.model_validate(challenge)


@router.post("/generate", response_model=ChallengeResponse)
def generate_new_challenge(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new weekly challenge based on the user's highest emission category."""
    # Get latest assessment
    assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.is_complete == True)
        .order_by(Assessment.created_at.desc())
        .first()
    )

    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please complete an assessment first",
        )

    # Determine highest emission category
    result = EmissionResult(
        transport_emissions_monthly=assessment.transport_emissions_monthly or 0,
        energy_emissions_monthly=assessment.energy_emissions_monthly or 0,
        food_emissions_monthly=assessment.food_emissions_monthly or 0,
        shopping_emissions_monthly=assessment.shopping_emissions_monthly or 0,
        waste_emissions_monthly=assessment.waste_emissions_monthly or 0,
        total_monthly=assessment.total_monthly or 0,
        total_annual=assessment.total_annual or 0,
        sustainability_score=assessment.sustainability_score or 0,
    )

    # Find active challenges to exclude duplicate generations
    active_challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id, Challenge.completed == False)
        .all()
    )
    active_titles = [c.title for c in active_challenges]

    category = get_highest_emission_category(result)
    challenge_data = generate_challenge_for_category(category, exclude_titles=active_titles)

    challenge = Challenge(
        user_id=current_user.id,
        title=challenge_data["title"],
        description=challenge_data["description"],
        category=category,
        duration_days=challenge_data["duration_days"],
        estimated_co2_saving_kg=challenge_data["estimated_co2_saving_kg"],
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)

    return ChallengeResponse.model_validate(challenge)
