"""
SQLAlchemy model for cached AI pet art generations.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import DateTime, String, Text, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class PetArtCache(Base, TimestampMixin):
    __tablename__ = "pet_art_cache"
    __table_args__ = (UniqueConstraint("user_id", "pet_id", "prompt_hash", name="uq_pet_art_prompt"),)

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    pet_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    prompt_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    style: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mood: Mapped[str | None] = mapped_column(String(32), nullable=True)
    accessory_ids: Mapped[list[str]] = mapped_column(JSONB, nullable=False, server_default=text("'[]'::jsonb"))
    image_base64: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, nullable=False, server_default=text("'{}'::jsonb"))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

