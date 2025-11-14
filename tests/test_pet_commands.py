"""
Comprehensive unit tests for Pet Command AI endpoint.

Tests cover:
- Valid single commands (feed, play, sleep, bathe, trick)
- Valid multi-step commands
- Invalid commands with graceful handling
- Edge cases and error scenarios
- Fail-safe fallback responses
"""

from __future__ import annotations

from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
import uuid

import pytest
from fastapi import status
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet, SpeciesEnum
from app.models.user import User, hash_password
from app.schemas.pet import PetCommandAIRequest, PetCommandAIResponse, PetRead, PetStats
from app.services import pet_command_service
from app.services.pet_service import PetNotFoundError


def _build_test_pet(
    *,
    hunger: int = 70,
    happiness: int = 70,
    cleanliness: int = 70,
    energy: int = 70,
    health: int = 80,
    name: str = "Test Pet",
) -> Pet:
    """Helper to create a test pet model."""
    pet = Pet(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        name=name,
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2021, 1, 1),
        hunger=hunger,
        happiness=happiness,
        cleanliness=cleanliness,
        energy=energy,
        health=health,
        mood="happy",
    )
    current_time = datetime.now(tz=timezone.utc)
    pet.created_at = current_time
    pet.updated_at = current_time
    pet.diary = []
    pet.traits = {}
    return pet


def _build_pet_read(pet: Pet) -> PetRead:
    """Helper to create a PetRead from a Pet model."""
    stats = PetStats(
        hunger=pet.hunger,
        happiness=pet.happiness,
        cleanliness=pet.cleanliness,
        energy=pet.energy,
        health=pet.health,
        mood=pet.mood,
    )
    return PetRead(
        id=pet.id,
        user_id=pet.user_id,
        name=pet.name,
        species=pet.species,
        breed=pet.breed,
        color_pattern=pet.color_pattern,
        birthday=pet.birthday,
        hunger=pet.hunger,
        happiness=pet.happiness,
        cleanliness=pet.cleanliness,
        energy=pet.energy,
        health=pet.health,
        mood=pet.mood,
        stats=stats,
        created_at=pet.created_at,
        updated_at=pet.updated_at,
        diary=[],
    )


# ============================================================================
# Service Layer Tests - Command Parsing
# ============================================================================


@pytest.mark.asyncio
async def test_parse_single_feed_command():
    """Test parsing a simple feed command."""
    command = "feed my pet"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "feed"
    assert parsed.steps[0].parameters.get("food_type") in ["standard", "treat", "premium", "tuna"]
    assert parsed.confidence > 0.0


@pytest.mark.asyncio
async def test_parse_single_play_command():
    """Test parsing a simple play command."""
    command = "play fetch with my pet"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "play"
    assert parsed.steps[0].parameters.get("game_type") == "fetch"
    assert parsed.confidence > 0.0


@pytest.mark.asyncio
async def test_parse_single_sleep_command():
    """Test parsing a simple sleep command."""
    command = "let my pet sleep for 4 hours"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "sleep"
    assert parsed.steps[0].parameters.get("duration_hours") == 4
    assert parsed.confidence > 0.0


@pytest.mark.asyncio
async def test_parse_single_bathe_command():
    """Test parsing a simple bathe command."""
    command = "bathe my pet"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "bathe"
    assert parsed.confidence > 0.0


@pytest.mark.asyncio
async def test_parse_single_trick_command():
    """Test parsing a simple trick command."""
    command = "teach my pet to sit"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "trick"
    assert parsed.steps[0].parameters.get("trick_type") == "sit"
    assert parsed.confidence > 0.0


@pytest.mark.asyncio
async def test_parse_multi_step_command():
    """Test parsing a multi-step command."""
    command = "feed my pet then play fetch"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) >= 2
    assert parsed.steps[0].action == "feed"
    assert parsed.steps[1].action == "play"
    assert parsed.confidence > 0.0


