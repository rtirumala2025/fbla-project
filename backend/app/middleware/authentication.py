"""Middleware to attach authenticated user details to the request state."""
from __future__ import annotations

from typing import Iterable, Optional

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.security import TokenValidationError, decode_access_token
from app.models import AuthenticatedUser


class JWTAuthenticationMiddleware(BaseHTTPMiddleware):
    """Decode bearer tokens and attach user details to the request state."""

    def __init__(self, app, *, excluded_paths: Optional[Iterable[str]] = None):  # type: ignore[no-untyped-def]
        super().__init__(app)
        self._excluded_paths = set(excluded_paths or [])

    async def dispatch(self, request: Request, call_next):  # type: ignore[override]
        path = request.url.path
        if any(path.startswith(prefix) for prefix in self._excluded_paths):
            return await call_next(request)

        authorization = request.headers.get("Authorization")
        if authorization and authorization.lower().startswith("bearer "):
            token = authorization.split(" ", 1)[1]
            try:
                claims = decode_access_token(token)
                request.state.user = AuthenticatedUser(
                    id=claims.user_id,
                    email=claims.email,
                    role=claims.role,
                )
            except TokenValidationError:
                request.state.user = None
        else:
            request.state.user = None

        response = await call_next(request)
        return response
