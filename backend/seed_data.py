"""
Seed data script for EcoMentor AI.

Creates 3 demo users with different environmental profiles:
- Maya (low footprint — eco-conscious)
- Rahul (medium footprint — average urban Indian)
- Priya (high footprint — heavy consumer)

Each user has 6 months of mock progress history, completed assessments,
and completed challenges for demo/testing purposes.

Usage:
    cd backend
    python seed_data.py
"""

import sys
import os
from datetime import datetime, timedelta

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, create_db_tables
from models.db_models import Assessment, Challenge, ChatMessage, ProgressEntry, Recommendation, User
from auth_utils import hash_password
from services.carbon_engine import (
    EnergyInput, FoodInput, ShoppingInput, TransportInput, WasteInput, calculate_all_emissions
)

DEMO_USERS = [
    {
        "email": "maya@demo.ecomentor.ai",
        "password": "demo1234",
        "name": "Maya Sharma",
        "age": 28,
        "city": "Bangalore",
        "household_size": 2,
        "profile": "low",
        "assessment": {
            "transport": TransportInput(daily_distance_km=5.0, vehicle_type="public_transport", fuel_type="electric", public_transport_days_per_week=5),
            "energy": EnergyInput(monthly_electricity_kwh=80.0, daily_ac_hours=1.0, renewable_energy="yes"),
            "food": FoodInput(diet_type="vegetarian", weekly_meat_meals=1),
            "shopping": ShoppingInput(monthly_online_purchases=2, monthly_new_clothing=1),
            "waste": WasteInput(recycling_habit="always", weekly_waste_kg=3.0),
        }
    },
    {
        "email": "rahul@demo.ecomentor.ai",
        "password": "demo1234",
        "name": "Rahul Verma",
        "age": 35,
        "city": "Mumbai",
        "household_size": 4,
        "profile": "medium",
        "assessment": {
            "transport": TransportInput(daily_distance_km=20.0, vehicle_type="car", fuel_type="petrol", public_transport_days_per_week=2),
            "energy": EnergyInput(monthly_electricity_kwh=220.0, daily_ac_hours=5.0, renewable_energy="no"),
            "food": FoodInput(diet_type="mixed", weekly_meat_meals=5),
            "shopping": ShoppingInput(monthly_online_purchases=8, monthly_new_clothing=3),
            "waste": WasteInput(recycling_habit="sometimes", weekly_waste_kg=12.0),
        }
    },
    {
        "email": "priya@demo.ecomentor.ai",
        "password": "demo1234",
        "name": "Priya Nair",
        "age": 42,
        "city": "Chennai",
        "household_size": 5,
        "profile": "high",
        "assessment": {
            "transport": TransportInput(daily_distance_km=50.0, vehicle_type="car", fuel_type="petrol", public_transport_days_per_week=0),
            "energy": EnergyInput(monthly_electricity_kwh=450.0, daily_ac_hours=10.0, renewable_energy="no"),
            "food": FoodInput(diet_type="meat_heavy", weekly_meat_meals=14),
            "shopping": ShoppingInput(monthly_online_purchases=20, monthly_new_clothing=8),
            "waste": WasteInput(recycling_habit="never", weekly_waste_kg=25.0),
        }
    },
]

# Progress trend: month-over-month reduction factor per profile
PROGRESS_FACTORS = {
    "low": [0.95, 0.93, 0.91, 0.89, 0.88, 1.0],   # already low, slight improvement
    "medium": [1.15, 1.08, 1.02, 0.98, 0.95, 1.0],  # started high, improved
    "high": [1.25, 1.18, 1.12, 1.05, 1.01, 1.0],   # high, slight improvement
}


