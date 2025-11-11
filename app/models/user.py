"""
User ORM and Pydantic models.

The ORM model defines the database schema, while the Pydantic models provide
validated request/response schemas for API interactions.
"""

from __future__ import annotations

import hashlib
from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, constr
from sqlalchemy import String, UniqueConstraint, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base, TimestampMixin


class User(Base, TimestampMixin):
    """
    SQLAlchemy model representing application users.

    Note:
        Supabase already manages its own `auth.users` table. This table stores
        application-specific users and credentials.
    """

    __tablename__ = "users"
    __table_args__ = (UniqueConstraint("email", name="uq_users_email"),)

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=text("uuid_generate_v4()"),
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)


class UserCreate(BaseModel):
    """
    Schema for creating a new user.

    Validates email format and enforces a minimum password length.
    """

    email: EmailStr
    password: constr(min_length=8) = Field(..., description="Plain-text password (will be hashed)")


class UserRead(BaseModel):
    """
    Representation of a user returned to API consumers.
    """

    id: UUID
    email: EmailStr
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class UserUpdate(BaseModel):
    """
    Schema for updating user details.
    """

    email: Optional[EmailStr] = None
    password: Optional[constr(min_length=8)] = Field(
        default=None, description="Optional new password (plain-text; will be hashed)"
    )

    def dict(self, *args, **kwargs):
        """
        Override to exclude unset values by default.
        """

        kwargs.setdefault("exclude_unset", True)
        return super().dict(*args, **kwargs)


class UserLogin(BaseModel):
    """
    Schema for logging in a user.
    """

    email: EmailStr
    password: constr(min_length=8)


def hash_password(plain_password: str) -> str:
    """
    Hash the supplied password using SHA-256.

    Args:
        plain_password (str): Password provided by the user.

    Returns:
        str: Hexadecimal SHA-256 hash of the password.
    """

    return hashlib.sha256(plain_password.encode("utf-8")).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Compare a plain-text password with its hashed counterpart.
    """

    return hash_password(plain_password) == hashed_password

