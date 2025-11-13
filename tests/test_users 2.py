"""
User persistence integration tests.

These tests exercise the user service layer against the configured database,
verifying that records can be created, retrieved, and cleaned up.
"""

from __future__ import annotations

import uuid

import pytest

from app.models.user import User, UserCreate
from app.services.user_service import create_user, get_user_by_email


@pytest.mark.asyncio
async def test_create_and_get_user(db_session):
    """
    Ensure a user can be created and fetched by email.
    """

    email = f"test-{uuid.uuid4()}@example.com"
    user_in = UserCreate(email=email, password="supersecret123")

    created = await create_user(db_session, user_in)
    assert created.email == email

    fetched = await get_user_by_email(db_session, email)
    assert fetched is not None
    assert fetched.id == created.id

    # Clean up the inserted record to keep the database tidy.
    user_record = await db_session.get(User, created.id)
    if user_record:
        await db_session.delete(user_record)
        await db_session.commit()

