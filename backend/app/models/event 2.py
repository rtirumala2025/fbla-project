"""Domain models for seasonal events and weather reactions."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime
from typing import Any, Dict, Optional


@dataclass(slots=True)
class EventEffect:
    """Describe the effect an event has on a pet's mood and stats."""

    mood: Optional[str]
    stat_modifiers: Dict[str, int]
    visual_overlays: Dict[str, Any]


@dataclass(slots=True)
class Event:
    """Represent a seasonal event or festival."""

    event_id: str
    name: str
    description: Optional[str]
    start_date: date
    end_date: date
    type: str
    effects: EventEffect
    created_at: datetime
    updated_at: datetime

    def is_active(self, today: date) -> bool:
        """Return True if the event is active for the provided date."""
        return self.start_date <= today <= self.end_date

    def is_upcoming(self, today: date) -> bool:
        """Return True if the event has not yet started."""
        return today < self.start_date


@dataclass(slots=True)
class EventParticipation:
    """Store a user's participation metadata for an event."""

    participation_id: str
    event_id: str
    user_id: str
    status: str
    progress: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    last_interacted_at: datetime


@dataclass(slots=True)
class WeatherSnapshot:
    """Captures the current weather condition for the dashboard."""

    condition: str
    description: str
    icon: str
    temperature_c: float
    humidity: float
    wind_speed: float
    is_fallback: bool
    fetched_at: datetime
    provider: str

