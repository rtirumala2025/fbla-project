"""
Integration tests for authentication endpoints.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from jose import JWTError
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import decode_token
from app.models.user import User


@pytest.mark.asyncio
async def test_signup_and_login_flow(client: AsyncClient, db_session: AsyncSession):
    """
    Ensure that signup creates a user and login returns valid tokens.
    """

    email = f"user-{uuid.uuid4()}@example.com"
    password = "SecurePassw0rd!"

    signup_response = await client.post(
        "/api/auth/signup",
        json={"email": email, "password": password},
    )
    assert signup_response.status_code == 201, signup_response.text
    signup_data = signup_response.json()
    assert "access_token" in signup_data
    assert "refresh_token" in signup_data
    assert signup_data["user"]["email"] == email

    # Duplicate signup should fail
    duplicate_response = await client.post(
        "/api/auth/signup",
        json={"email": email, "password": password},
    )
    assert duplicate_response.status_code == 400

    login_response = await client.post(
        "/api/auth/login",
        json={"email": email, "password": password},
    )
    assert login_response.status_code == 200
    login_data = login_response.json()
    assert login_data["user"]["email"] == email

    # Tokens should be decodable
    for token_key in ("access_token", "refresh_token"):
        try:
            payload = decode_token(login_data[token_key])
            assert payload.sub == signup_data["user"]["id"]
        except JWTError as exc:  # pragma: no cover - explicit failure path
            pytest.fail(f"Token decoding failed: {exc}")

    # Invalid password should fail
    bad_login = await client.post(
        "/api/auth/login",
        json={"email": email, "password": "WrongPass123"},
    )
    assert bad_login.status_code == 401

    # Clean up the created user
    await db_session.execute(delete(User).where(User.email == email))
    await db_session.commit()