@pytest.mark.asyncio
async def test_parse_multi_step_with_and():
    """Test parsing multi-step command with 'and' connector."""
    command = "feed my pet and play fetch"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) >= 2


@pytest.mark.asyncio
async def test_parse_invalid_command():
    """Test parsing an invalid/unrecognized command."""
    command = "make my pet fly to the moon"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is False
    assert len(parsed.steps) == 0
    assert parsed.confidence == 0.0
    assert len(parsed.suggestions) > 0


@pytest.mark.asyncio
async def test_parse_empty_command():
    """Test parsing an empty command."""
    command = ""
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is False
    assert len(parsed.steps) == 0
    assert parsed.confidence == 0.0
    assert len(parsed.suggestions) > 0


@pytest.mark.asyncio
async def test_parse_command_with_food_type():
    """Test parsing command with specific food type."""
    command = "feed my pet a premium treat"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "feed"
    # Should extract premium or treat
    food_type = parsed.steps[0].parameters.get("food_type")
    assert food_type in ["premium", "treat"]


@pytest.mark.asyncio
async def test_parse_command_with_game_type():
    """Test parsing command with specific game type."""
    command = "play puzzle game with my pet"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "play"
    assert parsed.steps[0].parameters.get("game_type") == "puzzle"


@pytest.mark.asyncio
async def test_parse_command_with_duration():
    """Test parsing command with duration."""
    command = "let my pet sleep for 8 hours"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "sleep"
    assert parsed.steps[0].parameters.get("duration_hours") == 8


@pytest.mark.asyncio
async def test_parse_command_with_trick_type():
    """Test parsing command with specific trick type."""
    command = "teach my pet to roll over"
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) == 1
    assert parsed.steps[0].action == "trick"
    assert parsed.steps[0].parameters.get("trick_type") == "roll"


# ============================================================================
# Service Layer Tests - Command Execution
# ============================================================================


@pytest.mark.asyncio
async def test_execute_feed_command_success():
    """Test successful execution of feed command."""
    pet = _build_test_pet(hunger=50)
    user_id = str(pet.user_id)
    
    mock_session = AsyncMock()
    mock_pet_read = _build_pet_read(pet)
    
    with patch("app.services.pet_command_service.pet_service.get_pet_by_user") as mock_get_pet, \
         patch("app.services.pet_command_service.pet_service.feed_pet") as mock_feed, \
         patch("app.services.pet_command_service.fetch_pet_model", return_value=pet):
        
        mock_get_pet.return_value = mock_pet_read
        mock_feed.return_value = MagicMock(
            pet=mock_pet_read,
            reaction="That meal hit the spot!",
        )
        
        result = await pet_command_service.execute_command(
            session=mock_session,
            user_id=user_id,
            command="feed my pet",
        )
        
        assert result["success"] is True
        assert len(result["results"]) == 1
        assert result["results"][0]["action"] == "feed"
        assert result["results"][0]["success"] is True
        assert result["confidence"] > 0.0


@pytest.mark.asyncio
async def test_execute_play_command_success():
    """Test successful execution of play command."""
    pet = _build_test_pet(happiness=50)
    user_id = str(pet.user_id)
    
    mock_session = AsyncMock()
    mock_pet_read = _build_pet_read(pet)
    
    with patch("app.services.pet_command_service.pet_service.get_pet_by_user") as mock_get_pet, \
         patch("app.services.pet_command_service.pet_service.play_with_pet") as mock_play, \
         patch("app.services.pet_command_service.fetch_pet_model", return_value=pet):
        
        mock_get_pet.return_value = mock_pet_read
        mock_play.return_value = MagicMock(
            pet=mock_pet_read,
            reaction="That was fun!",
        )
        
        result = await pet_command_service.execute_command(
            session=mock_session,
            user_id=user_id,
            command="play fetch",
        )
        
        assert result["success"] is True
        assert len(result["results"]) == 1
        assert result["results"][0]["action"] == "play"
        assert result["results"][0]["success"] is True


