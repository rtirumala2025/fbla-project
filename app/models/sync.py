"""
ORM model for cloud sync snapshots.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, Optional
from uuid import UUID

from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class CloudSyncSnapshot(Base, TimestampMixin):
    """
    Per-user cloud state snapshots used for synchronising offline progress.
    """

    __tablename__ = "cloud_sync_snapshots"
    __table_args__ = (UniqueConstraint("user_id", name="uq_cloud_sync_user_id"),)

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
    snapshot: Mapped[Dict] = mapped_column(JSON, nullable=False, default=dict)
    last_modified: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=text("CURRENT_TIMESTAMP"))
    last_device_id: Mapped[Optional[str]] = mapped_column(String(120), nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    conflict_log: Mapped[list] = mapped_column(JSON, nullable=False, default=list)


