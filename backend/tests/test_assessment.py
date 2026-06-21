"""
Regression tests for assessment completeness and input validation.
Ensures that incomplete drafts cannot be completed and invalid string sentinels are rejected.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_complete_incomplete_assessment_rejected(client: TestClient, db: Session):
    """Calling POST /api/assessment/complete on a new or partial draft should be rejected with 422."""
    # Register and login
    client.post(
        "/api/auth/register",
        json={"email": "assess_user@example.com", "password": "Password123", "name": "Assess User"},
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "assess_user@example.com", "password": "Password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Save a step to create the draft, but omit most inputs
    client.post(
        "/api/assessment/save",
        json={
            "transport": {
                "daily_distance_km": 10.0,
                "vehicle_type": "car",
                "fuel_type": "petrol",
                "public_transport_days_per_week": 2,
            }
        },
        headers=headers,
    )

    # Attempt to complete the assessment — should fail since energy, food, shopping, and waste are missing
    complete_resp = client.post("/api/assessment/complete", headers=headers)
    assert complete_resp.status_code == 422
    data = complete_resp.json()
    assert "incomplete" in data["detail"].lower()
    assert "energy" in data["detail"]
    assert "food" in data["detail"]
    assert "shopping" in data["detail"]
    assert "waste" in data["detail"]


def test_save_empty_sentinel_rejected(client: TestClient, db: Session):
    """Saving an empty string sentinel for enum fields like vehicle_type should be rejected with 422."""
    # Register and login
    client.post(
        "/api/auth/register",
        json={"email": "sentinel_user@example.com", "password": "Password123", "name": "Sentinel User"},
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "sentinel_user@example.com", "password": "Password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to save transport step with an empty vehicle_type sentinel ''
    save_resp = client.post(
        "/api/assessment/save",
        json={
            "transport": {
                "daily_distance_km": 10.0,
                "vehicle_type": "",  # Sentinel value
                "fuel_type": "petrol",
                "public_transport_days_per_week": 2,
            }
        },
        headers=headers,
    )
    assert save_resp.status_code == 422
    data = save_resp.json()
    assert "vehicle_type" in str(data["detail"])


def test_get_draft_and_current_assessment(client: TestClient, db: Session):
    """Test retrieval of current draft, completed assessment, and recommendations."""
    # Register and login
    client.post(
        "/api/auth/register",
        json={"email": "retrieve_user@example.com", "password": "Password123", "name": "Retrieve User"},
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "retrieve_user@example.com", "password": "Password123"},
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. No completed assessment initially (GET /current should be 404)
    curr_resp = client.get("/api/assessment/current", headers=headers)
    assert curr_resp.status_code == 404

    # 2. No draft assessment initially (GET /draft should be 404)
    draft_resp = client.get("/api/assessment/draft", headers=headers)
    assert draft_resp.status_code == 404

    # 3. Save a step (creates a draft)
    client.post(
        "/api/assessment/save",
        json={
            "transport": {
                "daily_distance_km": 15.0,
                "vehicle_type": "car",
                "fuel_type": "petrol",
                "public_transport_days_per_week": 0,
            }
        },
        headers=headers,
    )

    # 4. Now GET /draft should return 200
    draft_resp = client.get("/api/assessment/draft", headers=headers)
    assert draft_resp.status_code == 200
    assert draft_resp.json()["daily_distance_km"] == 15.0

    # 5. Save the rest of the sections to complete the assessment
    client.post(
        "/api/assessment/save",
        json={
            "energy": {"monthly_electricity_kwh": 100, "daily_ac_hours": 1, "renewable_energy": "no"},
            "food": {"diet_type": "vegan", "weekly_meat_meals": 0},
            "shopping": {"monthly_online_purchases": 1, "monthly_new_clothing": 1},
            "waste": {"recycling_habit": "always", "weekly_waste_kg": 5},
        },
        headers=headers,
    )

    # Complete it
    comp_resp = client.post("/api/assessment/complete", headers=headers)
    assert comp_resp.status_code == 200

    # 6. Now GET /current should return 200
    curr_resp = client.get("/api/assessment/current", headers=headers)
    assert curr_resp.status_code == 200
    assert curr_resp.json()["is_complete"] is True

    # 7. GET /recommendations should return recommendations list
    recs_resp = client.get("/api/assessment/recommendations", headers=headers)
    assert recs_resp.status_code == 200
    assert isinstance(recs_resp.json(), list)

