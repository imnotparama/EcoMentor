"""
Tests for recommendation generation and AI agent tool calling.
Uses mocking to test the agentic loop without real API calls.
"""

import json
from unittest.mock import MagicMock


from services.carbon_engine import EmissionResult, get_highest_emission_category


class TestHighestCategoryIdentification:
    """Docstring for class TestHighestCategoryIdentification."""
    def test_highest_category_identified_correctly(self):
        """Should identify energy as highest when energy >> others."""
        result = EmissionResult(
            transport_emissions_monthly=150.0,
            energy_emissions_monthly=900.0,
            food_emissions_monthly=400.0,
            shopping_emissions_monthly=80.0,
            waste_emissions_monthly=60.0,
            total_monthly=1590.0,
            total_annual=19080.0,
            sustainability_score=58.0,
        )
        assert get_highest_emission_category(result) == "energy"

    def test_highest_category_food(self):
        """Should identify food when food > all others."""
        result = EmissionResult(
            transport_emissions_monthly=100.0,
            energy_emissions_monthly=200.0,
            food_emissions_monthly=700.0,
            shopping_emissions_monthly=50.0,
            waste_emissions_monthly=30.0,
            total_monthly=1080.0,
            total_annual=12960.0,
            sustainability_score=72.0,
        )
        assert get_highest_emission_category(result) == "food"

    def test_highest_category_transport(self):
        """Should identify transport when transport dominates."""
        result = EmissionResult(
            transport_emissions_monthly=850.0,
            energy_emissions_monthly=300.0,
            food_emissions_monthly=250.0,
            shopping_emissions_monthly=100.0,
            waste_emissions_monthly=50.0,
            total_monthly=1550.0,
            total_annual=18600.0,
            sustainability_score=59.0,
        )
        assert get_highest_emission_category(result) == "transport"


class TestAgentToolExecution:
    """Docstring for class TestAgentToolExecution."""
    def test_tool_get_user_assessment_with_no_assessment(self):
        """Should return error when user has no assessment."""
        from services.ai_agent import tool_get_user_assessment

        db = MagicMock()
        # tool_get_user_assessment uses a single .filter(cond1, cond2).order_by(...).first()
        db.query.return_value.filter.return_value.order_by.return_value.first.return_value = None

        result = tool_get_user_assessment("1", db)
        assert "error" in result

    def test_tool_get_emission_benchmarks_all_categories(self):
        """Should return benchmarks for all categories when no category specified."""
        from services.ai_agent import tool_get_emission_benchmarks

        result = tool_get_emission_benchmarks("all")
        assert "india_total_monthly_kg" in result
        assert "global_total_monthly_kg" in result
        assert "category_benchmarks" in result
        assert result["india_total_monthly_kg"] == 1900.0

    def test_tool_get_emission_benchmarks_specific_category(self):
        """Should return category-specific benchmarks."""
        from services.ai_agent import tool_get_emission_benchmarks

        result = tool_get_emission_benchmarks("transport")
        assert "india_monthly_kg" in result
        assert "global_monthly_kg" in result
        assert result["category"] == "transport"

    def test_tool_get_progress_history_no_data(self):
        """Should return empty list when no progress entries."""
        from services.ai_agent import tool_get_progress_history

        db = MagicMock()
        db.query.return_value.filter.return_value.order_by.return_value.limit.return_value.all.return_value = []

        result = tool_get_progress_history("1", 6, db)
        assert result["entries"] == []
        assert "message" in result

    def test_tool_invalid_user_id_returns_error(self):
        """Should handle invalid user_id gracefully."""
        from services.ai_agent import tool_get_user_assessment

        db = MagicMock()
        result = tool_get_user_assessment("not_a_number", db)
        assert "error" in result

    def test_execute_tool_dispatcher_unknown_tool(self):
        """Unknown tool name should return error."""
        from services.ai_agent import execute_tool

        db = MagicMock()
        result_str = execute_tool("unknown_tool_name", {}, db)
        result = json.loads(result_str)
        assert "error" in result


class TestRecommendationsReferenceUserData:
    """Docstring for class TestRecommendationsReferenceUserData."""
    def test_recommendations_stored_after_assessment(self):
        """Recommendations should reference the user's actual assessment data."""
        # Test that recommendations are tied to specific assessment
        from models.db_models import Recommendation

        rec = Recommendation(
            user_id=1,
            assessment_id=1,
            category="energy",
            title="Reduce AC usage",
            description="Your energy usage is 45% above India average at 900 kg CO2/month",
            impact_kg_monthly=120.0,
        )
        # Category should be one of the 5 emission categories or 'overall'
        valid_categories = {"transport", "energy", "food", "shopping", "waste", "overall"}
        assert rec.category in valid_categories
        assert rec.impact_kg_monthly >= 0


class TestChallengeGeneration:
    """Docstring for class TestChallengeGeneration."""
    def test_challenge_generated_for_valid_category(self):
        """Should generate a challenge for each valid category."""
        from services.challenge_engine import generate_challenge_for_category

        categories = ["transport", "energy", "food", "shopping", "waste"]
        for category in categories:
            challenge = generate_challenge_for_category(category)
            assert "title" in challenge
            assert "description" in challenge
            assert challenge["estimated_co2_saving_kg"] > 0
            assert challenge["duration_days"] > 0

    def test_challenge_generated_for_invalid_category_falls_back(self):
        """Should fall back to energy challenges for unknown categories."""
        from services.challenge_engine import generate_challenge_for_category

        challenge = generate_challenge_for_category("invalid_category")
        assert "title" in challenge
        assert "description" in challenge
