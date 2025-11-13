"""
Social graph ORM models.

Defines friendship relationships between users and public pet profiles that power
the social layer features (friend lists, leaderboards, and public profile browsing).
"""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, Enum as SQLEnum, ForeignKey, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class FriendStatus(str, Enum):
    """Lifecycle states for a friendship request."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


class Friendship(Base, TimestampMixin):
    """
    Represents a directed friendship record.

    The requesting user is stored as ``user_id`` and the recipient as ``friend_id``.
    Once a request is accepted the record remains symmetric for lookups by either
    party via the helper service functions.
    """

    __tablename__ = "friends"
    __table_args__ = (
        UniqueConstraint("user_id", "friend_id", name="uq_friend_pair"),
        CheckConstraint("user_id <> friend_id", name="chk_friend_self"),
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
    friend_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    status: Mapped[FriendStatus] = mapped_column(
        SQLEnum(FriendStatus, name="friend_status", native_enum=False),
        nullable=False,
        default=FriendStatus.PENDING,
    )
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("NOW()"))
    responded_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    requester = relationship("User", foreign_keys=[user_id], lazy="joined")
    recipient = relationship("User", foreign_keys=[friend_id], lazy="joined")


class PublicProfile(Base, TimestampMixin):
    """
    Publicly visible pet profile linked to a user.

    The profile caches frequently accessed leaderboard metrics (XP, coins, achievement
    unlocks) to keep social queries performant.
    """

    __tablename__ = "public_profiles"
    __table_args__ = (
        UniqueConstraint("user_id", name="uq_public_profiles_user"),
        UniqueConstraint("pet_id", name="uq_public_profiles_pet"),
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
    pet_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("pets.id", ondelete="CASCADE"),
        nullable=False,
    )
    display_name: Mapped[str] = mapped_column(String(60), nullable=False)
    bio: Mapped[Optional[str]] = mapped_column(String(300), nullable=True)
    achievements: Mapped[List[dict[str, str]]] = mapped_column(JSONB, nullable=False, default=list)
    total_xp: Mapped[int] = mapped_column(nullable=False, default=0)
    total_coins: Mapped[int] = mapped_column(nullable=False, default=0)
    is_visible: Mapped[bool] = mapped_column(nullable=False, default=True)

    owner = relationship("User", backref="public_profile", lazy="joined")
    pet = relationship("Pet", lazy="joined")


