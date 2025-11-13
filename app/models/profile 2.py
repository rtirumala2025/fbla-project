"""
Profiles and preference ORM models.
"""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin


class Profile(Base, TimestampMixin):
    """User-facing profile metadata."""

    __tablename__ = "profiles"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    username: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)
    avatar_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str | None] = mapped_column(String(80), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    coins: Mapped[int] = mapped_column(Integer, nullable=False, server_default=text("100"))
    badges: Mapped[list | None] = mapped_column(JSONB, nullable=True, server_default=text("'[]'::jsonb"))

    preferences: Mapped["UserPreferences"] = relationship(
        "UserPreferences",
        uselist=False,
        back_populates="profile",
        cascade="all, delete-orphan",
        primaryjoin="Profile.user_id == UserPreferences.user_id",
    )


class UserPreferences(Base, TimestampMixin):
    """Per-user preference toggles used by the front-end."""

    __tablename__ = "user_preferences"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("profiles.user_id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    sound: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    music: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("true"))
    reduced_motion: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))
    high_contrast: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("false"))

    profile: Mapped[Profile] = relationship(
        "Profile",
        back_populates="preferences",
        primaryjoin="Profile.user_id == UserPreferences.user_id",
    )


