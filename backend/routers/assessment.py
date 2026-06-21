"""
Assessment router: multi-step wizard save, retrieval, and AI analysis trigger.
"""

import asyncio
import json
import logging
from datetime import datetime

import anthropic
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth_utils import get_current_user
from config import settings
from database import get_db
from models.db_models import Assessment, ProgressEntry, Recommendation, User
from schemas.pydantic_schemas import AssessmentCreate, AssessmentResponse, RecommendationResponse
from services.carbon_engine import (
    EnergyInput,
    FoodInput,
    ShoppingInput,
    TransportInput,
    WasteInput,
    calculate_all_emissions,
    get_highest_emission_category,
)
from services.challenge_engine import generate_challenge_for_category
from models.db_models import Challenge

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


def _get_or_create_draft(user_id: int, db: Session) -> Assessment:
    """Get the latest incomplete assessment, or create a new one."""
    draft = (
        db.query(Assessment)
        .filter(Assessment.user_id == user_id, Assessment.is_complete == False)
        .order_by(Assessment.created_at.desc())
        .first()
    )
    if not draft:
        draft = Assessment(user_id=user_id)
        db.add(draft)
        db.commit()
        db.refresh(draft)
    return draft


@router.post("/save", response_model=AssessmentResponse)
def save_assessment_step(
    body: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Save one or more steps of the multi-step assessment.
    The assessment is resumable — call this endpoint for each step.
    """
    draft = _get_or_create_draft(current_user.id, db)

    # Apply transport data
    if body.transport:
        draft.daily_distance_km = body.transport.daily_distance_km
        draft.vehicle_type = body.transport.vehicle_type
        draft.fuel_type = body.transport.fuel_type
        draft.public_transport_days_per_week = body.transport.public_transport_days_per_week

    # Apply energy data
    if body.energy:
        draft.monthly_electricity_kwh = body.energy.monthly_electricity_kwh
        draft.daily_ac_hours = body.energy.daily_ac_hours
        draft.renewable_energy = body.energy.renewable_energy

    # Apply food data
    if body.food:
        draft.diet_type = body.food.diet_type
        draft.weekly_meat_meals = body.food.weekly_meat_meals

    # Apply shopping data
    if body.shopping:
        draft.monthly_online_purchases = body.shopping.monthly_online_purchases
        draft.monthly_new_clothing = body.shopping.monthly_new_clothing

    # Apply waste data
    if body.waste:
        draft.recycling_habit = body.waste.recycling_habit
        draft.weekly_waste_kg = body.waste.weekly_waste_kg

    db.commit()
    db.refresh(draft)
    return AssessmentResponse.model_validate(draft)


@router.post("/complete", response_model=AssessmentResponse)
def complete_assessment(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Mark the assessment as complete, calculate emissions, and trigger AI analysis.
    Requires all 5 sections to have been filled in.
    """
    draft = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.is_complete == False)
        .order_by(Assessment.created_at.desc())
        .first()
    )

    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No draft assessment found. Please start an assessment first.",
        )

    # Validate all sections are filled
    missing = []
    if draft.vehicle_type is None:
        missing.append("transport")
    if draft.monthly_electricity_kwh is None:
        missing.append("energy")
    if draft.diet_type is None:
        missing.append("food")
    if draft.monthly_online_purchases is None:
        missing.append("shopping")
    if draft.recycling_habit is None:
        missing.append("waste")

    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Assessment is incomplete. Missing sections: {', '.join(missing)}",
        )

    # Build input objects for carbon engine
    transport_input = TransportInput(
        daily_distance_km=draft.daily_distance_km or 0,
        vehicle_type=draft.vehicle_type,
        fuel_type=draft.fuel_type or "petrol",
        public_transport_days_per_week=draft.public_transport_days_per_week or 0,
    )
    energy_input = EnergyInput(
        monthly_electricity_kwh=draft.monthly_electricity_kwh or 0,
        daily_ac_hours=draft.daily_ac_hours or 0,
        renewable_energy=draft.renewable_energy or "no",
    )
    food_input = FoodInput(
        diet_type=draft.diet_type,
        weekly_meat_meals=draft.weekly_meat_meals or 0,
    )
    shopping_input = ShoppingInput(
        monthly_online_purchases=draft.monthly_online_purchases or 0,
        monthly_new_clothing=draft.monthly_new_clothing or 0,
    )
    waste_input = WasteInput(
        recycling_habit=draft.recycling_habit,
        weekly_waste_kg=draft.weekly_waste_kg or 0,
    )

    # Calculate emissions
    result = calculate_all_emissions(
        transport=transport_input,
        energy=energy_input,
        food=food_input,
        shopping=shopping_input,
        waste=waste_input,
    )

    # Update assessment with results
    draft.transport_emissions_monthly = result.transport_emissions_monthly
    draft.energy_emissions_monthly = result.energy_emissions_monthly
    draft.food_emissions_monthly = result.food_emissions_monthly
    draft.shopping_emissions_monthly = result.shopping_emissions_monthly
    draft.waste_emissions_monthly = result.waste_emissions_monthly
    draft.total_monthly = result.total_monthly
    draft.total_annual = result.total_annual
    draft.sustainability_score = result.sustainability_score
    draft.is_complete = True

    db.commit()
    db.refresh(draft)

    # Record progress entry for this month
    month_year = datetime.now().strftime("%Y-%m")
    existing_entry = (
        db.query(ProgressEntry)
        .filter(
            ProgressEntry.user_id == current_user.id,
            ProgressEntry.month_year == month_year,
        )
        .first()
    )
    if existing_entry:
        existing_entry.total_monthly = result.total_monthly
        existing_entry.sustainability_score = result.sustainability_score
        existing_entry.transport_emissions = result.transport_emissions_monthly
        existing_entry.energy_emissions = result.energy_emissions_monthly
        existing_entry.food_emissions = result.food_emissions_monthly
        existing_entry.shopping_emissions = result.shopping_emissions_monthly
        existing_entry.waste_emissions = result.waste_emissions_monthly
    else:
        progress = ProgressEntry(
            user_id=current_user.id,
            month_year=month_year,
            total_monthly=result.total_monthly,
            sustainability_score=result.sustainability_score,
            transport_emissions=result.transport_emissions_monthly,
            energy_emissions=result.energy_emissions_monthly,
            food_emissions=result.food_emissions_monthly,
            shopping_emissions=result.shopping_emissions_monthly,
            waste_emissions=result.waste_emissions_monthly,
        )
        db.add(progress)

    # Generate a weekly challenge for the highest emission category
    highest_category = get_highest_emission_category(result)
    active_challenges = (
        db.query(Challenge)
        .filter(Challenge.user_id == current_user.id, Challenge.completed == False)
        .all()
    )
    active_titles = [c.title for c in active_challenges]
    challenge_data = generate_challenge_for_category(highest_category, exclude_titles=active_titles)
    challenge = Challenge(
        user_id=current_user.id,
        title=challenge_data["title"],
        description=challenge_data["description"],
        category=highest_category,
        duration_days=challenge_data["duration_days"],
        estimated_co2_saving_kg=challenge_data["estimated_co2_saving_kg"],
    )
    db.add(challenge)
    db.commit()

    # Trigger AI analysis in background
    background_tasks.add_task(
        _run_ai_analysis_background,
        user_id=current_user.id,
        assessment_id=draft.id,
    )

    return AssessmentResponse.model_validate(draft)


