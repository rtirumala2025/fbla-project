"""
Integration tests for name validator endpoint.
"""

from __future__ import annotations

from datetime import date
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet, SpeciesEnum
from app.models.profile import Profile


def auth_headers(user_id: UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_validate_valid_pet_name(client: AsyncClient, db_session: AsyncSession):
    """Test validation of a valid pet name."""
    user_id = uuid4()
    headers = auth_headers(user_id)

    payload = {"name": "Fluffy", "name_type": "pet"}

    response = await client.post("/api/validate-name", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["status"] == "success"
    assert len(data["errors"]) == 0


@pytest.mark.asyncio
async def test_validate_invalid_pet_name_too_short(client: AsyncClient, db_session: AsyncSession):
    """Test validation of a pet name that's too short."""
    user_id = uuid4()
    headers = auth_headers(user_id)

    payload = {"name": "AB", "name_type": "pet"}

    response = await client.post("/api/validate-name", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert data["status"] == "error"
    assert len(data["errors"]) > 0
    assert len(data["suggestions"]) > 0


@pytest.mark.asyncio
async def test_validate_duplicate_pet_name(client: AsyncClient, db_session: AsyncSession):
    """Test validation of a duplicate pet name."""
    user_id = uuid4()
    
    # Create a pet with a specific name
    pet = Pet(
        id=uuid4(),
        user_id=user_id,
        name="Fluffy",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Brown",
        birthday=date(2024, 1, 1),
    )
    db_session.add(pet)
    await db_session.flush()

    headers = auth_headers(user_id)
    payload = {"name": "Fluffy", "name_type": "pet"}

    response = await client.post("/api/validate-name", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert any("already taken" in error.lower() for error in data["errors"])


@pytest.mark.asyncio
async def test_validate_valid_account_name(client: AsyncClient, db_session: AsyncSession):
    """Test validation of a valid account name."""
    user_id = uuid4()
    headers = auth_headers(user_id)

    payload = {"name": "TestUser123", "name_type": "account"}

    response = await client.post("/api/validate-name", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is True
    assert data["status"] == "success"


@pytest.mark.asyncio
async def test_validate_duplicate_account_name(client: AsyncClient, db_session: AsyncSession):
    """Test validation of a duplicate account name."""
    user_id = uuid4()
    
    # Create a profile with a specific username
    profile = Profile(
        id=uuid4(),
        user_id=user_id,
        username="TestUser",
    )
    db_session.add(profile)
    await db_session.flush()

    headers = auth_headers(user_id)
    payload = {"name": "TestUser", "name_type": "account"}

    response = await client.post("/api/validate-name", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert any("already taken" in error.lower() for error in data["errors"])


@pytest.mark.asyncio
async def test_validate_empty_name(client: AsyncClient, db_session: AsyncSession):
    """Test validation of an empty name."""
    user_id = uuid4()
    headers = auth_headers(user_id)

    payload = {"name": "", "name_type": "pet"}

    response = await client.post("/api/validate-name", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert len(data["errors"]) > 0
    assert len(data["suggestions"]) > 0


@pytest.mark.asyncio
async def test_validate_name_with_profanity(client: AsyncClient, db_session: AsyncSession):
    """Test validation of a name containing profanity."""
    user_id = uuid4()
    headers = auth_headers(user_id)

    payload = {"name": "badword", "name_type": "pet"}

    response = await client.post("/api/validate-name", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert any("inappropriate" in error.lower() for error in data["errors"])


@pytest.mark.asyncio
async def test_validate_name_too_long(client: AsyncClient, db_session: AsyncSession):
    """Test validation of a name that's too long."""
    user_id = uuid4()
    headers = auth_headers(user_id)

    payload = {"name": "A" * 20, "name_type": "pet"}

    response = await client.post("/api/validate-name", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["valid"] is False
    assert any("no more than 15" in error.lower() for error in data["errors"])
    assert len(data["suggestions"]) > 0

