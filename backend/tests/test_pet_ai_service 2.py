from __future__ import annotations

import json

import pytest
import respx
from httpx import Response

from app.core.config import get_settings
from app.services.pet_ai_service import PetAIService


@pytest.fixture(autouse=True)
def configure_openrouter(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setenv("OPENROUTER_MODEL", "test/model")
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.mark.anyio
@respx.mock
async def test_generate_reaction_uses_openrouter(monkeypatch: pytest.MonkeyPatch):
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]
    mock_response = {
        "choices": [
            {
                "message": {
                    "content": json.dumps(
                        {
                            "reaction": "purrs softly in response",
                            "mood": "happy",
                            "notifications": ["Consider a longer play session."],
                            "note": "Loved the gentle playtime.",
                            "health_forecast": {"trend": "steady", "risk": "low", "recommended_actions": []},
                        }
                    )
                }
            }
        ]
    }
    respx.post("https://openrouter.ai/api/v1/chat/completions").mock(return_value=Response(200, json=mock_response))

    context = {
        "action": "play",
        "before": {"energy": 60, "hunger": 40},
        "after": {"energy": 45, "hunger": 35, "mood": "content"},
    }

    result = await service.generate_reaction("user-1", "pet-1", context)

    assert result.reaction == "purrs softly in response"
    assert result.mood == "happy"
    assert result.health_forecast == {"trend": "steady", "risk": "low", "recommended_actions": []}
    key = "user-1:pet-1"
    assert key in service._memory  # type: ignore[attr-defined]
    assert service._memory[key][-1]["action"] == "play"  # type: ignore[attr-defined]


@pytest.mark.anyio
@respx.mock
async def test_analyze_sentiment_returns_label():
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]
    respx.post("https://openrouter.ai/api/v1/chat/completions").mock(
        return_value=Response(200, json={"choices": [{"message": {"content": "The sentiment is happy."}}]}),
    )

    label = await service.analyze_sentiment("I feel fantastic about today's progress!")
    assert label == "happy"


@pytest.mark.anyio
async def test_fallback_reaction_without_api_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("OPENROUTER_API_KEY", "")
    get_settings.cache_clear()
    service = PetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    result = await service.generate_reaction(
        "user-2",
        "pet-2",
        {"action": "feed", "after": {"mood": "content"}},
    )

    assert "meal" in result.reaction
    assert result.mood == "content"
    assert result.health_forecast is not None
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    get_settings.cache_clear()
