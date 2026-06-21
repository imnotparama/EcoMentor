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
