"""
Comprehensive tests for Pet Interactions router.
Tests all action types, edge cases, and error handling.
"""

from __future__ import annotations

import uuid
from datetime import date
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet, PetStats, SpeciesEnum
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_pet_interact_feed_action(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction with feed action."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=50,
        happiness=70,
        hygiene=60,
        energy=65,
        health=75,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_pet = Pet(
            id=pet.id,
            user_id=user.id,
            name="TestPet",
            species=SpeciesEnum.DOG,
            breed="Labrador",
            color_pattern="Golden",
            birthday=date(2023, 1, 1),
            hunger=70,  # Increased after feed
            happiness=75,
            hygiene=60,
            energy=65,
            health=75,
        )

        mock_action_response = type(
            "ActionResponse",
            (),
            {
                "pet": mock_pet,
                "reaction": "eagerly ate the food",
                "mood": "happy",
                "notifications": [],
                "health_forecast": None,
            },
        )()
        mock_service.get_pet.return_value = mock_pet
        mock_service.apply_action.return_value = mock_action_response
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "feed",
                "message": "Give some food",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "mood" in data
        assert "pet_state" in data
        assert "feed" in data["message"].lower() or "food" in data["message"].lower()


@pytest.mark.asyncio
async def test_pet_interact_play_action(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction with play action."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=60,
        happiness=70,
        hygiene=60,
        energy=50,
        health=75,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_pet = Pet(
            id=pet.id,
            user_id=user.id,
            name="TestPet",
            species=SpeciesEnum.DOG,
            breed="Labrador",
            color_pattern="Golden",
            birthday=date(2023, 1, 1),
            hunger=60,
            happiness=85,  # Increased after play
            hygiene=60,
            energy=40,  # Decreased after play
            health=75,
        )

        mock_action_response = type(
            "ActionResponse",
            (),
            {
                "pet": mock_pet,
                "reaction": "played happily",
                "mood": "happy",
                "notifications": [],
                "health_forecast": None,
            },
        )()
        mock_service.get_pet.return_value = mock_pet
        mock_service.apply_action.return_value = mock_action_response
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "play",
                "message": "Play fetch",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "play" in data["message"].lower() or "happily" in data["message"].lower()


@pytest.mark.asyncio
async def test_pet_interact_bathe_action(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction with bathe action."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=70,
        hygiene=40,  # Low hygiene
        energy=65,
        health=75,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_pet = Pet(
            id=pet.id,
            user_id=user.id,
            name="TestPet",
            species=SpeciesEnum.DOG,
            breed="Labrador",
            color_pattern="Golden",
            birthday=date(2023, 1, 1),
            hunger=70,
            happiness=75,
            hygiene=85,  # Increased after bathe
            energy=65,
            health=75,
        )

        mock_action_response = type(
            "ActionResponse",
            (),
            {
                "pet": mock_pet,
                "reaction": "enjoyed the bath",
                "mood": "content",
                "notifications": [],
                "health_forecast": None,
            },
        )()
        mock_service.get_pet.return_value = mock_pet
        mock_service.apply_action.return_value = mock_action_response
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "bathe",
                "message": "Give a bath",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "bathe" in data["message"].lower() or "bath" in data["message"].lower()


@pytest.mark.asyncio
async def test_pet_interact_rest_action(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction with rest action."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=70,
        hygiene=60,
        energy=30,  # Low energy
        health=75,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_pet = Pet(
            id=pet.id,
            user_id=user.id,
            name="TestPet",
            species=SpeciesEnum.DOG,
            breed="Labrador",
            color_pattern="Golden",
            birthday=date(2023, 1, 1),
            hunger=70,
            happiness=75,
            hygiene=60,
            energy=70,  # Increased after rest
            health=75,
        )

        mock_action_response = type(
            "ActionResponse",
            (),
            {
                "pet": mock_pet,
                "reaction": "rested peacefully",
                "mood": "content",
                "notifications": [],
                "health_forecast": None,
            },
        )()
        mock_service.get_pet.return_value = mock_pet
        mock_service.apply_action.return_value = mock_action_response
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "rest",
                "message": "Rest for 2 hours",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "rest" in data["message"].lower() or "peacefully" in data["message"].lower()


@pytest.mark.asyncio
async def test_pet_interact_status_action(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction with status action."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=75,
        hygiene=80,
        energy=65,
        health=85,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.get_pet.return_value = pet
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "status",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "mood" in data
        assert "pet_state" in data
        assert "status" in data["message"].lower() or "TestPet" in data["message"]


@pytest.mark.asyncio
async def test_pet_interact_action_aliases(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction with action aliases (snack, treat, pet, etc.)."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=50,
        happiness=70,
        hygiene=60,
        energy=65,
        health=75,
    )
    db_session.add(pet)
    await db_session.commit()

    aliases = ["snack", "treat", "pet", "train", "game", "clean", "groom", "sleep"]

    for alias in aliases:
        with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
            mock_service = AsyncMock()
            mock_pet = Pet(
                id=pet.id,
                user_id=user.id,
                name="TestPet",
                species=SpeciesEnum.DOG,
                breed="Labrador",
                color_pattern="Golden",
                birthday=date(2023, 1, 1),
                hunger=70,
                happiness=75,
                hygiene=60,
                energy=65,
                health=75,
            )

            mock_action_response = type(
                "ActionResponse",
                (),
                {
                    "pet": mock_pet,
                    "reaction": f"responded to {alias}",
                    "mood": "happy",
                    "notifications": [],
                    "health_forecast": None,
                },
            )()
            mock_service.get_pet.return_value = mock_pet
            mock_service.apply_action.return_value = mock_action_response
            mock_get_service.return_value = mock_service

            response = await client.post(
                "/api/pet/interact",
                json={
                    "action": alias,
                },
                headers=auth_headers(user.id),
            )

            assert response.status_code == 200, f"Failed for alias: {alias}"


@pytest.mark.asyncio
async def test_pet_interact_invalid_action(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction with invalid action."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=75,
        hygiene=60,
        energy=65,
        health=75,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.get_pet.return_value = pet
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "invalid_action",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 400
        assert "Unsupported pet command" in response.json()["detail"]


@pytest.mark.asyncio
async def test_pet_interact_no_pet(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction when user has no pet."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.get_pet.return_value = None
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "feed",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 404
        assert "Pet not found" in response.json()["detail"]


@pytest.mark.asyncio
async def test_pet_interact_unauthorized(client: AsyncClient):
    """Test pet interaction without authentication."""
    response = await client.post(
        "/api/pet/interact",
        json={
            "action": "feed",
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_pet_interact_with_session_id(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction with custom session_id."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=75,
        hygiene=60,
        energy=65,
        health=75,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_pet = Pet(
            id=pet.id,
            user_id=user.id,
            name="TestPet",
            species=SpeciesEnum.DOG,
            breed="Labrador",
            color_pattern="Golden",
            birthday=date(2023, 1, 1),
            hunger=70,
            happiness=75,
            hygiene=60,
            energy=65,
            health=75,
        )

        mock_action_response = type(
            "ActionResponse",
            (),
            {
                "pet": mock_pet,
                "reaction": "responded",
                "mood": "happy",
                "notifications": [],
                "health_forecast": None,
            },
        )()
        mock_service.get_pet.return_value = mock_pet
        mock_service.apply_action.return_value = mock_action_response
        mock_get_service.return_value = mock_service

        custom_session_id = "custom-session-123"
        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "feed",
                "session_id": custom_session_id,
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert data["session_id"] == custom_session_id


@pytest.mark.asyncio
async def test_pet_interact_health_forecast(client: AsyncClient, db_session: AsyncSession):
    """Test pet interaction returns health forecast when available."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=30,  # Low hunger
        happiness=50,
        hygiene=40,
        energy=35,
        health=45,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.pet_interactions.get_pet_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_pet = Pet(
            id=pet.id,
            user_id=user.id,
            name="TestPet",
            species=SpeciesEnum.DOG,
            breed="Labrador",
            color_pattern="Golden",
            birthday=date(2023, 1, 1),
            hunger=50,
            happiness=55,
            hygiene=40,
            energy=35,
            health=45,
        )

        health_forecast = {
            "trend": "declining",
            "risk": "medium",
            "recommended_actions": ["Offer a balanced meal soon.", "Schedule a rest break"],
        }

        mock_action_response = type(
            "ActionResponse",
            (),
            {
                "pet": mock_pet,
                "reaction": "needs care",
                "mood": "anxious",
                "notifications": [],
                "health_forecast": health_forecast,
            },
        )()
        mock_service.get_pet.return_value = mock_pet
        mock_service.apply_action.return_value = mock_action_response
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/pet/interact",
            json={
                "action": "status",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "health_forecast" in data
        assert data["health_forecast"]["trend"] == "declining"
        assert "recommended_actions" in data["health_forecast"]