def create_seed_data():
    db = SessionLocal()
    try:
        print("🌱 Creating seed data for EcoMentor AI...")

        for user_data in DEMO_USERS:
            # Check if user already exists
            existing = db.query(User).filter(User.email == user_data["email"]).first()
            if existing:
                print(f"  ⚠️  User {user_data['email']} already exists, skipping.")
                continue

            # Create user
            user = User(
                email=user_data["email"],
                hashed_password=hash_password(user_data["password"]),
                name=user_data["name"],
                age=user_data["age"],
                city=user_data["city"],
                household_size=user_data["household_size"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            print(f"  ✅ Created user: {user.name} ({user_data['profile']} footprint)")

            # Calculate emissions for current assessment
            assessment_data = user_data["assessment"]
            result = calculate_all_emissions(**assessment_data)

            # Create completed assessment
            assessment = Assessment(
                user_id=user.id,
                daily_distance_km=assessment_data["transport"].daily_distance_km,
                vehicle_type=assessment_data["transport"].vehicle_type,
                fuel_type=assessment_data["transport"].fuel_type,
                public_transport_days_per_week=assessment_data["transport"].public_transport_days_per_week,
                monthly_electricity_kwh=assessment_data["energy"].monthly_electricity_kwh,
                daily_ac_hours=assessment_data["energy"].daily_ac_hours,
                renewable_energy=assessment_data["energy"].renewable_energy,
                diet_type=assessment_data["food"].diet_type,
                weekly_meat_meals=assessment_data["food"].weekly_meat_meals,
                monthly_online_purchases=assessment_data["shopping"].monthly_online_purchases,
                monthly_new_clothing=assessment_data["shopping"].monthly_new_clothing,
                recycling_habit=assessment_data["waste"].recycling_habit,
                weekly_waste_kg=assessment_data["waste"].weekly_waste_kg,
                transport_emissions_monthly=result.transport_emissions_monthly,
                energy_emissions_monthly=result.energy_emissions_monthly,
                food_emissions_monthly=result.food_emissions_monthly,
                shopping_emissions_monthly=result.shopping_emissions_monthly,
                waste_emissions_monthly=result.waste_emissions_monthly,
                total_monthly=result.total_monthly,
                total_annual=result.total_annual,
                sustainability_score=result.sustainability_score,
                is_complete=True,
            )
            db.add(assessment)
            db.commit()
            db.refresh(assessment)

            # Create AI recommendation
            rec = Recommendation(
                user_id=user.id,
                assessment_id=assessment.id,
                category="overall",
                title=f"Sustainability Analysis for {user.name}",
                description=_generate_demo_recommendation(user_data["profile"], result),
                impact_kg_monthly=result.total_monthly * 0.2,
            )
            db.add(rec)

            # Create 6 months of progress history
            factors = PROGRESS_FACTORS[user_data["profile"]]
            now = datetime.now()
            for i, factor in enumerate(factors):
                month_offset = 5 - i
                month_date = now - timedelta(days=month_offset * 30)
                month_year = month_date.strftime("%Y-%m")

                monthly_total = round(result.total_monthly * factor, 2)
                progress = ProgressEntry(
                    user_id=user.id,
                    month_year=month_year,
                    total_monthly=monthly_total,
                    sustainability_score=round(
                        max(0, min(100, 100 * (1 - monthly_total / 3800))), 2
                    ),
                    transport_emissions=round(result.transport_emissions_monthly * factor, 2),
                    energy_emissions=round(result.energy_emissions_monthly * factor, 2),
                    food_emissions=round(result.food_emissions_monthly * factor, 2),
                    shopping_emissions=round(result.shopping_emissions_monthly * factor, 2),
                    waste_emissions=round(result.waste_emissions_monthly * factor, 2),
                    created_at=month_date,
                )
                db.add(progress)

            # Create completed challenges (3 completed)
            challenge_types = [
                ("transport", "No-Car Friday", "Avoided driving every Friday for a week", 7, 8.4),
                ("food", "Plant-Based Monday", "Went completely plant-based every Monday", 28, 14.4),
                ("energy", "Unplug Standby Devices Week", "Unplugged all standby devices for a week", 7, 4.2),
            ]
            for cat, title, desc, duration, saving in challenge_types:
                ch = Challenge(
                    user_id=user.id,
                    title=title,
                    description=desc,
                    category=cat,
                    duration_days=duration,
                    estimated_co2_saving_kg=saving,
                    completed=True,
                    completed_at=now - timedelta(days=30),
                )
                db.add(ch)

            # Create one active challenge
            active_ch = Challenge(
                user_id=user.id,
                title="Cycle-to-Work Week",
                description="Cycle to work or to your nearest transit hub for 5 consecutive days.",
                category="transport",
                duration_days=7,
                estimated_co2_saving_kg=15.0,
                completed=False,
            )
            db.add(active_ch)

            # Add sample chat messages
            chat_user = ChatMessage(
                user_id=user.id,
                role="user",
                content="What's my biggest carbon contributor?",
            )
            db.add(chat_user)
            chat_ai = ChatMessage(
                user_id=user.id,
                role="assistant",
                content=_generate_demo_chat_response(user_data["profile"], result),
            )
            db.add(chat_ai)

            db.commit()
            print(f"     📊 Score: {result.sustainability_score:.1f}/100 | {result.total_monthly:.0f} kg CO2/month")

        print("\n✨ Seed data created successfully!")
        print("\n📋 Demo credentials:")
        for u in DEMO_USERS:
            print(f"   {u['email']} / {u['password']} ({u['profile']} footprint)")

    except Exception as e:
        print(f"❌ Error creating seed data: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def _generate_demo_recommendation(profile: str, result) -> str:
    if profile == "low":
        return f"""## 🌿 Your Sustainability Analysis

**Great news!** Your monthly footprint is **{result.total_monthly:.0f} kg CO2** — well below India's average of 1,900 kg.

### Top 3 Opportunities

1. **Food** ({result.food_emissions_monthly:.0f} kg/month) — Even a vegetarian diet has room for improvement. Reducing dairy and eggs could save ~30 kg CO2/month.

2. **Shopping** ({result.shopping_emissions_monthly:.0f} kg/month) — Your online purchases contribute to last-mile delivery emissions. Batch orders and second-hand shopping could save ~10 kg CO2/month.

3. **Waste** ({result.waste_emissions_monthly:.0f} kg/month) — You're already recycling well! Starting composting could reduce this by another 20%.

### 3-Month Roadmap
- **Month 1**: Try going fully vegan twice a week
- **Month 2**: Start composting kitchen waste
- **Month 3**: Do a month-long new-purchase ban"""
    elif profile == "medium":
        return f"""## 📊 Your Sustainability Analysis

Your monthly footprint is **{result.total_monthly:.0f} kg CO2** — close to India's average of 1,900 kg. Here's how to improve.

### Top 3 Opportunities

1. **Energy** ({result.energy_emissions_monthly:.0f} kg/month) — Your AC usage accounts for a significant portion. Setting it to 24°C and using fans could save 80-120 kg CO2/month.

2. **Transport** ({result.transport_emissions_monthly:.0f} kg/month) — Switching 2 more days to public transport per week could save 50 kg CO2/month.

3. **Food** ({result.food_emissions_monthly:.0f} kg/month) — Reducing meat to 3 days/week instead of 5 could save 35 kg CO2/month.

### 3-Month Roadmap
- **Month 1**: AC thermostat challenge — 24°C minimum all month
- **Month 2**: Add 2 more public transport days per week
- **Month 3**: Introduce 2 meat-free days per week"""
    else:
        return f"""## ⚠️ Your Sustainability Analysis

Your monthly footprint is **{result.total_monthly:.0f} kg CO2** — significantly above India's 1,900 kg average. But there's huge opportunity to reduce it quickly.

### Top 3 Opportunities

1. **Transport** ({result.transport_emissions_monthly:.0f} kg/month) — Driving 50 km/day is your largest contributor. Even switching to public transport 3 days/week could save 200+ kg CO2/month.

2. **Energy** ({result.energy_emissions_monthly:.0f} kg/month) — 10 hours of AC/day is extremely high. Reducing to 4 hours saves ~400 kg CO2/month.

3. **Food** ({result.food_emissions_monthly:.0f} kg/month) — A meat-heavy diet has a massive footprint. Introducing 3 plant-based days/week saves ~150 kg CO2/month.

### 3-Month Roadmap
- **Month 1**: AC reduction challenge — max 6 hours/day, thermostat at 24°C
- **Month 2**: 3 public transport days per week
- **Month 3**: 3 plant-based days per week"""


def _generate_demo_chat_response(profile: str, result) -> str:
    if profile == "high":
        biggest = "energy"
        biggest_val = result.energy_emissions_monthly
    else:
        biggest = "food"
        biggest_val = result.food_emissions_monthly

    comparison = "above" if result.total_monthly > 1900 else "below"
    return (
        f"Based on your assessment data, your **biggest carbon contributor is {biggest}** "
        f"at **{biggest_val:.0f} kg CO₂/month**.\n\n"
        f"This is {comparison} India's national average of 1,900 kg CO₂/month.\n\n"
        f"Your top 3 reduction opportunities:\n"
        f"1. 🚗 **Transport**: {result.transport_emissions_monthly:.0f} kg/month\n"
        f"2. ⚡ **Energy**: {result.energy_emissions_monthly:.0f} kg/month\n"
        f"3. 🍽️ **Food**: {result.food_emissions_monthly:.0f} kg/month\n\n"
        "Would you like specific tips for reducing any of these?"
    )


if __name__ == "__main__":
    create_db_tables()
    create_seed_data()
