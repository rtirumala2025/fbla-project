"""
Profile schemas exposed via the profiles API.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, Field


class Preferences(BaseModel):
    sound: bool = True
    music: bool = True
    notifications: bool = True
    reduced_motion: bool = False
    high_contrast: bool = False


class ProfileCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=32)
    avatar_url: Optional[str] = Field(default=None, max_length=255)
    title: Optional[str] = Field(default=None, max_length=80)
    bio: Optional[str] = Field(default=None, max_length=280)
    badges: Optional[List[str]] = None
    preferences: Optional[Preferences] = None


class ProfileUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=3, max_length=32)
    avatar_url: Optional[str] = Field(default=None, max_length=255)
    coins: Optional[int] = Field(default=None, ge=0)
    title: Optional[str] = Field(default=None, max_length=80)
    bio: Optional[str] = Field(default=None, max_length=280)
    badges: Optional[List[str]] = None
    preferences: Optional[Preferences] = None


class ProfileResponse(BaseModel):
    user_id: str
    username: str
    avatar_url: Optional[str]
    title: Optional[str] = None
    bio: Optional[str] = None
    badges: List[str] = Field(default_factory=list)
    coins: int
    preferences: Preferences = Field(default_factory=Preferences)
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class AvatarUploadResponse(BaseModel):
    avatar_url: str


class AvatarUpdateRequest(BaseModel):
    avatar_url: str = Field(..., min_length=1, max_length=255)