@pytest.mark.asyncio
async def test_execute_multi_step_command_success():
    """Test successful execution of multi-step command."""
    pet = _build_test_pet()
    user_id = str(pet.user_id)
    
    mock_session = AsyncMock()
    mock_pet_read = _build_pet_read(pet)
    
    with patch("app.services.pet_command_service.pet_service.get_pet_by_user") as mock_get_pet, \
         patch("app.services.pet_command_service.pet_service.feed_pet") as mock_feed, \
         patch("app.services.pet_command_service.pet_service.play_with_pet") as mock_play, \
         patch("app.services.pet_command_service.fetch_pet_model", return_value=pet):
        
        mock_get_pet.return_value = mock_pet_read
        mock_feed.return_value = MagicMock(
            pet=mock_pet_read,
            reaction="Fed!",
        )
        mock_play.return_value = MagicMock(
            pet=mock_pet_read,
            reaction="Played!",
        )
        
        result = await pet_command_service.execute_command(
            session=mock_session,
            user_id=user_id,
            command="feed my pet then play fetch",
        )
        
        assert result["success"] is True
        assert len(result["results"]) >= 2
        assert result["steps_executed"] >= 2


@pytest.mark.asyncio
async def test_execute_command_pet_not_found():
    """Test command execution when pet is not found."""
    user_id = str(uuid.uuid4())
    mock_session = AsyncMock()
    
    with patch("app.services.pet_command_service.pet_service.get_pet_by_user", return_value=None):
        result = await pet_command_service.execute_command(
            session=mock_session,
            user_id=user_id,
            command="feed my pet",
        )
        
        assert result["success"] is False
        assert "not found" in result["message"].lower()
        assert len(result["suggestions"]) > 0


@pytest.mark.asyncio
async def test_execute_invalid_command():
    """Test execution of invalid command."""
    pet = _build_test_pet()
    user_id = str(pet.user_id)
    
    mock_session = AsyncMock()
    mock_pet_read = _build_pet_read(pet)
    
    with patch("app.services.pet_command_service.pet_service.get_pet_by_user", return_value=mock_pet_read):
        result = await pet_command_service.execute_command(
            session=mock_session,
            user_id=user_id,
            command="make my pet fly",
        )
        
        assert result["success"] is False
        assert result["can_execute"] is False or len(result["results"]) == 0
        assert len(result["suggestions"]) > 0
        assert result["confidence"] == 0.0


@pytest.mark.asyncio
async def test_execute_command_with_error():
    """Test command execution when an error occurs."""
    pet = _build_test_pet()
    user_id = str(pet.user_id)
    
    mock_session = AsyncMock()
    mock_pet_read = _build_pet_read(pet)
    
    with patch("app.services.pet_command_service.pet_service.get_pet_by_user") as mock_get_pet, \
         patch("app.services.pet_command_service.pet_service.feed_pet", side_effect=Exception("Database error")), \
         patch("app.services.pet_command_service.fetch_pet_model", return_value=pet):
        
        mock_get_pet.return_value = mock_pet_read
        
        result = await pet_command_service.execute_command(
            session=mock_session,
            user_id=user_id,
            command="feed my pet",
        )
        
        # Should handle error gracefully
        assert len(result["results"]) == 1
        assert result["results"][0]["success"] is False
        assert "error" in result["results"][0]["message"].lower() or "failed" in result["results"][0]["message"].lower()


# ============================================================================
# API Endpoint Tests
# ============================================================================


