"""Schemas for AI-related API endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    """Incoming payload for conversational AI chat."""

    session_id: Optional[str] = Field(
        default=None,
        description="Opaque client-provided identifier for caching context.",
        max_length=128,
    )
    message: str = Field(..., min_length=1, max_length=1500)
    model: Optional[str] = Field(
        default=None,
        description="Override for the default OpenRouter model.",
        max_length=128,
    )


class AIChatResponse(BaseModel):
    """LLM-backed response payload."""

    session_id: str = Field(description="Resolved session identifier managed by MCP.")
    message: str = Field(description="Assistant response surfaced to the UI.")
    mood: Optional[str] = Field(
        default=None,
        description="Assistant-evaluated mood label (ecstatic, happy, content, anxious, distressed).",
    )
    notifications: List[str] = Field(default_factory=list)
    pet_state: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Derived pet state snapshot for dashboard visualisations.",
    )
    health_forecast: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Predictive health analytics generated for upcoming interactions.",
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)