async def _run_ai_analysis_background(user_id: int, assessment_id: int) -> None:
    """Run AI recommendation generation in the background after assessment completion."""
    from database import SessionLocal
    from services.ai_agent import generate_assessment_recommendations

    if not settings.ANTHROPIC_API_KEY and not settings.GEMINI_API_KEY:
        logger.warning("Neither ANTHROPIC_API_KEY nor GEMINI_API_KEY is set — skipping AI analysis")
        return

    # 1. Fetch data and generate recommendations (using a short-lived DB session for reading)
    db_read = SessionLocal()
    try:
        client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY) if settings.ANTHROPIC_API_KEY else None
        report = await generate_assessment_recommendations(user_id, db_read, client)
    except Exception as e:
        logger.error(f"AI analysis failed for user {user_id} during generation: {e}")
        return
    finally:
        db_read.close()

    # 2. Store the recommendations (using a short-lived DB session for writing)
    db_write = SessionLocal()
    try:
        assessment = db_write.query(Assessment).filter(Assessment.id == assessment_id).first()
        if assessment:
            rec = Recommendation(
                user_id=user_id,
                assessment_id=assessment_id,
                category="overall",
                title="AI Sustainability Analysis",
                description=report,
                impact_kg_monthly=0.0,
            )
            db_write.add(rec)
            db_write.commit()
            logger.info(f"AI analysis stored for user {user_id}")
    except Exception as e:
        logger.error(f"AI analysis failed for user {user_id} during saving: {e}")
    finally:
        db_write.close()


@router.get("/current", response_model=AssessmentResponse)
def get_current_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the user's latest completed assessment."""
    assessment = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.is_complete == True)
        .order_by(Assessment.created_at.desc())
        .first()
    )
    if not assessment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No completed assessment found",
        )
    return AssessmentResponse.model_validate(assessment)


@router.get("/draft", response_model=AssessmentResponse)
def get_draft_assessment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the user's current draft (incomplete) assessment."""
    draft = (
        db.query(Assessment)
        .filter(Assessment.user_id == current_user.id, Assessment.is_complete == False)
        .order_by(Assessment.created_at.desc())
        .first()
    )
    if not draft:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No draft assessment found",
        )
    return AssessmentResponse.model_validate(draft)


@router.get("/recommendations", response_model=list[RecommendationResponse])
def get_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI-generated recommendations for the current user."""
    recs = (
        db.query(Recommendation)
        .filter(Recommendation.user_id == current_user.id)
        .order_by(Recommendation.created_at.desc())
        .limit(10)
        .all()
    )
    return [RecommendationResponse.model_validate(r) for r in recs]