def _get_auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    """Helper to create auth headers for a user."""
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_endpoint_valid_feed_command(client: AsyncClient, db_session: AsyncSession):
    """Test API endpoint with valid feed command."""
    # Create a test user
    user = User(email=f"test-{uuid.uuid4()}@example.com", password_hash=hash_password("TestPass1!"))
    db_session.add(user)
    await db_session.flush()
    auth_headers = _get_auth_headers(user.id)
    
    # Mock pet service responses
    pet = _build_test_pet()
    mock_pet_read = _build_pet_read(pet)
    
    with patch("app.routers.pet_commands.pet_command_service.execute_command") as mock_execute:
        mock_execute.return_value = {
            "success": True,
            "message": "That meal hit the spot!",
            "suggestions": [],
            "results": [
                {
                    "action": "feed",
                    "success": True,
                    "message": "That meal hit the spot!",
                    "stat_changes": {"hunger": 20, "happiness": 4},
                    "pet_state": {"hunger": 90, "happiness": 74, "mood": "happy"},
                }
            ],
            "confidence": 0.8,
            "original_command": "feed my pet",
            "steps_executed": 1,
        }
        
        response = await client.post(
            "/api/pets/commands/execute",
            json={"command": "feed my pet"},
            headers=auth_headers,
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["steps_executed"] == 1
        assert len(data["results"]) == 1
        assert data["results"][0]["action"] == "feed"


@pytest.mark.asyncio
async def test_endpoint_valid_multi_step_command(client: AsyncClient, db_session: AsyncSession):
    """Test API endpoint with valid multi-step command."""
    # Create a test user
    user = User(email=f"test-{uuid.uuid4()}@example.com", password_hash=hash_password("TestPass1!"))
    db_session.add(user)
    await db_session.flush()
    auth_headers = _get_auth_headers(user.id)
    
    with patch("app.routers.pet_commands.pet_command_service.execute_command") as mock_execute:
        mock_execute.return_value = {
            "success": True,
            "message": "Completed 2 actions successfully!",
            "suggestions": [],
            "results": [
                {
                    "action": "feed",
                    "success": True,
                    "message": "Fed!",
                    "stat_changes": {"hunger": 20},
                    "pet_state": {"hunger": 90},
                },
                {
                    "action": "play",
                    "success": True,
                    "message": "Played!",
                    "stat_changes": {"happiness": 18},
                    "pet_state": {"happiness": 88},
                },
            ],
            "confidence": 0.75,
            "original_command": "feed my pet then play fetch",
            "steps_executed": 2,
        }
        
        response = await client.post(
            "/api/pets/commands/execute",
            json={"command": "feed my pet then play fetch"},
            headers=auth_headers,
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["steps_executed"] == 2
        assert len(data["results"]) == 2


@pytest.mark.asyncio
async def test_endpoint_invalid_command(client: AsyncClient, db_session: AsyncSession):
    """Test API endpoint with invalid command."""
    # Create a test user
    user = User(email=f"test-{uuid.uuid4()}@example.com", password_hash=hash_password("TestPass1!"))
    db_session.add(user)
    await db_session.flush()
    auth_headers = _get_auth_headers(user.id)
    
    with patch("app.routers.pet_commands.pet_command_service.execute_command") as mock_execute:
        mock_execute.return_value = {
            "success": False,
            "message": "I couldn't understand that command. Please try rephrasing.",
            "suggestions": [
                "Try commands like: 'feed my pet', 'play fetch', 'let my pet sleep'",
            ],
            "results": [],
            "confidence": 0.0,
            "original_command": "make my pet fly",
            "steps_executed": 0,
        }
        
        response = await client.post(
            "/api/pets/commands/execute",
            json={"command": "make my pet fly"},
            headers=auth_headers,
        )
        
        assert response.status_code == status.HTTP_200_OK  # Still 200, but success=False
        data = response.json()
        assert data["success"] is False
        assert len(data["suggestions"]) > 0
        assert data["confidence"] == 0.0


@pytest.mark.asyncio
async def test_endpoint_empty_command(client: AsyncClient, db_session: AsyncSession):
    """Test API endpoint with empty command."""
    # Create a test user
    user = User(email=f"test-{uuid.uuid4()}@example.com", password_hash=hash_password("TestPass1!"))
    db_session.add(user)
    await db_session.flush()
    auth_headers = _get_auth_headers(user.id)
    
    response = await client.post(
        "/api/pets/commands/execute",
        json={"command": ""},
        headers=auth_headers,
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    data = response.json()
    assert "cannot be empty" in data["detail"].lower()


@pytest.mark.asyncio
async def test_endpoint_pet_not_found(client: AsyncClient, db_session: AsyncSession):
    """Test API endpoint when pet is not found."""
    # Create a test user
    user = User(email=f"test-{uuid.uuid4()}@example.com", password_hash=hash_password("TestPass1!"))
    db_session.add(user)
    await db_session.flush()
    auth_headers = _get_auth_headers(user.id)
    
    with patch("app.routers.pet_commands.pet_command_service.execute_command") as mock_execute:
        mock_execute.side_effect = PetNotFoundError("Pet not found.")
        
        response = await client.post(
            "/api/pets/commands/execute",
            json={"command": "feed my pet"},
            headers=auth_headers,
        )
        
        assert response.status_code == status.HTTP_200_OK  # Returns structured response
        data = response.json()
        assert data["success"] is False
        assert "not found" in data["message"].lower()


@pytest.mark.asyncio
async def test_endpoint_unauthorized(client: AsyncClient):
    """Test API endpoint without authentication."""
    response = await client.post(
        "/api/pets/commands/execute",
        json={"command": "feed my pet"},
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.asyncio
async def test_endpoint_server_error(client: AsyncClient, db_session: AsyncSession):
    """Test API endpoint with server error."""
    # Create a test user
    user = User(email=f"test-{uuid.uuid4()}@example.com", password_hash=hash_password("TestPass1!"))
    db_session.add(user)
    await db_session.flush()
    auth_headers = _get_auth_headers(user.id)
    
    with patch("app.routers.pet_commands.pet_command_service.execute_command") as mock_execute:
        mock_execute.side_effect = Exception("Unexpected error")
        
        response = await client.post(
            "/api/pets/commands/execute",
            json={"command": "feed my pet"},
            headers=auth_headers,
        )
        
        # Should return fail-safe response, not 500
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is False
        assert len(data["suggestions"]) > 0


# ============================================================================
# Edge Cases and Additional Tests
# ============================================================================


@pytest.mark.asyncio
async def test_command_with_special_characters():
    """Test parsing command with special characters."""
    command = "feed my pet!!! then play fetch???"
    parsed = pet_command_service._parse_command(command)
    
    # Should still parse successfully
    assert parsed.can_execute is True
    assert len(parsed.steps) >= 1


@pytest.mark.asyncio
async def test_command_with_extra_whitespace():
    """Test parsing command with excessive whitespace."""
    command = "   feed    my    pet    then    play   fetch   "
    parsed = pet_command_service._parse_command(command)
    
    assert parsed.can_execute is True
    assert len(parsed.steps) >= 2


@pytest.mark.asyncio
async def test_command_case_insensitive():
    """Test that commands are case-insensitive."""
    command1 = "FEED MY PET"
    command2 = "feed my pet"
    command3 = "Feed My Pet"
    
    parsed1 = pet_command_service._parse_command(command1)
    parsed2 = pet_command_service._parse_command(command2)
    parsed3 = pet_command_service._parse_command(command3)
    
    # All should parse similarly
    assert parsed1.can_execute == parsed2.can_execute == parsed3.can_execute
    if parsed1.can_execute:
        assert parsed1.steps[0].action == parsed2.steps[0].action == parsed3.steps[0].action


@pytest.mark.asyncio
async def test_command_with_numbers():
    """Test parsing command with numeric values."""
    command = "feed my pet 3 times"
    parsed = pet_command_service._parse_command(command)
    
    # Should still parse (though may not execute 3 times)
    assert parsed.can_execute is True or len(parsed.suggestions) > 0


@pytest.mark.asyncio
async def test_very_long_command():
    """Test parsing a very long command."""
    command = "feed my pet " * 50  # Very long command
    parsed = pet_command_service._parse_command(command)
    
    # Should handle gracefully
    assert isinstance(parsed, pet_command_service.ParsedCommand)
    assert len(parsed.original_command) > 0

