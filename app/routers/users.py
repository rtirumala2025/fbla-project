"""
User management API routes.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import UserCreate, UserRead
from app.services import UserAlreadyExistsError, create_user, list_users

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[UserRead])
async def list_user_accounts(
    session: AsyncSession = Depends(get_db),
    limit: int = Query(default=100, ge=1, le=250),
) -> List[UserRead]:
    """
    Return a paginated listing of user accounts.
    """

    return await list_users(session, limit=limit)


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user_account(payload: UserCreate, session: AsyncSession = Depends(get_db)) -> UserRead:
    """
    Create a new local user account.
    """

    try:
        return await create_user(session, payload)
    except UserAlreadyExistsError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


