"""
Tests for the carbon engine — pure calculation logic, no DB required.
"""

import pytest

from services.carbon_engine import (
    EnergyInput,
    FoodInput,
    ShoppingInput,
    TransportInput,
    WasteInput,
    calculate_all_emissions,
    calculate_energy_emissions,
    calculate_food_emissions,
    calculate_shopping_emissions,
    calculate_sustainability_score,
    calculate_transport_emissions,
    calculate_waste_emissions,
    get_highest_emission_category,
)


class TestTransportEmissions:
    def test_transport_emissions_car_petrol(self):
        """Car petrol should produce 0.21 kg CO2/km × distance × days."""
        data = TransportInput(
            daily_distance_km=20.0,
            vehicle_type="car",
            fuel_type="petrol",
            public_transport_days_per_week=0,
        )
        result = calculate_transport_emissions(data)
        # 20 km/day × 7 days/week × 4.33 weeks × 0.21 kg/km ≈ 127.55
        assert result > 100
        assert result < 200

    def test_transport_emissions_ev_is_lower_than_petrol(self):
        """EV should produce significantly less CO2 than petrol for same distance."""
        petrol_data = TransportInput(
            daily_distance_km=20.0,
            vehicle_type="car",
            fuel_type="petrol",
            public_transport_days_per_week=0,
        )
        ev_data = TransportInput(
            daily_distance_km=20.0,
            vehicle_type="ev",
            fuel_type="electric",
            public_transport_days_per_week=0,
        )
        petrol = calculate_transport_emissions(petrol_data)
        ev = calculate_transport_emissions(ev_data)
        assert ev < petrol
        assert ev < petrol * 0.5  # EV should be less than 50% of petrol

    def test_transport_none_produces_zero(self):
        """No vehicle should produce zero emissions."""
        data = TransportInput(
            daily_distance_km=10.0,
            vehicle_type="none",
            fuel_type="none",
            public_transport_days_per_week=0,
        )
        result = calculate_transport_emissions(data)
        assert result == 0.0

    def test_public_transport_reduces_emissions(self):
        """Using public transport on some days should reduce overall emissions."""
        no_pt = TransportInput(
            daily_distance_km=20.0,
            vehicle_type="car",
            fuel_type="petrol",
            public_transport_days_per_week=0,
        )
        with_pt = TransportInput(
            daily_distance_km=20.0,
            vehicle_type="car",
            fuel_type="petrol",
            public_transport_days_per_week=5,
        )
        assert calculate_transport_emissions(with_pt) < calculate_transport_emissions(no_pt)


class TestEnergyEmissions:
    def test_electricity_emissions_scale_linearly(self):
        """Doubling kWh should roughly double emissions."""
        low = EnergyInput(monthly_electricity_kwh=100.0, daily_ac_hours=0.0, renewable_energy="no")
        high = EnergyInput(monthly_electricity_kwh=200.0, daily_ac_hours=0.0, renewable_energy="no")
        assert calculate_energy_emissions(high) > calculate_energy_emissions(low) * 1.9

    def test_renewable_energy_reduces_emissions(self):
        """Renewable energy should significantly reduce electricity emissions."""
        no_renewable = EnergyInput(
            monthly_electricity_kwh=200.0, daily_ac_hours=0.0, renewable_energy="no"
        )
        full_renewable = EnergyInput(
            monthly_electricity_kwh=200.0, daily_ac_hours=0.0, renewable_energy="yes"
        )
        assert calculate_energy_emissions(full_renewable) < calculate_energy_emissions(no_renewable)
        assert calculate_energy_emissions(full_renewable) < calculate_energy_emissions(no_renewable) * 0.4


class TestFoodEmissions:
    def test_vegan_lower_than_meat_heavy(self):
        """Vegan diet should have much lower emissions than meat-heavy."""
        vegan = FoodInput(diet_type="vegan", weekly_meat_meals=0)
        meat_heavy = FoodInput(diet_type="meat_heavy", weekly_meat_meals=14)
        assert calculate_food_emissions(vegan) < calculate_food_emissions(meat_heavy)
        assert calculate_food_emissions(vegan) < calculate_food_emissions(meat_heavy) * 0.3

    def test_food_emissions_order(self):
        """Diet emissions should follow: vegan < vegetarian < mixed < meat_heavy."""
        vegan = calculate_food_emissions(FoodInput(diet_type="vegan", weekly_meat_meals=0))
        vegetarian = calculate_food_emissions(FoodInput(diet_type="vegetarian", weekly_meat_meals=0))
        mixed = calculate_food_emissions(FoodInput(diet_type="mixed", weekly_meat_meals=4))
        meat_heavy = calculate_food_emissions(FoodInput(diet_type="meat_heavy", weekly_meat_meals=10))

        assert vegan < vegetarian < mixed < meat_heavy

    def test_extra_meat_meals_increase_emissions(self):
        """Extra meat meals above baseline should increase food emissions."""
        base = FoodInput(diet_type="mixed", weekly_meat_meals=4)
        extra = FoodInput(diet_type="mixed", weekly_meat_meals=10)
        assert calculate_food_emissions(extra) > calculate_food_emissions(base)


class TestShoppingEmissions:
    def test_shopping_emissions_additive(self):
        """Online purchases and clothing items should both contribute to total."""
        online_only = ShoppingInput(monthly_online_purchases=10, monthly_new_clothing=0)
        clothing_only = ShoppingInput(monthly_online_purchases=0, monthly_new_clothing=5)
        combined = ShoppingInput(monthly_online_purchases=10, monthly_new_clothing=5)

        assert (
            calculate_shopping_emissions(combined)
            == calculate_shopping_emissions(online_only) + calculate_shopping_emissions(clothing_only)
        )

    def test_zero_shopping_is_zero(self):
        """No shopping should produce zero emissions."""
        data = ShoppingInput(monthly_online_purchases=0, monthly_new_clothing=0)
        assert calculate_shopping_emissions(data) == 0.0


