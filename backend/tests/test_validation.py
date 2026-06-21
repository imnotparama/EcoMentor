"""
Tests for input validation — ensures malicious/invalid inputs are rejected.
"""

import pytest
from pydantic import ValidationError

from schemas.pydantic_schemas import (
    AssessmentCreate,
    EnergyData,
    FoodData,
    ShoppingData,
    TransportData,
    UserLogin,
    UserRegister,
    WasteData,
)


class TestNegativeDistanceRejected:
    """Docstring for class TestNegativeDistanceRejected."""
    def test_negative_distance_rejected(self):
        """Negative daily distance should raise ValidationError."""
        with pytest.raises(ValidationError) as exc_info:
            TransportData(
                daily_distance_km=-10.0,
                vehicle_type="car",
                fuel_type="petrol",
                public_transport_days_per_week=0,
            )
        assert "daily_distance_km" in str(exc_info.value) or "greater than" in str(exc_info.value).lower()

    def test_negative_electricity_rejected(self):
        """Negative electricity kWh should raise ValidationError."""
        with pytest.raises(ValidationError):
            EnergyData(monthly_electricity_kwh=-50.0, daily_ac_hours=2.0, renewable_energy="no")

    def test_negative_waste_kg_rejected(self):
        """Negative waste kg should raise ValidationError."""
        with pytest.raises(ValidationError):
            WasteData(recycling_habit="always", weekly_waste_kg=-5.0)


class TestInvalidDietTypeRejected:
    """Docstring for class TestInvalidDietTypeRejected."""
    def test_invalid_diet_type_rejected(self):
        """Diet type not in allowed values should raise ValidationError."""
        with pytest.raises(ValidationError):
            FoodData(diet_type="carnivore", weekly_meat_meals=5)

    def test_invalid_vehicle_type_rejected(self):
        """Invalid vehicle type should raise ValidationError."""
        with pytest.raises(ValidationError):
            TransportData(
                daily_distance_km=10.0,
                vehicle_type="helicopter",
                fuel_type="petrol",
                public_transport_days_per_week=0,
            )

    def test_invalid_recycling_habit_rejected(self):
        """Invalid recycling habit should raise ValidationError."""
        with pytest.raises(ValidationError):
            WasteData(recycling_habit="occasionally", weekly_waste_kg=5.0)

    def test_invalid_renewable_energy_value_rejected(self):
        """Invalid renewable_energy value should raise ValidationError."""
        with pytest.raises(ValidationError):
            EnergyData(monthly_electricity_kwh=100.0, daily_ac_hours=2.0, renewable_energy="maybe")


class TestMissingRequiredFieldsRejected:
    """Docstring for class TestMissingRequiredFieldsRejected."""
    def test_missing_required_email(self):
        """Missing email should raise ValidationError."""
        with pytest.raises(ValidationError):
            UserRegister(password="testpassword123", name="Test User")

    def test_missing_required_password(self):
        """Missing password should raise ValidationError."""
        with pytest.raises(ValidationError):
            UserRegister(email="test@example.com", name="Test User")

    def test_password_too_short(self):
        """Password shorter than 8 chars should raise ValidationError."""
        with pytest.raises(ValidationError):
            UserRegister(email="test@example.com", password="short", name="Test")

    def test_invalid_email_format(self):
        """Invalid email format should raise ValidationError."""
        with pytest.raises(ValidationError):
            UserRegister(
                email="not-an-email",
                password="validpassword123",
                name="Test User",
            )


class TestSQLInjectionInputSanitized:
    """Docstring for class TestSQLInjectionInputSanitized."""
    def test_sql_injection_in_diet_type_rejected(self):
        """SQL injection attempt in diet_type should be rejected by validator."""
        malicious_inputs = [
            "'; DROP TABLE users; --",
            "vegan' OR '1'='1",
            "vegan UNION SELECT * FROM users --",
        ]
        for malicious in malicious_inputs:
            with pytest.raises(ValidationError):
                FoodData(diet_type=malicious, weekly_meat_meals=0)

    def test_sql_injection_in_vehicle_type_rejected(self):
        """SQL injection in vehicle_type should be rejected by enum validator."""
        with pytest.raises(ValidationError):
            TransportData(
                daily_distance_km=10.0,
                vehicle_type="car'; DROP TABLE users;--",
                fuel_type="petrol",
                public_transport_days_per_week=0,
            )

    def test_extra_fields_rejected(self):
        """Extra/unknown fields should be rejected (extra='forbid')."""
        with pytest.raises(ValidationError):
            FoodData(
                diet_type="vegan",
                weekly_meat_meals=0,
                malicious_field="'; DROP TABLE users;--",
            )

    def test_extremely_large_values_rejected(self):
        """Unrealistically large values should be rejected by bounds."""
        with pytest.raises(ValidationError):
            TransportData(
                daily_distance_km=99999.0,  # > 2000 km limit
                vehicle_type="car",
                fuel_type="petrol",
                public_transport_days_per_week=0,
            )

    def test_public_transport_days_exceeding_week_rejected(self):
        """More than 7 days/week should be rejected."""
        with pytest.raises(ValidationError):
            TransportData(
                daily_distance_km=10.0,
                vehicle_type="car",
                fuel_type="petrol",
                public_transport_days_per_week=8,
            )


class TestAssessmentCreateValidation:
    """Docstring for class TestAssessmentCreateValidation."""
    def test_valid_partial_assessment_allowed(self):
        """Partial assessment (only some sections) should be valid."""
        data = AssessmentCreate(
            food=FoodData(diet_type="vegetarian", weekly_meat_meals=2)
        )
        assert data.food is not None
        assert data.transport is None

    def test_empty_assessment_is_valid(self):
        """Empty assessment (no sections) should be valid for draft saves."""
        data = AssessmentCreate()
        assert data.transport is None
        assert data.energy is None
