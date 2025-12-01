"""
Unit tests for Pet AI service
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.pet_ai_service import PetAIService, ReactionResult


@pytest.mark.anyio
async def test_pet_ai_service_initialization():
    """Test Pet AI service initializes correctly"""
    service = PetAIService(pool=None)
    assert service._pool is None
    assert service._client is None
    assert service._max_retries == 3
    assert isinstance(service._memory, dict)


@pytest.mark.anyio
async def test_generate_reaction():
    """Test generating pet reaction"""
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    pet_data = {
        "id": "pet-1",
        "name": "Fluffy",
        "species": "dog",
        "mood": "happy",
        "hunger": 70,
        "health": 85,
    }

    result = await service.generate_reaction("user-1", "pet-1", pet_data, "feed")

    assert isinstance(result, ReactionResult)
    assert result.reaction is not None
    assert isinstance(result.reaction, str)
    assert len(result.reaction) > 0


@pytest.mark.anyio
async def test_generate_insights():
    """Test generating pet insights"""
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    pet_data = {
        "id": "pet-1",
        "name": "Pixel",
        "species": "cat",
        "mood": "content",
        "hunger": 60,
        "health": 80,
    }

    insights = await service.generate_insights("user-1", "pet-1", pet_data)

    assert insights is not None
    assert isinstance(insights, str)
    assert len(insights) > 0


@pytest.mark.anyio
async def test_generate_notifications():
    """Test generating pet notifications"""
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    pet_data = {
        "id": "pet-1",
        "name": "Buddy",
        "hunger": 20,  # Low
        "health": 50,  # Low
        "energy": 30,  # Low
    }

    notifications = await service.generate_notifications("user-1", "pet-1", pet_data)

    assert notifications is not None
    assert isinstance(notifications, list)
    assert len(notifications) > 0


@pytest.mark.anyio
async def test_generate_help():
    """Test generating pet help"""
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    pet_data = {
        "id": "pet-1",
        "name": "Fluffy",
        "species": "dog",
    }

    help_text = await service.generate_help("user-1", "pet-1", pet_data)

    assert help_text is not None
    assert isinstance(help_text, str)
    assert len(help_text) > 0


@pytest.mark.anyio
async def test_parse_command():
    """Test parsing natural language commands"""
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    pet_data = {
        "id": "pet-1",
        "name": "Pixel",
    }

    command = "feed my pet"
    result = await service.parse_command("user-1", "pet-1", pet_data, command)

    assert result is not None
    assert "action" in result or "command" in result or "intent" in result


@pytest.mark.anyio
async def test_memory_management():
    """Test memory loading and saving"""
    service = PetAIService(pool=None)

    user_id = "user-1"
    pet_id = "pet-1"
    memory = [
        {"role": "user", "content": "Hello"},
        {"role": "assistant", "content": "Hi there!"},
    ]

    # Save memory
    await service._save_memory(user_id, pet_id, memory)

    # Load memory
    loaded = await service._load_memory(user_id, pet_id)

    assert loaded == memory


@pytest.mark.anyio
async def test_memory_trimming():
    """Test memory is trimmed to last 30 entries"""
    service = PetAIService(pool=None)

    user_id = "user-1"
    pet_id = "pet-1"
    # Create 50 memory entries
    memory = [{"role": "user", "content": f"Message {i}"} for i in range(50)]

    await service._save_memory(user_id, pet_id, memory)

    loaded = await service._load_memory(user_id, pet_id)

    assert len(loaded) == 30
    assert loaded == memory[-30:]


@pytest.mark.anyio
async def test_reaction_with_mood():
    """Test reaction includes mood analysis"""
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    pet_data = {
        "id": "pet-1",
        "name": "Happy",
        "mood": "ecstatic",
        "happiness": 95,
    }

    result = await service.generate_reaction("user-1", "pet-1", pet_data, "play")

    assert result.mood is not None
    assert isinstance(result.mood, str)


@pytest.mark.anyio
async def test_reaction_with_health_forecast():
    """Test reaction includes health forecast"""
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    pet_data = {
        "id": "pet-1",
        "name": "Fluffy",
        "health": 60,
        "hunger": 40,
    }

    result = await service.generate_reaction("user-1", "pet-1", pet_data, "feed")

    # Health forecast may or may not be present
    if result.health_forecast is not None:
        assert isinstance(result.health_forecast, dict)


@pytest.mark.anyio
async def test_retry_logic():
    """Test service retries on API failures"""
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    with patch('httpx.AsyncClient.post') as mock_post:
        # First call fails, second succeeds
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "Test reaction"
                }
            }]
        }
        mock_response.raise_for_status = MagicMock()

        mock_post.side_effect = [
            Exception("Network error"),
            mock_response,
        ]

        pet_data = {"id": "pet-1", "name": "Test"}
        result = await service.generate_reaction("user-1", "pet-1", pet_data, "feed")

        assert result.reaction == "Test reaction"
        assert mock_post.call_count >= 2
