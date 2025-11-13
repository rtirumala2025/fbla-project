"\"\"\"Unit tests for next-gen service utilities.\"\"\""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.services import next_gen_service


@pytest.mark.asyncio
async def test_voice_command_intent_identifies_actions():
    result = await next_gen_service.voice_command_intent(
        next_gen_service.VoiceCommandRequest(transcript="Can you feed my pet?")
    )
    assert result.action == "feed_pet"
    assert result.intent == "care.feed"
    assert result.confidence > 0.5


@pytest.mark.asyncio
async def test_pet_social_interaction_generates_summary():
    payload = next_gen_service.SocialInteractionRequest(
        pet_id=uuid4(), target_pet_id=uuid4(), prompt="Plan a park playdate"
    )
    response = await next_gen_service.pet_social_interaction(payload)
    assert "mini-game" in response.summary.lower()
    assert "gift" in response.suggested_follow_up.lower() or "schedule" in response.suggested_follow_up.lower()


@pytest.mark.asyncio
async def test_generate_ar_session_produces_unique_session():
    user_id = uuid4()
    session_one = await next_gen_service.generate_ar_session(user_id)
    session_two = await next_gen_service.generate_ar_session(user_id)
    assert session_one.session_id != session_two.session_id
    assert "anchor" in session_one.anchor_description.lower()


@pytest.mark.asyncio
async def test_save_cloud_state_returns_checksum():
    payload = next_gen_service.CloudSavePayload(state={"level": 5})
    result = await next_gen_service.save_cloud_state(uuid4(), payload)
    assert result.checksum
    assert isinstance(result.saved_at, datetime)


def test_current_seasonal_event_varies_by_month():
    winter = datetime(2025, 12, 5, tzinfo=timezone.utc)
    summer = datetime(2025, 7, 5, tzinfo=timezone.utc)
    spooky = datetime(2025, 10, 15, tzinfo=timezone.utc)

    assert "Winter" in next_gen_service.current_seasonal_event(winter).event_name
    assert "Summer" in next_gen_service.current_seasonal_event(summer).event_name
    assert "Spooky" in next_gen_service.current_seasonal_event(spooky).event_name


@pytest.mark.asyncio
async def test_fetch_weather_reaction_without_api_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("WEATHER_API_KEY", raising=False)
    result = await next_gen_service.fetch_weather_reaction(10.0, 10.0)
    assert result.condition == "sunny"
    assert "outdoor" in result.recommendation.lower()


@pytest.mark.asyncio
async def test_fetch_weather_reaction_with_api_key(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("WEATHER_API_KEY", "fake-key")

    class FakeResponse:
        def __init__(self):
            self._json = {"weather": [{"main": "Rain"}], "main": {"temp": 12.5}}

        def raise_for_status(self):
            return None

        def json(self):
            return self._json

    class FakeClient:
        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            return False

        async def get(self, *_args, **_kwargs):
            return FakeResponse()

    monkeypatch.setattr(next_gen_service.httpx, "AsyncClient", lambda timeout=5: FakeClient())

    result = await next_gen_service.fetch_weather_reaction(10.0, 10.0)
    assert result.condition == "rain"
    assert "indoor" in result.recommendation.lower()


class _FakeScalarResult:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return list(self._rows)

    def first(self):
        return self._rows[0] if self._rows else None

    def scalars(self):
        return self


class _HabitSession:
    def __init__(self, responses):
        self._responses = responses
        self.calls = 0

    async def execute(self, *_args, **_kwargs):
        response = self._responses[self.calls]
        self.calls += 1
        return _FakeScalarResult(response)


@pytest.mark.asyncio
async def test_predict_user_habits_aggregates_history():
    user_id = uuid4()
    game_rows = [(3, datetime(2025, 11, 11, 18, 0, tzinfo=timezone.utc))]
    transaction_rows = [("care_reward", 5), ("shop_purchase", 2)]
    session = _HabitSession([game_rows, transaction_rows])

    result = await next_gen_service.predict_user_habits(session, user_id)
    assert result.next_best_time == "18:00"
    assert "care_reward" in result.preferred_actions

