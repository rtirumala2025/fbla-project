"""
Service layer for user persistence.

These functions encapsulate user-related database operations and provide a
clean, async API for routers or other services to consume.
"""

from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserCreate, UserRead, UserUpdate, hash_password


class UserAlreadyExistsError(ValueError):
    """Raised when attempting to create a user that already exists."""


class UserNotFoundError(ValueError):
    """Raised when a user cannot be located for an operation."""


async def create_user(session: AsyncSession, user: UserCreate) -> UserRead:
    """
    Persist a new user to the database.

    Args:
        session (AsyncSession): Active database session.
        user (UserCreate): Validated user creation data.

    Returns:
        UserRead: Created user record.

    Raises:
        UserAlreadyExistsError: If a user with the given email already exists.
        IntegrityError: For other database constraint violations.
    """

    result = await session.execute(select(User).where(User.email == user.email))
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise UserAlreadyExistsError(f"User with email '{user.email}' already exists.")

    new_user = User(
        email=user.email,
        password_hash=hash_password(user.password),
    )
    session.add(new_user)

    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise exc

    await session.refresh(new_user)
    return UserRead.from_orm(new_user)


async def get_user_by_email(session: AsyncSession, email: str) -> Optional[UserRead]:
    """
    Retrieve a user by email address.

    Args:
        session (AsyncSession): Active database session.
        email (str): Email address to search for.

    Returns:
        Optional[UserRead]: User if found, otherwise None.
    """

    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    return UserRead.from_orm(user) if user else None


async def get_user_model_by_email(session: AsyncSession, email: str) -> Optional[User]:
    """
    Retrieve the underlying ORM user instance by email.
    """

    result = await session.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


async def list_users(session: AsyncSession, limit: int = 100) -> List[UserRead]:
    """
    Retrieve a paginated list of users ordered by most recently created.
    """

    stmt = (
        select(User)
        .order_by(User.created_at.desc())
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [UserRead.from_orm(record) for record in result.scalars().all()]


async def update_user(session: AsyncSession, user_id: UUID, updates: UserUpdate) -> UserRead:
    """
    Apply updates to an existing user.

    Args:
        session (AsyncSession): Active database session.
        user_id (UUID): ID of the user to update.
        updates (UserUpdate): Partial update payload.

    Returns:
        UserRead: Updated user record.

    Raises:
        UserNotFoundError: If no user with the provided ID exists.
    """

    data = updates.dict()
    if "password" in data:
        password = data.pop("password")
        if password is not None:
            data["password_hash"] = hash_password(password)

    # Avoid running an update if nothing was provided.
    if not data:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise UserNotFoundError(str(user_id))
        return UserRead.from_orm(user)

    stmt = (
        update(User)
        .where(User.id == user_id)
        .values(**data)
        .returning(User)
    )
    result = await session.execute(stmt)
    updated = result.scalar_one_or_none()
    if updated is None:
        raise UserNotFoundError(str(user_id))

    return UserRead.from_orm(updated)

