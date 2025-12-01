"""
Unit tests for AI service
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient

from app.schemas import AIChatRequest, AIChatResponse
from app.services.ai_service import AIService


@pytest.mark.anyio
async def test_ai_service_initialization():
    """Test AI service initializes correctly"""
    service = AIService()
    assert service._pool is None
    assert service._client is None
    assert service._max_retries == 3
    assert service._retry_delay == 0.75


@pytest.mark.anyio
async def test_ai_chat_without_context_manager():
    """Test AI chat works without context manager (fallback mode)"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(
        session_id="session-1",
        message="How is my pet doing?"
    )
    pet_snapshot = {
        "name": "Fluffy",
        "species": "dog",
        "mood": "happy",
        "hunger": 70,
        "health": 85,
    }

    response = await service.chat("user-1", request, pet_snapshot)

    assert response.session_id == "session-1"
    assert isinstance(response.message, str)
    assert len(response.message) > 0
    assert response.pet_state is not None


@pytest.mark.anyio
async def test_ai_chat_with_pet_snapshot():
    """Test AI chat includes pet context in response"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(
        message="What should I feed my pet?"
    )
    pet_snapshot = {
        "name": "Pixel",
        "species": "cat",
        "mood": "hungry",
        "hunger": 30,
        "health": 75,
    }

    response = await service.chat("user-1", request, pet_snapshot)

    assert response.pet_state is not None
    assert "hunger" in response.pet_state or "mood" in response.pet_state
    assert response.health_forecast is not None


@pytest.mark.anyio
async def test_ai_chat_generates_session_id():
    """Test AI chat auto-generates session ID when not provided"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(message="Hello")
    response = await service.chat("user-1", request, None)

    assert response.session_id is not None
    assert response.session_id.startswith("stateless-")


@pytest.mark.anyio
async def test_ai_chat_handles_empty_message():
    """Test AI chat handles empty messages gracefully"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(message="")
    response = await service.chat("user-1", request, None)

    # Should still generate a response
    assert response.session_id is not None
    assert isinstance(response.message, str)


@pytest.mark.anyio
async def test_ai_chat_retry_logic():
    """Test AI service retries on API failures"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    with patch('httpx.AsyncClient.post') as mock_post:
        # First two calls fail, third succeeds
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": "Test response"
                }
            }]
        }
        mock_response.raise_for_status = MagicMock()

        mock_post.side_effect = [
            Exception("Network error"),
            Exception("Timeout"),
            mock_response,
        ]

        request = AIChatRequest(message="Test")
        response = await service.chat("user-1", request, None)

        assert response.message == "Test response"
        assert mock_post.call_count == 3


@pytest.mark.anyio
async def test_ai_chat_health_forecast():
    """Test AI chat includes health forecast"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(message="How is my pet's health?")
    pet_snapshot = {
        "name": "Buddy",
        "health": 60,
        "hunger": 40,
        "energy": 50,
    }

    response = await service.chat("user-1", request, pet_snapshot)

    assert response.health_forecast is not None
    assert isinstance(response.health_forecast, dict)


@pytest.mark.anyio
async def test_ai_chat_notifications():
    """Test AI chat generates notifications"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(message="Check my pet")
    pet_snapshot = {
        "name": "Fluffy",
        "hunger": 20,  # Low hunger
        "health": 50,  # Low health
    }

    response = await service.chat("user-1", request, pet_snapshot)

    assert response.notifications is not None
    assert isinstance(response.notifications, list)


@pytest.mark.anyio
async def test_ai_chat_mood_analysis():
    """Test AI chat analyzes pet mood"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(message="How is my pet feeling?")
    pet_snapshot = {
        "name": "Happy",
        "mood": "ecstatic",
        "happiness": 95,
    }

    response = await service.chat("user-1", request, pet_snapshot)

    assert response.mood is not None
    assert isinstance(response.mood, str)


@pytest.mark.anyio
async def test_ai_chat_without_pet():
    """Test AI chat works without pet snapshot"""
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(message="Hello")
    response = await service.chat("user-1", request, None)

    assert response.session_id is not None
    assert response.message is not None
    # Should still work without pet context
    assert response.pet_state is None or isinstance(response.pet_state, dict)
