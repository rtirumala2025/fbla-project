"""API routes for seasonal events and weather reactions."""
from __future__ import annotations

from datetime import date
from typing import Dict, Optional

from fastapi import APIRouter, Depends, Query

from app.models import AuthenticatedUser, Event
from app.schemas import EventListResponse, EventResponse, WeatherResponse
from app.schemas.events import EventEffectPayload
from app.services import EventService, WeatherService
from app.services.event_service import ParticipationRecord
from app.utils.dependencies import (
    get_current_user,
    get_event_service,
    get_weather_service,
)

events_router = APIRouter(prefix="/events", tags=["Events"])
weather_router = APIRouter(prefix="/weather", tags=["Weather"])


@events_router.get("", response_model=EventListResponse)
async def list_events(
    current_user: AuthenticatedUser = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventListResponse:
    """Return the current and upcoming seasonal events."""
    current, upcoming = await event_service.list_events(today=date.today())
    participation = await event_service.get_participation_map(
        current_user.id,
        [event.event_id for event in [*current, *upcoming]],
    )
    return EventListResponse(
        current=[_serialize_event(event, participation) for event in current],
        upcoming=[_serialize_event(event, participation) for event in upcoming],
    )


@events_router.get("/{event_id}", response_model=EventResponse)
async def get_event_detail(
    event_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
    event_service: EventService = Depends(get_event_service),
) -> EventResponse:
    """Return details for a single seasonal event including participation info."""
    event = await event_service.get_event(event_id)
    participation = await event_service.get_participation_map(current_user.id, [event.event_id])
    return _serialize_event(event, participation)


@weather_router.get("", response_model=WeatherResponse)
async def get_weather(
    lat: Optional[float] = Query(default=None, description="Latitude of the user."),
    lon: Optional[float] = Query(default=None, description="Longitude of the user."),
    current_user: AuthenticatedUser = Depends(get_current_user),
    weather_service: WeatherService = Depends(get_weather_service),
) -> WeatherResponse:
    """Return the current weather snapshot for the requesting user."""
    snapshot = await weather_service.get_weather(user_id=current_user.id, lat=lat, lon=lon)
    return WeatherResponse(
        condition=snapshot.condition,
        description=snapshot.description,
        icon=snapshot.icon,
        temperature_c=snapshot.temperature_c,
        humidity=snapshot.humidity,
        wind_speed=snapshot.wind_speed,
        is_fallback=snapshot.is_fallback,
        fetched_at=snapshot.fetched_at,
        provider=snapshot.provider,
    )


def _serialize_event(event: Event, participation_map: Dict[str, ParticipationRecord]) -> EventResponse:
    participation = participation_map.get(event.event_id)
    today = date.today()
    days_until_start = (event.start_date - today).days if event.start_date > today else None
    days_remaining = (event.end_date - today).days if event.end_date >= today else None
    effects = EventEffectPayload(
        mood=event.effects.mood,
        stat_modifiers=event.effects.stat_modifiers,
        visual_overlays=event.effects.visual_overlays,
    )
    return EventResponse(
        event_id=event.event_id,
        name=event.name,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        type=event.type,
        effects=effects,
        is_active=event.is_active(today),
        is_upcoming=event.is_upcoming(today),
        days_until_start=days_until_start,
        days_remaining=days_remaining,
        participation_status=participation.status if participation else None,
    )

