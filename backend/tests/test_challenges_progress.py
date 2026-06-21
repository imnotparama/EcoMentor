"""
Integration tests for challenges and progress endpoints.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def _setup_authenticated_user(client: TestClient) -> dict:
    """Helper to register, login, and return auth headers."""
    client.post(
        "/api/auth/register",
        json={"email": "test_cp@example.com", "password": "Password123", "name": "CP User"},
    )
    login_resp = client.post(
        "/api/auth/login",
        json={"email": "test_cp@example.com", "password": "Password123"},
    )
    token = login_resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_challenges_empty_initially(client: TestClient, db: Session):
    """GET /api/challenges should return an empty list initially."""
    headers = _setup_authenticated_user(client)
    response = client.get("/api/challenges", headers=headers)
    assert response.status_code == 200
    assert response.json() == []


def test_generate_challenge_without_assessment_fails(client: TestClient, db: Session):
    """Generating a challenge without completing an assessment first should return 404."""
    headers = _setup_authenticated_user(client)
    response = client.post("/api/challenges/generate", headers=headers)
    assert response.status_code == 404
    assert "assessment" in response.json()["detail"].lower()


def test_challenges_and_progress_flow(client: TestClient, db: Session):
    """Test full assessment, challenge generation, completion, and progress flow."""
    headers = _setup_authenticated_user(client)

    # 1. Complete an assessment first
    # Save the draft
    client.post(
        "/api/assessment/save",
        json={
            "transport": {
                "daily_distance_km": 10.0,
                "vehicle_type": "car",
                "fuel_type": "petrol",
                "public_transport_days_per_week": 2,
            },
            "energy": {
                "monthly_electricity_kwh": 200.0,
                "daily_ac_hours": 3.0,
                "renewable_energy": "no",
            },
            "food": {
                "diet_type": "mixed",
                "weekly_meat_meals": 4,
            },
            "shopping": {
                "monthly_online_purchases": 5,
                "monthly_new_clothing": 2,
            },
            "waste": {
                "recycling_habit": "sometimes",
                "weekly_waste_kg": 10.0,
            }
        },
        headers=headers,
    )

    # Complete it
    comp_resp = client.post("/api/assessment/complete", headers=headers)
    assert comp_resp.status_code == 200

    # 2. Verify challenge was auto-generated on completion
    challenges_resp = client.get("/api/challenges", headers=headers)
    assert challenges_resp.status_code == 200
    challenges = challenges_resp.json()
    assert len(challenges) == 1
    challenge_id = challenges[0]["id"]
    assert challenges[0]["completed"] is False

    # 3. Complete the challenge
    complete_resp = client.post(f"/api/challenges/{challenge_id}/complete", headers=headers)
    assert complete_resp.status_code == 200
    assert complete_resp.json()["completed"] is True

    # 4. Try completing again (should fail)
    complete_again_resp = client.post(f"/api/challenges/{challenge_id}/complete", headers=headers)
    assert complete_again_resp.status_code == 409

    # 5. Generate another challenge manually
    gen_resp = client.post("/api/challenges/generate", headers=headers)
    assert gen_resp.status_code == 200
    assert gen_resp.json()["completed"] is False

    # Verify active challenges count is 1 now (the new one)
    active_resp = client.get("/api/challenges/active", headers=headers)
    assert active_resp.status_code == 200
    assert len(active_resp.json()) == 1

    # 6. Verify progress entries
    progress_resp = client.get("/api/progress", headers=headers)
    assert progress_resp.status_code == 200
    progress_data = progress_resp.json()
    assert len(progress_data["entries"]) == 1
    assert progress_data["total_assessments"] == 1
    assert len(progress_data["completed_challenges"]) == 1

    # 7. Export user data
    export_resp = client.get("/api/progress/export", headers=headers)
    assert export_resp.status_code == 200
    assert "application/json" in export_resp.headers["Content-Type"]
    export_data = export_resp.json()
    assert export_data["user"]["email"] == "test_cp@example.com"
    assert len(export_data["assessments"]) == 1
    assert len(export_data["challenges"]) == 2
