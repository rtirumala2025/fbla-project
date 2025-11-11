from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Dict, Iterable, List, Tuple

import pytest
from httpx import AsyncClient

from app.models import AuthenticatedUser, Event, EventEffect, WeatherSnapshot
from app.services.event_service import ParticipationRecord
from app.utils.dependencies import get_current_user, get_event_service, get_weather_service


class FakeEventService:
    def __init__(self) -> None:
        today = date.today()
        now = datetime.now(timezone.utc)
        self.current_event = Event(
            event_id="event-current",
            name="Aurora Festival",
            description="Celestial lights inspire joyful pets.",
            start_date=today - timedelta(days=1),
            end_date=today + timedelta(days=2),
            type="festival",
            effects=EventEffect(
                mood="radiant",
                stat_modifiers={"energy": 8},
                visual_overlays={"sky": "aurora"},
            ),
            created_at=now - timedelta(days=5),
            updated_at=now,
        )
        self.upcoming_event = Event(
            event_id="event-upcoming",
            name="Harvest Parade",
            description="Bountiful treats for every friend.",
            start_date=today + timedelta(days=3),
            end_date=today + timedelta(days=6),
            type="holiday",
            effects=EventEffect(
                mood=None,
                stat_modifiers={"hunger": 5},
                visual_overlays={"garland": "harvest"},
            ),
            created_at=now - timedelta(days=10),
            updated_at=now,
        )

    async def list_events(self, *, today: date) -> Tuple[List[Event], List[Event]]:
        return [self.current_event], [self.upcoming_event]

    async def get_event(self, event_id: str) -> Event:
        if event_id == self.current_event.event_id:
            return self.current_event
        if event_id == self.upcoming_event.event_id:
            return self.upcoming_event
        raise ValueError("Event not found")

    async def get_participation_map(self, user_id: str, event_ids: Iterable[str]) -> Dict[str, ParticipationRecord]:
        now = datetime.now(timezone.utc)
        return {
            self.current_event.event_id: ParticipationRecord(
                event_id=self.current_event.event_id,
                status="registered",
                progress={"quests_completed": 2},
                last_interacted_at=now,
            )
        }


class FakeWeatherService:
    def __init__(self) -> None:
        self.last_request = None

    async def get_weather(self, *, user_id: str, lat: float | None, lon: float | None) -> WeatherSnapshot:
        self.last_request = (user_id, lat, lon)
        return WeatherSnapshot(
            condition="Snow",
            description="Soft snowfall blankets the ground.",
            icon="13d",
            temperature_c=-4.0,
            humidity=72.0,
            wind_speed=3.2,
            is_fallback=False,
            fetched_at=datetime.now(timezone.utc),
            provider="test-weather",
        )


@pytest.fixture()
def override_event_dependencies():
    fake_event_service = FakeEventService()
    fake_weather_service = FakeWeatherService()

    async def _current_user_override():
        return AuthenticatedUser(id="user-123", email="user@example.com")

    from app.main import app

    app.dependency_overrides[get_current_user] = _current_user_override
    app.dependency_overrides[get_event_service] = lambda: fake_event_service
    app.dependency_overrides[get_weather_service] = lambda: fake_weather_service

    yield fake_event_service, fake_weather_service

    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_event_service, None)
    app.dependency_overrides.pop(get_weather_service, None)


@pytest.mark.anyio
async def test_list_events_endpoint(test_client: AsyncClient, override_event_dependencies) -> None:
    response = await test_client.get("/api/events")
    assert response.status_code == 200
    payload = response.json()
    assert len(payload["current"]) == 1
    assert len(payload["upcoming"]) == 1

    current = payload["current"][0]
    assert current["event_id"] == "event-current"
    assert current["is_active"] is True
    assert current["participation_status"] == "registered"
    assert current["effects"]["stat_modifiers"]["energy"] == 8

    upcoming = payload["upcoming"][0]
    assert upcoming["event_id"] == "event-upcoming"
    assert upcoming["is_upcoming"] is True
    assert upcoming["days_until_start"] is not None


@pytest.mark.anyio
async def test_event_detail_endpoint(test_client: AsyncClient, override_event_dependencies) -> None:
    response = await test_client.get("/api/events/event-current")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Aurora Festival"
    assert data["effects"]["mood"] == "radiant"
    assert data["participation_status"] == "registered"


@pytest.mark.anyio
async def test_weather_endpoint(test_client: AsyncClient, override_event_dependencies) -> None:
    response = await test_client.get("/api/weather?lat=51.5&lon=-0.1")
    assert response.status_code == 200
    data = response.json()
    assert data["condition"] == "Snow"
    assert data["temperature_c"] == -4.0
    assert data["provider"] == "test-weather"

