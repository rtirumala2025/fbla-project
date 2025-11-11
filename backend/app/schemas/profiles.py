"""Schemas for profile management routes."""
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class Preferences(BaseModel):
    sound: bool = True
    music: bool = True
    notifications: bool = True
    reduced_motion: bool = False
    high_contrast: bool = False


class ProfileBase(BaseModel):
    username: str = Field(min_length=3, max_length=32)
    avatar_url: str | None = None


class ProfileCreate(ProfileBase):
    preferences: Preferences | None = None


class ProfileUpdate(BaseModel):
    username: str | None = Field(default=None, min_length=3, max_length=32)
    avatar_url: str | None = None
    coins: int | None = Field(default=None, ge=0)
    preferences: Preferences | None = None


class ProfileResponse(ProfileBase):
    user_id: str
    coins: int
    created_at: datetime | None = None
    updated_at: datetime | None = None
    preferences: Preferences = Field(default_factory=Preferences)

    model_config = {
        "from_attributes": True,
    }


class AvatarUploadResponse(BaseModel):
    avatar_url: str
