"""
Authentication schemas for Supabase-integrated endpoints.
"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, constr, root_validator


class SignupRequest(BaseModel):
    """Payload used to register a new user via Supabase Auth."""

    email: EmailStr
    password: constr(min_length=8, max_length=128)
    username: constr(min_length=3, max_length=32) | None = None

    @root_validator(pre=True)
    def _default_username(cls, values: dict) -> dict:
        email = values.get("email")
        username = values.get("username")
        if email and not username:
            base = email.split("@", 1)[0]
            generated = base[:32]
            if len(generated) < 3:
                generated = (generated + "player")[:3]
            values["username"] = generated
        return values


class LoginRequest(BaseModel):
    """Payload used to authenticate an existing user."""

    email: EmailStr
    password: constr(min_length=8, max_length=128)


class RefreshRequest(BaseModel):
    """Payload for exchanging a refresh token for new credentials."""

    refresh_token: str = Field(..., min_length=16)


class LogoutRequest(BaseModel):
    """Payload for revoking an active session."""

    refresh_token: Optional[str] = Field(default=None, min_length=16)


class TokenResponse(BaseModel):
    """Standard token response returned by Supabase Auth."""

    access_token: str
    refresh_token: str
    expires_in: Optional[int] = None


