"""
ORM models for quests and user quest progress tracking.
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, Enum as SQLEnum, ForeignKey, Integer, JSON, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class QuestType(str, Enum):
    """Quest cadence classification."""

    DAILY = "daily"
    WEEKLY = "weekly"
    EVENT = "event"


class QuestDifficulty(str, Enum):
    """Difficulty scaling used by the AI coach."""

    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"
    HEROIC = "heroic"


class QuestStatus(str, Enum):
    """Per-user quest state."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLAIMED = "claimed"


class Quest(Base, TimestampMixin):
    """
    Quest catalog entry that defines the challenge, rewards, and active window.
    """

    __tablename__ = "quests"
    __table_args__ = (
        UniqueConstraint("quest_key", name="uq_quests_key"),
    )

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    quest_key: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    quest_type: Mapped[QuestType] = mapped_column(SQLEnum(QuestType, name="quest_type", native_enum=False), nullable=False)
    difficulty: Mapped[QuestDifficulty] = mapped_column(
        SQLEnum(QuestDifficulty, name="quest_difficulty", native_enum=False),
        nullable=False,
    )
    rewards: Mapped[Dict[str, Any]] = mapped_column(JSON, nullable=False)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    icon: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    start_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    end_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    user_quests = relationship("UserQuest", back_populates="quest", lazy="selectin")


class UserQuest(Base, TimestampMixin):
    """
    Per-user quest progress and reward claim information.
    """

    __tablename__ = "user_quests"
    __table_args__ = (
        UniqueConstraint("user_id", "quest_id", name="uq_user_quests_user_quest"),
        CheckConstraint("progress >= 0", name="ck_user_quests_progress_positive"),
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
    quest_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("quests.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[QuestStatus] = mapped_column(
        SQLEnum(QuestStatus, name="quest_status", native_enum=False),
        nullable=False,
        default=QuestStatus.PENDING,
    )
    progress: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    target_value: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    last_progress_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    claimed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    quest = relationship("Quest", back_populates="user_quests", lazy="joined")


