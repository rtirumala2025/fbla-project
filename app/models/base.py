"""
SQLAlchemy declarative base classes and mixins.

Defining the base model in a dedicated module keeps ORM imports centralized
and allows other modules to import `Base` without creating cyclic references.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Declarative base class for all ORM models."""


class TimestampMixin:
    """
    Common timestamp columns for models.

    Automatically populates `created_at` and `updated_at` using PostgreSQL's
    `NOW()` function. SQLAlchemy handles `updated_at` refreshes on UPDATE.
    """

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

