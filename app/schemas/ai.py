"""
Schemas supporting conversational AI endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    session_id: Optional[str] = Field(
        default=None,
        description="Client provided session identifier used to resume a cached conversation.",
        max_length=128,
    )
    message: str = Field(..., min_length=1, max_length=1500)
    model: Optional[str] = Field(default=None, max_length=128)

    def ensure_session_id(self) -> str:
        if self.session_id:
            return self.session_id
        new_id = uuid4().hex
        self.session_id = new_id
        return new_id


class AIChatResponse(BaseModel):
    session_id: str
    message: str
    mood: Optional[str] = None
    notifications: List[str] = Field(default_factory=list)
    pet_state: Optional[Dict[str, Any]] = None
    health_forecast: Optional[Dict[str, Any]] = None
    generated_at: datetime = Field(default_factory=datetime.utcnow)


