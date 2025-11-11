"""
JWT utility helpers for the Virtual Pet backend.

Provides functions to generate and validate access/refresh tokens, along with
FastAPI dependencies for authenticated routes.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import get_settings

Bearer = HTTPBearer(auto_error=False)


class TokenPayload(BaseModel):
    """
    Represents the contents of a decoded JWT.

    Supabase access tokens omit the ``type`` claim, so it is treated as optional
    and defaults to ``access`` when absent.
    """

    sub: str
    exp: int
    type: str = "access"
    role: Optional[str] = None
    email: Optional[str] = None


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
    """
    Internal helper to create a signed JWT.

    Args:
        subject (str): Subject (usually a user ID).
        expires_delta (timedelta): Token lifetime.
        token_type (str): Token type (e.g., "access" or "refresh").

    Returns:
        str: Encoded JWT.
    """

    settings = get_settings()
    expire = datetime.now(tz=timezone.utc) + expires_delta
    secret = settings.supabase_jwt_secret or settings.jwt_secret
    payload = {"sub": subject, "exp": expire, "type": token_type}
    return jwt.encode(payload, secret, algorithm="HS256")


def create_access_token(subject: str, expires_in_minutes: int = 60) -> str:
    """
    Generate an access token for the given subject.
    """

    return _create_token(subject, timedelta(minutes=expires_in_minutes), "access")


def create_refresh_token(subject: str, expires_in_days: int = 7) -> str:
    """
    Generate a refresh token for the given subject.
    """

    return _create_token(subject, timedelta(days=expires_in_days), "refresh")


def decode_token(token: str) -> TokenPayload:
    """
    Decode and validate a JWT, raising HTTPException on failure.
    """

    settings = get_settings()
    secret = settings.supabase_jwt_secret or settings.jwt_secret

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience=None,
            options={"verify_aud": False},
        )
        return TokenPayload(**payload)
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
        ) from exc


async def get_current_user_id(credentials: Annotated[Optional[HTTPAuthorizationCredentials], Depends(Bearer)]) -> str:
    """
    FastAPI dependency that retrieves the current user's ID from a Bearer token.
    """

    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    token_payload = decode_token(credentials.credentials)
    if token_payload.type != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    return token_payload.sub


__all__ = [
    "create_access_token",
    "create_refresh_token",
    "decode_token",
    "get_current_user_id",
    "TokenPayload",
]

