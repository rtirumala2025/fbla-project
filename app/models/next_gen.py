"""
ORM models for next-generation features (voice commands, AR sessions).
"""

from __future__ import annotations

from typing import Dict, Optional
from uuid import UUID

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, JSON, String, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class VoiceCommand(Base, TimestampMixin):
    """
    Voice command history for tracking user voice interactions.
    """

    __tablename__ = "voice_commands"

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
    transcript: Mapped[str] = mapped_column(String(500), nullable=False)
    intent: Mapped[str] = mapped_column(String(100), nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    action: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    feedback: Mapped[str] = mapped_column(String(1000), nullable=False)
    execution_result: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)


class ARSession(Base, TimestampMixin):
    """
    AR session persistence for tracking AR interactions.
    """

    __tablename__ = "ar_sessions"

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
    session_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    device_info: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    anchor_data: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    pet_data: Mapped[Optional[Dict]] = mapped_column(JSON, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP")
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

