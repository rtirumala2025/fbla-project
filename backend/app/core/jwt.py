"""JWT authentication utilities."""
from __future__ import annotations

from fastapi import Depends, HTTPException, Request, status

from app.utils.dependencies import get_current_user
from app.models import AuthenticatedUser


def get_current_user_id(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> str:
    """
    Extract user ID from authenticated user.
    
    This is a convenience dependency for endpoints that only need the user ID
    rather than the full AuthenticatedUser object.
    """
    return current_user.id
