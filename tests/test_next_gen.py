"""
Tests for next-gen feature stubs.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_social_voice_and_cloud_endpoints(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"nextgen-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)

    social_payload = {
        "pet_id": str(uuid.uuid4()),
        "target_pet_id": str(uuid.uuid4()),
        "prompt": "Plan a park playdate",
    }
    social_response = await client.post("/api/nextgen/social", json=social_payload)
    assert social_response.status_code == 200

    voice_payload = {"transcript": "Please feed my pet."}
    voice_response = await client.post("/api/nextgen/voice", json=voice_payload)
    assert voice_response.status_code == 200

    ar_response = await client.get("/api/nextgen/ar", headers=headers)
    assert ar_response.status_code == 200

    cloud_response = await client.post(
        "/api/nextgen/cloud",
        json={"state": {"example": True}},
        headers=headers,
    )
    assert cloud_response.status_code == 201

    await db_session.delete(user)
    await db_session.commit()


@pytest.mark.asyncio
async def test_weather_habits_and_seasonal(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"nextgen-weather-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)

    weather_response = await client.get("/api/nextgen/weather?lat=37.7749&lon=-122.4194")
    assert weather_response.status_code == 200

    habits_response = await client.get("/api/nextgen/habits", headers=headers)
    assert habits_response.status_code == 200

    seasonal_response = await client.get("/api/nextgen/seasonal")
    assert seasonal_response.status_code == 200

    await db_session.delete(user)
    await db_session.commit()

