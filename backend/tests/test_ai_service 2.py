from __future__ import annotations

import pytest

from app.core.config import get_settings
from app.schemas import AIChatRequest
from app.services.ai_service import AIService


@pytest.fixture(autouse=True)
def clear_settings(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.anyio
async def test_ai_chat_fallback_generates_contextual_message():
    service = AIService()
    service._context_mgr = None  # type: ignore[attr-defined]

    request = AIChatRequest(session_id="session-1", message="How is Pixel feeling today?")
    pet_snapshot = {
        "name": "Pixel",
        "species": "canine",
        "mood": "happy",
        "hunger": 65,
        "hygiene": 80,
        "energy": 60,
        "health": 88,
    }

    response = await service.chat("user-1", request, pet_snapshot)

    assert response.session_id == "session-1"
    assert "Pixel" in response.message
    assert response.mood in {"happy", "content", "ecstatic"}
    assert response.pet_state is not None
    assert response.pet_state["mood"] == response.mood
    assert response.health_forecast is not None

