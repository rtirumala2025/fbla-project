"""Security helpers for validating Supabase JWT tokens."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import jwt
from fastapi import HTTPException, status

from app.core.config import get_settings


@dataclass
class AuthClaims:
    """Subset of Supabase JWT claims used by the application."""

    subject: str
    email: Optional[str]
    role: Optional[str]
    exp: int

    @property
    def user_id(self) -> str:
        return self.subject

    def is_expired(self) -> bool:
        return datetime.fromtimestamp(self.exp, tz=timezone.utc) < datetime.now(tz=timezone.utc)


class TokenValidationError(HTTPException):
    def __init__(self, detail: str = "Invalid authentication credentials.") -> None:
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def decode_access_token(token: str) -> AuthClaims:
    """Decode and validate a Supabase-issued JWT access token."""
    settings = get_settings()
    secret = settings.supabase_jwt_secret or settings.jwt_secret
    if not secret:
        raise TokenValidationError("JWT secret not configured.")

    try:
        payload: Dict[str, Any] = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except jwt.ExpiredSignatureError as exc:  # pragma: no cover - upstream library
        raise TokenValidationError("Token has expired.") from exc
    except jwt.InvalidTokenError as exc:  # pragma: no cover - upstream library
        raise TokenValidationError("Invalid token provided.") from exc

    sub = payload.get("sub") or payload.get("user_id")
    if not sub:
        raise TokenValidationError("Token missing subject claim.")

    exp = payload.get("exp")
    if exp is None:
        raise TokenValidationError("Token missing expiry claim.")

    claims = AuthClaims(
        subject=sub,
        email=payload.get("email"),
        role=payload.get("role"),
        exp=exp,
    )

    if claims.is_expired():
        raise TokenValidationError("Token has expired.")

    return claims
