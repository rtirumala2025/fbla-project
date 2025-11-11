from __future__ import annotations

import pytest
import respx
from httpx import AsyncClient

from app.main import app


@pytest.mark.anyio
@respx.mock
async def test_signup_route(test_client: AsyncClient) -> None:
    route = respx.post("https://example.supabase.co/auth/v1/signup").respond(
        status_code=201,
        json={
            "access_token": "access",
            "refresh_token": "refresh",
            "expires_in": 3600,
        },
    )

    response = await test_client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "password": "password123", "username": "tester"},
    )

    assert response.status_code == 201
    assert response.json()["access_token"] == "access"
    assert route.called


@pytest.mark.anyio
@respx.mock
async def test_login_route(test_client: AsyncClient) -> None:
    route = respx.post(
        "https://example.supabase.co/auth/v1/token",
        params={"grant_type": "password"},
    ).respond(
        status_code=200,
        json={
            "access_token": "access",
            "refresh_token": "refresh",
            "expires_in": 3600,
        },
    )

    response = await test_client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )

    assert response.status_code == 200
    assert response.json()["refresh_token"] == "refresh"
    assert route.called


@pytest.mark.anyio
@respx.mock
async def test_refresh_route(test_client: AsyncClient) -> None:
    route = respx.post(
        "https://example.supabase.co/auth/v1/token",
        params={"grant_type": "refresh_token"},
    ).respond(
        status_code=200,
        json={
            "access_token": "new-access",
            "refresh_token": "new-refresh",
            "expires_in": 3600,
        },
    )

    response = await test_client.post(
        "/api/auth/refresh",
        json={"refresh_token": "old-refresh"},
    )

    assert response.status_code == 200
    assert response.json()["access_token"] == "new-access"
    assert route.called


@pytest.mark.anyio
@respx.mock
async def test_logout_route(test_client: AsyncClient) -> None:
    route = respx.post("https://example.supabase.co/auth/v1/logout").respond(status_code=204, json={})

    response = await test_client.post(
        "/api/auth/logout",
        headers={"Authorization": "Bearer access"},
        json={"refresh_token": "refresh"},
    )

    assert response.status_code == 204
    assert route.called
