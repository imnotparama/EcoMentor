"""
Pytest configuration and shared fixtures for EcoMentor AI tests.

Provides:
- An in-memory SQLite test database (isolated per test session)
- A FastAPI TestClient with the test DB injected via dependency override
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session

from database import get_db
from models.db_models import Base
from main import app

# ── Test Database ──────────────────────────────────────────────────────────────

TEST_DATABASE_URL = "sqlite:///:memory:"

_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
_TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


@pytest.fixture(scope="session", autouse=True)
def create_test_tables():
    """Create all tables in the in-memory test DB once per session."""
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture()
def db() -> Session:
    """Yield an isolated DB session for each test; rolls back after."""
    connection = _engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db: Session) -> TestClient:
    """FastAPI TestClient with the test DB injected."""

    def override_get_db():
        try:
            yield db
        finally:
            pass  # Rollback handled by the db fixture

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()