class TestWasteEmissions:
    def test_recycling_reduces_emissions(self):
        """Recycling always should produce less emissions than never recycling."""
        always = WasteInput(recycling_habit="always", weekly_waste_kg=10.0)
        never = WasteInput(recycling_habit="never", weekly_waste_kg=10.0)
        assert calculate_waste_emissions(always) < calculate_waste_emissions(never)

    def test_zero_waste_is_zero(self):
        """Zero waste should produce zero emissions."""
        data = WasteInput(recycling_habit="always", weekly_waste_kg=0.0)
        assert calculate_waste_emissions(data) == 0.0


class TestTotalEmissions:
    def test_total_emissions_sum_of_categories(self):
        """Total monthly should equal sum of all category emissions."""
        transport = TransportInput(
            daily_distance_km=15.0, vehicle_type="car", fuel_type="petrol",
            public_transport_days_per_week=2
        )
        energy = EnergyInput(monthly_electricity_kwh=150.0, daily_ac_hours=4.0, renewable_energy="no")
        food = FoodInput(diet_type="mixed", weekly_meat_meals=5)
        shopping = ShoppingInput(monthly_online_purchases=5, monthly_new_clothing=2)
        waste = WasteInput(recycling_habit="sometimes", weekly_waste_kg=8.0)

        result = calculate_all_emissions(transport, energy, food, shopping, waste)

        expected_total = (
            result.transport_emissions_monthly
            + result.energy_emissions_monthly
            + result.food_emissions_monthly
            + result.shopping_emissions_monthly
            + result.waste_emissions_monthly
        )
        assert abs(result.total_monthly - round(expected_total, 2)) < 0.01

    def test_annual_is_12x_monthly(self):
        """Annual total should be exactly 12× monthly."""
        result = calculate_all_emissions(
            food=FoodInput(diet_type="vegan", weekly_meat_meals=0)
        )
        assert abs(result.total_annual - result.total_monthly * 12) < 0.01


class TestSustainabilityScore:
    def test_sustainability_score_range_0_to_100(self):
        """Score should always be between 0 and 100."""
        for emissions in [0, 500, 1000, 1900, 3800, 10000]:
            score = calculate_sustainability_score(float(emissions))
            assert 0.0 <= score <= 100.0, f"Score out of range for {emissions} kg: {score}"

    def test_zero_emissions_gives_perfect_score(self):
        """Zero emissions should give a score of 100."""
        assert calculate_sustainability_score(0.0) == 100.0

    def test_india_average_gives_score_50(self):
        """India average emissions (1900 kg/month) should give approximately 50."""
        score = calculate_sustainability_score(1900.0)
        assert 48.0 <= score <= 52.0

    def test_lower_emissions_give_higher_score(self):
        """Lower emissions should always result in a higher score."""
        low_score = calculate_sustainability_score(500.0)
        high_score = calculate_sustainability_score(1500.0)
        assert low_score > high_score

    def test_very_high_emissions_give_near_zero_score(self):
        """Very high emissions (2× India average) should give near-zero score."""
        score = calculate_sustainability_score(3800.0)
        assert score <= 5.0


class TestZeroEmissionsEdgeCase:
    def test_zero_emissions_edge_case(self):
        """All-zero input should produce zero emissions across all categories."""
        result = calculate_all_emissions(
            transport=TransportInput(
                daily_distance_km=0.0, vehicle_type="none", fuel_type="none",
                public_transport_days_per_week=0
            ),
            energy=EnergyInput(
                monthly_electricity_kwh=0.0, daily_ac_hours=0.0, renewable_energy="yes"
            ),
            food=FoodInput(diet_type="vegan", weekly_meat_meals=0),
            shopping=ShoppingInput(monthly_online_purchases=0, monthly_new_clothing=0),
            waste=WasteInput(recycling_habit="always", weekly_waste_kg=0.0),
        )
        # Food emissions will still be non-zero (even vegan diet has some footprint)
        # but transport, shopping, waste should be 0
        assert result.transport_emissions_monthly == 0.0
        assert result.shopping_emissions_monthly == 0.0
        assert result.waste_emissions_monthly == 0.0
        assert result.sustainability_score == 100.0 or result.sustainability_score > 80.0

    def test_missing_all_categories_defaults_to_zero(self):
        """Calling with no inputs should return all zeros."""
        result = calculate_all_emissions()
        assert result.transport_emissions_monthly == 0.0
        assert result.energy_emissions_monthly == 0.0
        assert result.shopping_emissions_monthly == 0.0
        assert result.waste_emissions_monthly == 0.0
        assert result.total_monthly == 0.0


class TestHighestCategory:
    def test_highest_category_identified_correctly(self):
        """Should correctly identify the highest emission category."""
        from services.carbon_engine import EmissionResult

        result = EmissionResult(
            transport_emissions_monthly=100.0,
            energy_emissions_monthly=800.0,  # highest
            food_emissions_monthly=300.0,
            shopping_emissions_monthly=50.0,
            waste_emissions_monthly=20.0,
            total_monthly=1270.0,
            total_annual=15240.0,
            sustainability_score=67.0,
        )
        assert get_highest_emission_category(result) == "energy"
