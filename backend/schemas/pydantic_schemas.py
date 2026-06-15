"""
Pydantic v2 schemas for EcoMentor AI.
All schemas use model_config = ConfigDict(extra='forbid') to reject unknown fields.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ──────────────────────────────────────────────
# Auth Schemas
# ──────────────────────────────────────────────

class UserRegister(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=100)

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        has_letter = any(c.isalpha() for c in v)
        has_digit = any(c.isdigit() for c in v)
        if not has_letter or not has_digit:
            raise ValueError(
                "Password must contain at least one letter and one digit"
            )
        return v


class UserLogin(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    name: str
    age: Optional[int]
    city: Optional[str]
    household_size: Optional[int]
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ProfileUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    age: Optional[int] = Field(None, ge=1, le=120)
    city: Optional[str] = Field(None, max_length=100)
    household_size: Optional[int] = Field(None, ge=1, le=20)


# ──────────────────────────────────────────────
# Assessment Schemas
# ──────────────────────────────────────────────

VALID_VEHICLE_TYPES = {"car", "bike", "ev", "public_transport", "none"}
VALID_FUEL_TYPES = {"petrol", "diesel", "electric", "hybrid", "none"}
VALID_RENEWABLE = {"yes", "partial", "no"}
VALID_DIET_TYPES = {"vegan", "vegetarian", "mixed", "meat_heavy"}
VALID_RECYCLING = {"always", "sometimes", "never"}


class TransportData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    daily_distance_km: float = Field(ge=0, le=2000)
    vehicle_type: str
    fuel_type: str
    public_transport_days_per_week: int = Field(ge=0, le=7)

    @field_validator("vehicle_type")
    @classmethod
    def validate_vehicle_type(cls, v: str) -> str:
        if v not in VALID_VEHICLE_TYPES:
            raise ValueError(f"vehicle_type must be one of {VALID_VEHICLE_TYPES}")
        return v

    @field_validator("fuel_type")
    @classmethod
    def validate_fuel_type(cls, v: str) -> str:
        if v not in VALID_FUEL_TYPES:
            raise ValueError(f"fuel_type must be one of {VALID_FUEL_TYPES}")
        return v


class EnergyData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    monthly_electricity_kwh: float = Field(ge=0, le=100000)
    daily_ac_hours: float = Field(ge=0, le=24)
    renewable_energy: str

    @field_validator("renewable_energy")
    @classmethod
    def validate_renewable(cls, v: str) -> str:
        if v not in VALID_RENEWABLE:
            raise ValueError(f"renewable_energy must be one of {VALID_RENEWABLE}")
        return v


class FoodData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    diet_type: str
    weekly_meat_meals: int = Field(ge=0, le=21)

    @field_validator("diet_type")
    @classmethod
    def validate_diet(cls, v: str) -> str:
        if v not in VALID_DIET_TYPES:
            raise ValueError(f"diet_type must be one of {VALID_DIET_TYPES}")
        return v


class ShoppingData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    monthly_online_purchases: int = Field(ge=0, le=500)
    monthly_new_clothing: int = Field(ge=0, le=200)


class WasteData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    recycling_habit: str
    weekly_waste_kg: float = Field(ge=0, le=1000)

    @field_validator("recycling_habit")
    @classmethod
    def validate_recycling(cls, v: str) -> str:
        if v not in VALID_RECYCLING:
            raise ValueError(f"recycling_habit must be one of {VALID_RECYCLING}")
        return v


class AssessmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    transport: Optional[TransportData] = None
    energy: Optional[EnergyData] = None
    food: Optional[FoodData] = None
    shopping: Optional[ShoppingData] = None
    waste: Optional[WasteData] = None


class EmissionBreakdown(BaseModel):
    transport_emissions_monthly: float
    energy_emissions_monthly: float
    food_emissions_monthly: float
    shopping_emissions_monthly: float
    waste_emissions_monthly: float
    total_monthly: float
    total_annual: float
    sustainability_score: float


class AssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    # Inputs
    daily_distance_km: Optional[float]
    vehicle_type: Optional[str]
    fuel_type: Optional[str]
    public_transport_days_per_week: Optional[int]
    monthly_electricity_kwh: Optional[float]
    daily_ac_hours: Optional[float]
    renewable_energy: Optional[str]
    diet_type: Optional[str]
    weekly_meat_meals: Optional[int]
    monthly_online_purchases: Optional[int]
    monthly_new_clothing: Optional[int]
    recycling_habit: Optional[str]
    weekly_waste_kg: Optional[float]
    # Outputs
    transport_emissions_monthly: Optional[float]
    energy_emissions_monthly: Optional[float]
    food_emissions_monthly: Optional[float]
    shopping_emissions_monthly: Optional[float]
    waste_emissions_monthly: Optional[float]
    total_monthly: Optional[float]
    total_annual: Optional[float]
    sustainability_score: Optional[float]
    is_complete: bool
    created_at: datetime
    updated_at: datetime


# ──────────────────────────────────────────────
# Recommendation Schemas
# ──────────────────────────────────────────────

class RecommendationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category: str
    title: str
    description: str
    impact_kg_monthly: float
    roadmap: Optional[str]
    created_at: datetime


# ──────────────────────────────────────────────
# Challenge Schemas
# ──────────────────────────────────────────────

class ChallengeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str
    category: str
    duration_days: int
    estimated_co2_saving_kg: float
    completed: bool
    completed_at: Optional[datetime]
    created_at: datetime


class CompleteChallenge(BaseModel):
    model_config = ConfigDict(extra="forbid")

    challenge_id: int = Field(ge=1)


# ──────────────────────────────────────────────
# Chat Schemas
# ──────────────────────────────────────────────

class ChatMessageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=4000)


class ChatMessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    content: str
    created_at: datetime


class ChatResponse(BaseModel):
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse
    tools_called: list[str] = []  # Agentic transparency: which tools Claude invoked


# ──────────────────────────────────────────────
# Dashboard Schemas
# ──────────────────────────────────────────────

class BenchmarkData(BaseModel):
    india_average_monthly: float = 1900.0
    global_average_monthly: float = 3333.0
    category_india_averages: dict[str, float] = {
        "transport": 450.0,
        "energy": 620.0,
        "food": 500.0,
        "shopping": 180.0,
        "waste": 150.0,
    }


class DashboardResponse(BaseModel):
    user: UserResponse
    latest_assessment: Optional[AssessmentResponse]
    recommendations: list[RecommendationResponse]
    active_challenges: list[ChallengeResponse]
    benchmarks: BenchmarkData
    progress_history: list[dict]
    badges: list[str]
    cumulative_co2_saved: float


# ──────────────────────────────────────────────
# Progress Schemas
# ──────────────────────────────────────────────

class ProgressEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    month_year: str
    total_monthly: float
    sustainability_score: float
    transport_emissions: Optional[float]
    energy_emissions: Optional[float]
    food_emissions: Optional[float]
    shopping_emissions: Optional[float]
    waste_emissions: Optional[float]
    created_at: datetime


class ProgressResponse(BaseModel):
    entries: list[ProgressEntryResponse]
    cumulative_co2_saved: float
    completed_challenges: list[ChallengeResponse]
    badges: list[str]
    total_assessments: int


# ──────────────────────────────────────────────
# Health
# ──────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    version: str
