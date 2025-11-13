"""
Schemas for pet art generation endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ArtGenerationRequest(BaseModel):
    pet_id: UUID
    accessory_ids: List[UUID] = Field(default_factory=list)
    style: Optional[str] = Field(default=None, max_length=64)
    force_refresh: bool = False


class ArtGenerationResponse(BaseModel):
    image_base64: str
    cached: bool
    prompt: str
    style: Optional[str]
    accessory_ids: List[str]
    mood: Optional[str]
    palette: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime


