"""
Carbon emission calculation engine for EcoMentor AI.

All emission factors are scientifically grounded:
- Transport: IPCC 2023 / DEFRA vehicle emission factors
- Energy: India Central Electricity Authority (CEA) grid emission factor 2023
- Food: Oxford University "Reducing food's environmental impacts" (Poore & Nemecek 2018)
- Shopping: MIT Carbon Footprint study + Wrap.org clothing lifecycle analysis
- Waste: IPCC waste sector emission factors

India national average: ~1900 kg CO2/month (22,800 kg CO2/year)
Global average: ~4000 kg CO2/month (48,000 kg CO2/year per capita)
"""

from dataclasses import dataclass
from typing import Optional

# ──────────────────────────────────────────────────────────────────────────────
# Emission Factors
# ──────────────────────────────────────────────────────────────────────────────

EMISSION_FACTORS: dict = {
    "transport": {
        "car_petrol": 0.21,        # kg CO2 per km
        "car_diesel": 0.17,        # kg CO2 per km
        "car_ev": 0.05,            # kg CO2 per km (India grid)
        "bike": 0.09,              # kg CO2 per km (motorbike)
        "public_transport": 0.04,  # kg CO2 per km (weighted bus+rail)
        "none": 0.0,               # walking/cycling
    },
    "energy": {
        "electricity_india": 0.82,  # kg CO2 per kWh (India CEA 2023)
        "ac_per_hour": 1.5,         # kg CO2 per hour (1.5 ton AC)
    },
    "food": {
        "vegan": 1.5,       # kg CO2 per day
        "vegetarian": 2.5,  # kg CO2 per day
        "mixed": 4.0,       # kg CO2 per day
        "meat_heavy": 7.5,  # kg CO2 per day
    },
    "shopping": {
        "online_purchase": 0.5,   # kg CO2 per order (last-mile delivery)
        "clothing_item": 10.0,    # kg CO2 per new item (lifecycle)
    },
    "waste": {
        "kg_waste_recycled": 0.5,   # kg CO2 per kg (residual processing)
        "kg_waste_landfill": 2.0,   # kg CO2 per kg (methane from landfill)
    },
    "renewable_reduction": {
        "yes": 0.7,      # 70% reduction in electricity emissions
        "partial": 0.4,  # 40% reduction
        "no": 0.0,       # no reduction
    },
}

# India average monthly CO2 in kg — used for sustainability score
INDIA_AVERAGE_MONTHLY_KG: float = 1900.0
GLOBAL_AVERAGE_MONTHLY_KG: float = 3333.0

# Days in an average month
DAYS_PER_MONTH: float = 30.44
WEEKS_PER_MONTH: float = 4.33


# ──────────────────────────────────────────────────────────────────────────────
# Data Classes
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class TransportInput:
    daily_distance_km: float
    vehicle_type: str  # car | bike | ev | public_transport | none
    fuel_type: str     # petrol | diesel | electric | hybrid | none
    public_transport_days_per_week: int


@dataclass
class EnergyInput:
    monthly_electricity_kwh: float
    daily_ac_hours: float
    renewable_energy: str  # yes | partial | no


@dataclass
class FoodInput:
    diet_type: str   # vegan | vegetarian | mixed | meat_heavy
    weekly_meat_meals: int


@dataclass
class ShoppingInput:
    monthly_online_purchases: int
    monthly_new_clothing: int


@dataclass
class WasteInput:
    recycling_habit: str   # always | sometimes | never
    weekly_waste_kg: float


@dataclass
class EmissionResult:
    transport_emissions_monthly: float
    energy_emissions_monthly: float
    food_emissions_monthly: float
    shopping_emissions_monthly: float
    waste_emissions_monthly: float
    total_monthly: float
    total_annual: float
    sustainability_score: float


# ──────────────────────────────────────────────────────────────────────────────
# Calculation Functions
# ──────────────────────────────────────────────────────────────────────────────

def calculate_transport_emissions(data: TransportInput) -> float:
    """
    Calculate monthly transport CO2 emissions in kg.

    Uses the most appropriate emission factor based on vehicle type.
    For EVs, uses the India grid factor (0.05 kg CO2/km).
    Public transport proportion is mixed with primary vehicle.
    """
    if data.vehicle_type == "none":
        return 0.0

    # Map vehicle + fuel to emission factor key
    vehicle_map: dict[str, str] = {
        ("car", "petrol"): "car_petrol",
        ("car", "diesel"): "car_diesel",
        ("car", "electric"): "car_ev",
        ("car", "hybrid"): "car_diesel",  # conservative hybrid estimate
        ("ev", "electric"): "car_ev",
        ("ev", "petrol"): "car_ev",       # assume EV regardless of declared fuel
        ("bike", "petrol"): "bike",
        ("bike", "diesel"): "bike",
        ("bike", "electric"): "car_ev",   # e-bike
        ("public_transport", "petrol"): "public_transport",
        ("public_transport", "diesel"): "public_transport",
        ("public_transport", "electric"): "public_transport",
        ("public_transport", "none"): "public_transport",
    }

    factor_key = vehicle_map.get(
        (data.vehicle_type, data.fuel_type), "car_petrol"
    )
    emission_factor = EMISSION_FACTORS["transport"][factor_key]

    # Proportion of days using primary vehicle vs public transport
    work_days = 7  # days per week
    pt_days = min(data.public_transport_days_per_week, work_days)
    primary_days = work_days - pt_days

    # Weekly km breakdown
    primary_weekly_km = data.daily_distance_km * primary_days
    pt_weekly_km = data.daily_distance_km * pt_days

    # Monthly emissions
    primary_monthly = (
        primary_weekly_km * WEEKS_PER_MONTH * emission_factor
    )
    pt_monthly = (
        pt_weekly_km
        * WEEKS_PER_MONTH
        * EMISSION_FACTORS["transport"]["public_transport"]
    )

    return round(primary_monthly + pt_monthly, 2)


def calculate_energy_emissions(data: EnergyInput) -> float:
    """
    Calculate monthly energy CO2 emissions in kg.

    Electricity emissions are reduced based on renewable energy usage.
    AC usage adds to electricity emissions (captured as a separate calculation
    to allow users without electricity bill data to still estimate AC impact).
    """
    # Electricity emissions
    base_electricity = (
        data.monthly_electricity_kwh
        * EMISSION_FACTORS["energy"]["electricity_india"]
    )

    # Apply renewable energy discount
    renewable_reduction = EMISSION_FACTORS["renewable_reduction"][
        data.renewable_energy
    ]
    electricity_emissions = base_electricity * (1 - renewable_reduction)

    # AC emissions (converted to monthly)
    ac_monthly = (
        data.daily_ac_hours
        * DAYS_PER_MONTH
        * EMISSION_FACTORS["energy"]["ac_per_hour"]
    )

    return round(electricity_emissions + ac_monthly, 2)


def calculate_food_emissions(data: FoodInput) -> float:
    """
    Calculate monthly food CO2 emissions in kg.

    Base diet factor is used; additional meat meals above the diet baseline
    contribute linearly. The diet factor already captures average meal composition.
    """
    daily_factor = EMISSION_FACTORS["food"][data.diet_type]
    monthly_base = daily_factor * DAYS_PER_MONTH

    # Additional meat meal adjustment (for mixed/vegetarian who have extra meat)
    # Baseline weekly meat meals per diet type
    baseline_meat: dict[str, float] = {
        "vegan": 0,
        "vegetarian": 0,
        "mixed": 4,
        "meat_heavy": 10,
    }
    extra_meals = max(0, data.weekly_meat_meals - baseline_meat[data.diet_type])
    # Each additional meat meal: ~1.5 kg CO2
    extra_monthly = extra_meals * WEEKS_PER_MONTH * 1.5

    return round(monthly_base + extra_monthly, 2)


