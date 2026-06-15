"""
Integration tests for auth endpoints and health check.
Uses the TestClient + in-memory SQLite DB from conftest.py.
"""

import pytest
from fastapi.testclient import TestClient


class TestHealthEndpoint:
    def test_health_returns_ok(self, client: TestClient):
        """GET /health should always return 200 with status 'ok'."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "version" in data

    def test_root_returns_api_info(self, client: TestClient):
        """GET / should return API info with docs and health links."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "docs" in data
        assert "health" in data


class TestRegisterEndpoint:
    def test_register_success(self, client: TestClient):
        """POST /api/auth/register with valid data should return 201 + token."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "password": "Pass123!",
                "name": "Test User",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["name"] == "Test User"
        # Password must never appear in response
        assert "password" not in data
        assert "hashed_password" not in data

    def test_register_duplicate_email_returns_409(self, client: TestClient):
        """Registering with an existing email should return 409 Conflict."""
        payload = {
            "email": "duplicate@example.com",
            "password": "Pass123!",
            "name": "First User",
        }
        client.post("/api/auth/register", json=payload)
        response = client.post("/api/auth/register", json=payload)
        assert response.status_code == 409

    def test_register_invalid_email_returns_422(self, client: TestClient):
        """Invalid email format should return 422 Unprocessable Entity."""
        response = client.post(
            "/api/auth/register",
            json={"email": "not-an-email", "password": "Pass123!", "name": "Test"},
        )
        assert response.status_code == 422

    def test_register_short_password_returns_422(self, client: TestClient):
        """Password shorter than 8 chars should return 422."""
        response = client.post(
            "/api/auth/register",
            json={"email": "test2@example.com", "password": "Ab1", "name": "Test"},
        )
        assert response.status_code == 422

    def test_register_password_no_digit_returns_422(self, client: TestClient):
        """Password with only letters (no digit) should return 422."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test3@example.com",
                "password": "onlyletters",
                "name": "Test",
            },
        )
        assert response.status_code == 422

    def test_register_password_no_letter_returns_422(self, client: TestClient):
        """Password with only digits (no letter) should return 422."""
        response = client.post(
            "/api/auth/register",
            json={
                "email": "test4@example.com",
                "password": "12345678",
                "name": "Test",
            },
        )
        assert response.status_code == 422


class TestLoginEndpoint:
    def _register_user(self, client: TestClient, email: str, password: str, name: str):
        client.post(
            "/api/auth/register",
            json={"email": email, "password": password, "name": name},
        )

    def test_login_success(self, client: TestClient):
        """POST /api/auth/login with correct credentials should return 200 + token."""
        self._register_user(client, "login@example.com", "Pass123!", "Login User")
        response = client.post(
            "/api/auth/login",
            json={"email": "login@example.com", "password": "Pass123!"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "login@example.com"

    def test_login_wrong_password_returns_401(self, client: TestClient):
        """Wrong password should return 401 Unauthorized."""
        self._register_user(client, "wrong@example.com", "Corr3ct!", "User")
        response = client.post(
            "/api/auth/login",
            json={"email": "wrong@example.com", "password": "W0ngPass!"},
        )
        assert response.status_code == 401

    def test_login_unknown_email_returns_401(self, client: TestClient):
        """Non-existent email should return 401 Unauthorized."""
        response = client.post(
            "/api/auth/login",
            json={"email": "nobody@example.com", "password": "Pass123!"},
        )
        assert response.status_code == 401


class TestMeEndpoint:
    def test_get_me_unauthenticated_returns_401(self, client: TestClient):
        """GET /api/auth/me without a token should return 401."""
        response = client.get("/api/auth/me")
        assert response.status_code == 401

    def test_get_me_authenticated_returns_user(self, client: TestClient):
        """GET /api/auth/me with valid token should return user profile."""
        # Register + login to get token
        client.post(
            "/api/auth/register",
            json={
                "email": "me@example.com",
                "password": "Pass123!",
                "name": "Me User",
            },
        )
        login_resp = client.post(
            "/api/auth/login",
            json={"email": "me@example.com", "password": "Pass123!"},
        )
        token = login_resp.json()["access_token"]

        response = client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "me@example.com"
        assert data["name"] == "Me User"


class TestSecurityHeaders:
    def test_security_headers_present(self, client: TestClient):
        """All responses should include critical security headers."""
        response = client.get("/health")
        assert response.headers.get("x-content-type-options") == "nosniff"
        assert response.headers.get("x-frame-options") == "DENY"
        assert response.headers.get("x-xss-protection") == "1; mode=block"
        assert response.headers.get("referrer-policy") == "strict-origin-when-cross-origin"
