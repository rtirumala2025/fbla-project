from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

import pytest

from app.models import Event, EventEffect, Pet, PetDiaryEntry, PetStats as DomainPetStats, WeatherSnapshot
from app.schemas.events import EventEffectPayload
from app.services.event_service import ParticipationRecord
from app.services.seasonal_service import SeasonalReactionsService


class StubEventService:
    def __init__(self, events: list[Event], participation: dict[str, ParticipationRecord]):
        self._events = events
        self._participation = participation
        self.ensure_calls: list[str] = []

    async def list_events(self, *, today: date):
        return self._events, []

    async def get_participation_map(self, user_id: str, event_ids):
        return {event_id: self._participation[event_id] for event_id in event_ids if event_id in self._participation}

    async def ensure_participation(self, user_id: str, event: Event, *, status_value: str = "active"):
        self.ensure_calls.append(event.event_id)
        return ParticipationRecord(
            event_id=event.event_id,
            status=status_value,
            progress={},
            last_interacted_at=datetime.now(timezone.utc),
        )


class StubWeatherService:
    def __init__(self, snapshot: WeatherSnapshot):
        self.snapshot = snapshot

    async def get_weather(self, *, user_id: str, lat, lon):
        return self.snapshot


def _pet() -> Pet:
    stats = DomainPetStats(
        hunger=70,
        hygiene=80,
        energy=60,
        mood="content",
        health=85,
        xp=120,
        level=5,
        evolution_stage="juvenile",
        is_sick=False,
    )
    now = datetime.now(timezone.utc)
    return Pet(
        id="pet-1",
        user_id="user-1",
        name="Comet",
        species="dragon",
        breed="skywing",
        color="cerulean",
        created_at=now,
        updated_at=now,
        stats=stats,
        diary=[PetDiaryEntry(id="entry-1", mood="content", note=None, created_at=now)],
    )


def _event(effect: EventEffect) -> Event:
    now = datetime.now(timezone.utc)
    today = date.today()
    return Event(
        event_id="event-1",
        name="Winter Festival",
        description="Celebrate winter with your pet.",
        start_date=today - timedelta(days=1),
        end_date=today + timedelta(days=5),
        type="holiday",
        effects=effect,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.anyio
async def test_seasonal_event_and_weather_adjustments() -> None:
    event_effect = EventEffect(
        mood="festive",
        stat_modifiers={"energy": 10, "hunger": -5},
        visual_overlays={"banners": "winter"},
    )
    event = _event(event_effect)
    participation: dict[str, ParticipationRecord] = {}
    weather_snapshot = WeatherSnapshot(
        condition="Snow",
        description="Snowflakes are falling.",
        icon="13d",
        temperature_c=-2.0,
        humidity=80.0,
        wind_speed=5.5,
        is_fallback=False,
        fetched_at=datetime.now(timezone.utc),
        provider="test",
    )

    service = SeasonalReactionsService(
        event_service=StubEventService([event], participation),
        weather_service=StubWeatherService(weather_snapshot),
    )
    pet = _pet()
    updated_stats, payload = await service.gather_mood_context(user_id="user-1", pet=pet)

    assert updated_stats.energy == 78  # +10 from event, +8 from snow
    assert updated_stats.hunger == 65  # -5 from event (floor)
    assert payload.mood == "festive"
    assert payload.stat_modifiers["energy"] == 18
    assert payload.stat_modifiers["hunger"] == -5
    assert payload.overlays["event_banners"] == "winter"
    assert payload.overlays["weather"] == "snow"
    assert payload.weather_condition == "Snow"


@pytest.mark.anyio
async def test_weather_fallback_preserves_previous_stats_when_no_events() -> None:
    weather_snapshot = WeatherSnapshot(
        condition="Clear",
        description="Bright sunshine.",
        icon="01d",
        temperature_c=24.0,
        humidity=40.0,
        wind_speed=2.0,
        is_fallback=True,
        fetched_at=datetime.now(timezone.utc),
        provider="fallback",
    )
    service = SeasonalReactionsService(
        event_service=StubEventService([], {}),
        weather_service=StubWeatherService(weather_snapshot),
    )

    pet = _pet()
    updated_stats, payload = await service.gather_mood_context(user_id="user-1", pet=pet)

    assert updated_stats.energy == 64  # +4 from clear weather
    assert payload.mood == "happy"  # weather-derived mood
    assert payload.active_events == []
    assert payload.weather_condition == "Clear"

