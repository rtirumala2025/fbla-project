"""
ORM models backing the analytics and reporting subsystem.

The snapshot tables persist aggregated pet wellbeing and finance metrics for
daily, weekly, and monthly periods so that analytics endpoints can serve cached
historical data efficiently. Notifications capture significant stat changes
between snapshots to surface actionable insights to the user interface.
"""

from __future__ import annotations

from datetime import date
from typing import Optional
from uuid import UUID

from sqlalchemy import (
    Boolean,
    Date,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class AnalyticsDailySnapshot(Base, TimestampMixin):
    """
    Persisted aggregation of a user's daily care and finance activity.

    Each row captures the totals for a single day and stores AI-generated
    summaries so that repeated analytics requests can reuse cached insights.
    """

    __tablename__ = "analytics_daily_snapshots"
    __table_args__ = (
        UniqueConstraint("user_id", "snapshot_date", name="uq_analytics_daily_user_date"),
    )

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
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)

    coins_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    coins_spent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    net_coins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    happiness_gain: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    health_change: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    games_played: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    pet_actions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    avg_happiness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_health: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_energy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_cleanliness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class AnalyticsWeeklySnapshot(Base, TimestampMixin):
    """
    Aggregated analytics for a rolling seven-day period.
    """

    __tablename__ = "analytics_weekly_snapshots"
    __table_args__ = (
        UniqueConstraint("user_id", "period_start", name="uq_analytics_weekly_user_start"),
    )

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
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    coins_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    coins_spent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    net_coins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    avg_happiness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_health: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_energy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_cleanliness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    total_happiness_gain: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_health_change: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_games_played: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_pet_actions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class AnalyticsMonthlySnapshot(Base, TimestampMixin):
    """
    Aggregated analytics for a calendar-like thirty-day period.
    """

    __tablename__ = "analytics_monthly_snapshots"
    __table_args__ = (
        UniqueConstraint("user_id", "period_start", name="uq_analytics_monthly_user_start"),
    )

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
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)

    coins_earned: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    coins_spent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    net_coins: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    avg_happiness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_health: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_energy: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    avg_cleanliness: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    total_happiness_gain: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_health_change: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_games_played: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_pet_actions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    ai_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)


class AnalyticsNotification(Base, TimestampMixin):
    """
    Notification generated when meaningful stat deltas occur between periods.
    """

    __tablename__ = "analytics_notifications"

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
    daily_snapshot_id: Mapped[Optional[UUID]] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("analytics_daily_snapshots.id", ondelete="SET NULL"),
        nullable=True,
    )
    period_type: Mapped[str] = mapped_column(String(16), nullable=False, default="daily")
    reference_date: Mapped[date] = mapped_column(Date, nullable=False)

    stat: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    change: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    severity: Mapped[str] = mapped_column(String(16), nullable=False, default="info")
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