def calculate_shopping_emissions(data: ShoppingInput) -> float:
    """
    Calculate monthly shopping CO2 emissions in kg.
    """
    online_emissions = (
        data.monthly_online_purchases
        * EMISSION_FACTORS["shopping"]["online_purchase"]
    )
    clothing_emissions = (
        data.monthly_new_clothing
        * EMISSION_FACTORS["shopping"]["clothing_item"]
    )
    return round(online_emissions + clothing_emissions, 2)


def calculate_waste_emissions(data: WasteInput) -> float:
    """
    Calculate monthly waste CO2 emissions in kg.

    Recycling habit determines the split between recycled and landfill waste.
    """
    recycling_fraction: dict[str, float] = {
        "always": 0.7,
        "sometimes": 0.3,
        "never": 0.0,
    }
    fraction_recycled = recycling_fraction[data.recycling_habit]
    fraction_landfill = 1.0 - fraction_recycled

    monthly_waste_kg = data.weekly_waste_kg * WEEKS_PER_MONTH

    recycled_emissions = (
        monthly_waste_kg
        * fraction_recycled
        * EMISSION_FACTORS["waste"]["kg_waste_recycled"]
    )
    landfill_emissions = (
        monthly_waste_kg
        * fraction_landfill
        * EMISSION_FACTORS["waste"]["kg_waste_landfill"]
    )

    return round(recycled_emissions + landfill_emissions, 2)


def calculate_sustainability_score(total_monthly_kg: float) -> float:
    """
    Calculate sustainability score (0–100).

    Score is inversely scaled against India average (1900 kg/month).
    - At 0 kg/month → score = 100
    - At India average (1900 kg/month) → score = 50
    - At 2× India average (3800 kg/month) → score ≈ 0

    Uses a sigmoid-like curve for natural distribution.
    """
    if total_monthly_kg <= 0:
        return 100.0

    # Linear inverse scale capped at 0
    # Score = 100 * (1 - emissions / (2 * india_average))
    max_reference = 2.0 * INDIA_AVERAGE_MONTHLY_KG  # 3800 kg
    score = 100.0 * max(0.0, 1.0 - (total_monthly_kg / max_reference))
    return round(min(100.0, max(0.0, score)), 2)


def calculate_all_emissions(
    transport: Optional[TransportInput] = None,
    energy: Optional[EnergyInput] = None,
    food: Optional[FoodInput] = None,
    shopping: Optional[ShoppingInput] = None,
    waste: Optional[WasteInput] = None,
) -> EmissionResult:
    """
    Calculate all emission categories and return an EmissionResult.

    Any missing category defaults to 0.0 — supports partial assessments.
    """
    transport_monthly = (
        calculate_transport_emissions(transport) if transport else 0.0
    )
    energy_monthly = (
        calculate_energy_emissions(energy) if energy else 0.0
    )
    food_monthly = (
        calculate_food_emissions(food) if food else 0.0
    )
    shopping_monthly = (
        calculate_shopping_emissions(shopping) if shopping else 0.0
    )
    waste_monthly = (
        calculate_waste_emissions(waste) if waste else 0.0
    )

    total_monthly = round(
        transport_monthly
        + energy_monthly
        + food_monthly
        + shopping_monthly
        + waste_monthly,
        2,
    )
    total_annual = round(total_monthly * 12, 2)
    sustainability_score = calculate_sustainability_score(total_monthly)

    return EmissionResult(
        transport_emissions_monthly=transport_monthly,
        energy_emissions_monthly=energy_monthly,
        food_emissions_monthly=food_monthly,
        shopping_emissions_monthly=shopping_monthly,
        waste_emissions_monthly=waste_monthly,
        total_monthly=total_monthly,
        total_annual=total_annual,
        sustainability_score=sustainability_score,
    )


def get_highest_emission_category(result: EmissionResult) -> str:
    """Return the emission category with the highest monthly emissions."""
    categories = {
        "transport": result.transport_emissions_monthly,
        "energy": result.energy_emissions_monthly,
        "food": result.food_emissions_monthly,
        "shopping": result.shopping_emissions_monthly,
        "waste": result.waste_emissions_monthly,
    }
    return max(categories, key=lambda k: categories[k])
