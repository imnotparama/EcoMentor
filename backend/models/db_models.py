"""
SQLAlchemy ORM models for EcoMentor AI.
Schema designed to be migration-ready for PostgreSQL.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, func
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Docstring for class Base."""
    pass


class User(Base):
    """Docstring for class User."""
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    household_size: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    assessments: Mapped[list["Assessment"]] = relationship(
        "Assessment", back_populates="user", cascade="all, delete-orphan"
    )
    challenges: Mapped[list["Challenge"]] = relationship(
        "Challenge", back_populates="user", cascade="all, delete-orphan"
    )
    chat_messages: Mapped[list["ChatMessage"]] = relationship(
        "ChatMessage", back_populates="user", cascade="all, delete-orphan"
    )
    progress_entries: Mapped[list["ProgressEntry"]] = relationship(
        "ProgressEntry", back_populates="user", cascade="all, delete-orphan"
    )
    recommendations: Mapped[list["Recommendation"]] = relationship(
        "Recommendation", back_populates="user", cascade="all, delete-orphan"
    )


class Assessment(Base):
    """Docstring for class Assessment."""
    __tablename__ = "assessments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)

    # --- Transport ---
    daily_distance_km: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    vehicle_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fuel_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    public_transport_days_per_week: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # --- Energy ---
    monthly_electricity_kwh: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    daily_ac_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    renewable_energy: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    # --- Food ---
    diet_type: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    weekly_meat_meals: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # --- Shopping ---
    monthly_online_purchases: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    monthly_new_clothing: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # --- Waste ---
    recycling_habit: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    weekly_waste_kg: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # --- Computed Outputs ---
    transport_emissions_monthly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    energy_emissions_monthly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    food_emissions_monthly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    shopping_emissions_monthly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    waste_emissions_monthly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_monthly: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_annual: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sustainability_score: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # --- Meta ---
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="assessments")
    recommendations: Mapped[list["Recommendation"]] = relationship(
        "Recommendation", back_populates="assessment", cascade="all, delete-orphan"
    )

    # Composite index for the most common query: latest complete assessment per user
    __table_args__ = (
        Index("ix_assessments_user_complete", "user_id", "is_complete"),
    )


class Recommendation(Base):
    """Docstring for class Recommendation."""
    __tablename__ = "recommendations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id: Mapped[int] = mapped_column(Integer, ForeignKey("assessments.id"), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    impact_kg_monthly: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="recommendations")
    assessment: Mapped["Assessment"] = relationship("Assessment", back_populates="recommendations")


class Challenge(Base):
    """Docstring for class Challenge."""
    __tablename__ = "challenges"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    duration_days: Mapped[int] = mapped_column(Integer, nullable=False)
    estimated_co2_saving_kg: Mapped[float] = mapped_column(Float, nullable=False)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="challenges")


class ChatMessage(Base):
    """Docstring for class ChatMessage."""
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" | "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="chat_messages")

    # Index for efficient history loading per user
    __table_args__ = (
        Index("ix_chat_messages_user_created", "user_id", "created_at"),
    )


class ProgressEntry(Base):
    """Docstring for class ProgressEntry."""
    __tablename__ = "progress_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    month_year: Mapped[str] = mapped_column(String(7), nullable=False)  # "YYYY-MM"
    total_monthly: Mapped[float] = mapped_column(Float, nullable=False)
    sustainability_score: Mapped[float] = mapped_column(Float, nullable=False)
    transport_emissions: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    energy_emissions: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    food_emissions: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    shopping_emissions: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    waste_emissions: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="progress_entries")

    # Index for efficient progress timeline queries per user
    __table_args__ = (
        Index("ix_progress_entries_user", "user_id"),
    )
