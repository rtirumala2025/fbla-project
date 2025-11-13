"""
Schemas for next-generation features (social, voice, AR, weather, habit prediction).
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class SocialInteractionRequest(BaseModel):
    pet_id: UUID
    target_pet_id: UUID
    prompt: str


class SocialInteractionResponse(BaseModel):
    summary: str
    suggested_follow_up: str
    timestamp: datetime


class VoiceCommandRequest(BaseModel):
    transcript: str
    locale: str = Field(default="en-US")


class VoiceCommandResponse(BaseModel):
    intent: str
    confidence: float
    action: Optional[str]
    feedback: str


class ARSessionResponse(BaseModel):
    session_id: str
    anchor_description: str
    instructions: List[str]


class CloudSavePayload(BaseModel):
    state: dict


class CloudSaveResponse(BaseModel):
    saved_at: datetime
    checksum: str


class WeatherReactionResponse(BaseModel):
    condition: str
    temperature_c: float
    reaction: str
    recommendation: str


class HabitPredictionResponse(BaseModel):
    preferred_actions: List[str]
    next_best_time: str
    confidence: float


class SeasonalEventResponse(BaseModel):
    event_name: str
    message: str
    rewards: List[str]

