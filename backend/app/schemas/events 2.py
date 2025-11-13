"""Pydantic schemas for seasonal events and weather endpoints."""
from __future__ import annotations

from datetime import date, datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class EventEffectPayload(BaseModel):
    """Serialized representation of event effects returned to clients."""

    mood: Optional[str] = Field(
        default=None,
        description="Target mood override suggested by the event.",
    )
    stat_modifiers: Dict[str, int] = Field(
        default_factory=dict,
        description="Additive adjustments to pet stats keyed by stat name.",
    )
    visual_overlays: Dict[str, Any] = Field(
        default_factory=dict,
        description="Visual overlays, decorations, or animation identifiers.",
    )


class EventResponse(BaseModel):
    """Describe an event to be rendered on the dashboard or calendar."""

    event_id: str
    name: str
    description: Optional[str]
    start_date: date
    end_date: date
    type: str
    effects: EventEffectPayload
    is_active: bool
    is_upcoming: bool
    days_until_start: Optional[int]
    days_remaining: Optional[int]
    participation_status: Optional[str]


class EventListResponse(BaseModel):
    """Container for current and upcoming events."""

    current: list[EventResponse]
    upcoming: list[EventResponse]


class ParticipationResponse(BaseModel):
    """Return participation metadata to the frontend."""

    event_id: str
    status: str
    progress: Dict[str, Any]
    last_interacted_at: datetime


class WeatherResponse(BaseModel):
    """Current weather snapshot for the pet dashboard."""

    condition: str
    description: str
    icon: str
    temperature_c: float
    humidity: float
    wind_speed: float
    is_fallback: bool
    fetched_at: datetime
    provider: str


class SeasonalMoodPayload(BaseModel):
    """How seasonal systems affect a pet's visual and mood state."""

    mood: Optional[str]
    stat_modifiers: Dict[str, int]
    overlays: Dict[str, Any]
    active_events: list[str]
    weather_condition: Optional[str]

