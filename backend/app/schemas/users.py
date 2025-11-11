"""Pydantic schemas for user operations."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    id: str = Field(..., description="Unique identifier for the user")
    email: EmailStr
    display_name: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    display_name: str | None = Field(default=None, max_length=50)


class UserResponse(UserBase):
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "from_attributes": True,
    }
