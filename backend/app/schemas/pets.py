"""Pydantic schemas for pet management and actions."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, ConfigDict

from .events import SeasonalMoodPayload


class EvolutionStage(str, Enum):
    egg = "egg"
    juvenile = "juvenile"
    adult = "adult"
    legendary = "legendary"


class PetStats(BaseModel):
    hunger: int = Field(ge=0, le=100)
    hygiene: int = Field(ge=0, le=100)
    energy: int = Field(ge=0, le=100)
    mood: str
    health: int = Field(ge=0, le=100)
    xp: int = Field(ge=0)
    level: int = Field(ge=1)
    evolution_stage: EvolutionStage
    is_sick: bool


class PetBase(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    species: str = Field(min_length=2, max_length=32)
    breed: Optional[str] = Field(default=None, max_length=64)
    color: Optional[str] = Field(default=None, max_length=32)


class PetCreate(PetBase):
    model_config = ConfigDict(extra="forbid")


class PetUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=50)
    species: Optional[str] = Field(default=None, min_length=2, max_length=32)
    breed: Optional[str] = Field(default=None, max_length=64)
    color: Optional[str] = Field(default=None, max_length=32)

    model_config = ConfigDict(extra="forbid")


class PetDiaryEntryResponse(BaseModel):
    id: str
    mood: str
    note: Optional[str] = None
    created_at: datetime


class PetDiaryCreate(BaseModel):
    mood: str = Field(min_length=3, max_length=32)
    note: Optional[str] = Field(default=None, max_length=280)

    model_config = ConfigDict(extra="forbid")


class PetResponse(PetBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    stats: PetStats
    diary: list[PetDiaryEntryResponse] = Field(default_factory=list)
    seasonal_state: SeasonalMoodPayload | None = Field(
        default=None,
        description="Seasonal mood overlays generated from events and weather.",
    )


class PetAction(str, Enum):
    feed = "feed"
    play = "play"
    bathe = "bathe"
    rest = "rest"


class PetActionRequest(BaseModel):
    food_type: Optional[str] = None
    game_type: Optional[str] = None
    duration_hours: Optional[int] = Field(default=None, ge=1, le=12)

    model_config = ConfigDict(extra="forbid")


class PetActionResponse(BaseModel):
    pet: PetResponse
    reaction: str
    mood: str
    notifications: list[str] = Field(default_factory=list)
    health_forecast: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Predictive outlook with suggested follow-up actions.",
    )


class PetInteractRequest(BaseModel):
    session_id: Optional[str] = Field(
        default=None,
        description="Client-provided session identifier used for context caching.",
        max_length=128,
    )
    action: str = Field(..., min_length=2, max_length=32)
    message: Optional[str] = Field(default=None, max_length=500)

    model_config = ConfigDict(extra="forbid")


class PetInteractResponse(BaseModel):
    session_id: str
    message: str
    mood: str
    pet_state: Dict[str, Any]
    notifications: list[str] = Field(default_factory=list)
    health_forecast: Optional[Dict[str, Any]] = None


class HealthCheckRequest(BaseModel):
    """Request for a vet health check."""
    health_boost: int = Field(..., ge=0, le=100, description="Health boost to apply (from mini-game score)")
    game_score: Optional[int] = Field(default=None, ge=0, description="Score achieved in health check game")

    model_config = ConfigDict(extra="forbid")


class HealthCheckResponse(BaseModel):
    """Response from a vet health check."""
    success: bool
    cost: int
    new_balance: int
    health_before: int
    health_after: int
    message: str