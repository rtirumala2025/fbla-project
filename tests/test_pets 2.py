"""
Integration tests for pet customization endpoints.
"""

from __future__ import annotations

from datetime import date
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_pet_customization_flow(client: AsyncClient, db_session: AsyncSession):
    """
    Ensure pet creation, retrieval, and updates work end-to-end.
    """

    user = User(email=f"pet-owner-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)
    payload = {
        "name": "Luna",
        "species": "dog",
        "breed": "Labrador",
        "color_pattern": "Golden",
        "birthday": date(2023, 1, 1).isoformat(),
    }

    create_response = await client.post("/api/pets", json=payload, headers=headers)
    assert create_response.status_code == 201, create_response.text
    pet_data = create_response.json()
    assert pet_data["name"] == "Luna"
    assert pet_data["species"] == "dog"
    assert pet_data["age"] >= 1

    get_response = await client.get("/api/pets", headers=headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == pet_data["id"]

    update_payload = {"color_pattern": "Midnight Blue"}
    patch_response = await client.patch("/api/pets", json=update_payload, headers=headers)
    assert patch_response.status_code == 200
    assert patch_response.json()["color_pattern"] == "Midnight Blue"

    # Creating a second pet should fail.
    duplicate_response = await client.post("/api/pets", json=payload, headers=headers)
    assert duplicate_response.status_code == 400

    # Clean up user and pet records.
    await db_session.execute(delete(Pet).where(Pet.id == uuid.UUID(pet_data["id"])))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


@pytest.mark.asyncio
async def test_species_breed_validation(client: AsyncClient, db_session: AsyncSession):
    """
    Validate that mismatched species/breed combinations are rejected.
    """

    user = User(email=f"pet-owner-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()
    headers = auth_headers(user.id)

    invalid_payload = {
        "name": "Feather",
        "species": "cat",
        "breed": "Macaw",
        "color_pattern": "Iridescent",
        "birthday": date(2023, 5, 4).isoformat(),
    }
    response = await client.post("/api/pets", json=invalid_payload, headers=headers)
    assert response.status_code == 422

    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


@pytest.mark.asyncio
async def test_pet_care_actions_and_diary(client: AsyncClient, db_session: AsyncSession):
    """
    Validate that each care action updates stats, logs the diary, and returns reactions.
    """

    user = User(email=f"caretaker-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)
    payload = {
        "name": "Nova",
        "species": "cat",
        "breed": "Siamese",
        "color_pattern": "Starlight",
        "birthday": date(2022, 7, 4).isoformat(),
    }

    create_response = await client.post("/api/pets", json=payload, headers=headers)
    assert create_response.status_code == 201, create_response.text

    stats_response = await client.get("/api/pets/stats", headers=headers)
    assert stats_response.status_code == 200
    baseline_stats = stats_response.json()

    feed_response = await client.post("/api/pets/feed", json={"food_type": "premium"}, headers=headers)
    assert feed_response.status_code == 200, feed_response.text
    feed_data = feed_response.json()
    assert feed_data["reaction"]
    assert feed_data["pet"]["stats"]["hunger"] >= baseline_stats["hunger"]
    assert any(entry["action"] == "feed" for entry in feed_data["pet"]["diary"])

    play_response = await client.post("/api/pets/play", json={"game_type": "fetch"}, headers=headers)
    assert play_response.status_code == 200, play_response.text
    play_data = play_response.json()
    assert play_data["pet"]["stats"]["happiness"] >= feed_data["pet"]["stats"]["happiness"]
    assert any(entry["action"] == "play" for entry in play_data["pet"]["diary"])

    bathe_response = await client.post("/api/pets/bathe", headers=headers)
    assert bathe_response.status_code == 200, bathe_response.text
    bathe_data = bathe_response.json()
    assert any(entry["action"] == "bathe" for entry in bathe_data["pet"]["diary"])

    rest_response = await client.post("/api/pets/rest", json={"duration_hours": 2}, headers=headers)
    assert rest_response.status_code == 200, rest_response.text
    rest_data = rest_response.json()
    assert rest_data["pet"]["stats"]["energy"] >= bathe_data["pet"]["stats"]["energy"]
    assert any(entry["action"] == "rest" for entry in rest_data["pet"]["diary"])

    diary_response = await client.get("/api/pets/diary", headers=headers)
    assert diary_response.status_code == 200
    diary_entries = diary_response.json()
    assert len(diary_entries) >= 4

    health_response = await client.get("/api/pets/health", headers=headers)
    assert health_response.status_code == 200
    health_data = health_response.json()
    assert "summary" in health_data and "mood" in health_data

    await db_session.execute(delete(Pet).where(Pet.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


@pytest.mark.asyncio
async def test_pet_care_requires_authentication(client: AsyncClient, db_session: AsyncSession):
    """
    Ensure pet care endpoints reject unauthenticated requests.
    """

    response = await client.post("/api/pets/feed", json={"food_type": "standard"})
    assert response.status_code == 401

    stats_response = await client.get("/api/pets/stats")
    assert stats_response.status_code == 401

