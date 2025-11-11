"""Service layer for user operations."""
from __future__ import annotations

from typing import List, Optional

from asyncpg import Pool

from app.schemas import UserCreate, UserResponse


class UserService:
    """Thin abstraction over database interactions for user entities."""

    def __init__(self, pool: Optional[Pool]) -> None:
        self._pool = pool

    async def list_users(self) -> List[UserResponse]:
        # Placeholder implementation until real database queries are added.
        return []

    async def create_user(self, payload: UserCreate) -> UserResponse:
        # Placeholder implementation returning an echo of input data.
        return UserResponse(
            id="temp-user",
            email=payload.email,
            display_name=payload.display_name,
        )
