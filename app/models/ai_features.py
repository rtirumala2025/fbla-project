"""
ORM models for AI feature persistence.

This module defines database models for:
- AI chat sessions and messages
- Budget advisor analysis history
- Coach advice history
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional, Union
from uuid import UUID

from sqlalchemy import Date, DateTime, ForeignKey, Integer, JSON, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AIChatSession(Base, TimestampMixin):
    """Stores AI chat session metadata."""

    __tablename__ = "ai_chat_sessions"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id: Mapped[str] = mapped_column(Text, nullable=False)
    last_message_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    metadata_json: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)


class AIChatMessage(Base):
    """Stores individual AI chat messages."""

    __tablename__ = "ai_chat_messages"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    session_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[Optional[dict]] = mapped_column("metadata", JSON, nullable=True)
    pet_state_json: Mapped[Optional[dict]] = mapped_column("pet_state", JSON, nullable=True)
    health_forecast_json: Mapped[Optional[dict]] = mapped_column("health_forecast", JSON, nullable=True)
    mood: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notifications_json: Mapped[Optional[dict]] = mapped_column("notifications", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("timezone('utc', now())"))


class BudgetAdvisorAnalysis(Base):
    """Stores budget advisor analysis history."""

    __tablename__ = "budget_advisor_analyses"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    analysis_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("timezone('utc', now())"))
    total_spending: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    total_income: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    net_balance: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    average_daily_spending: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    monthly_budget: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    transaction_count: Mapped[int] = mapped_column(Integer, nullable=False)
    top_categories_json: Mapped[list] = mapped_column("top_categories", JSON, nullable=False)
    trends_json: Mapped[list] = mapped_column("trends", JSON, nullable=False)
    overspending_alerts_json: Mapped[list] = mapped_column("overspending_alerts", JSON, nullable=False)
    suggestions_json: Mapped[list] = mapped_column("suggestions", JSON, nullable=False)
    analysis_period_start: Mapped[date] = mapped_column(Date, nullable=False)
    analysis_period_end: Mapped[date] = mapped_column(Date, nullable=False)
    full_analysis_json: Mapped[dict] = mapped_column("full_analysis", JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("timezone('utc', now())"))


class CoachAdviceHistory(Base):
    """Stores coach advice history."""

    __tablename__ = "coach_advice_history"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    advice_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("timezone('utc', now())"))
    mood: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    difficulty_hint: Mapped[str] = mapped_column(String(20), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    suggestions_json: Mapped[list] = mapped_column("suggestions", JSON, nullable=False)
    source: Mapped[str] = mapped_column(String(20), nullable=False)
    pet_stats_snapshot_json: Mapped[Optional[dict]] = mapped_column("pet_stats_snapshot", JSON, nullable=True)
    quest_context_json: Mapped[Optional[dict]] = mapped_column("quest_context", JSON, nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("timezone('utc', now())"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("timezone('utc', now())"))

