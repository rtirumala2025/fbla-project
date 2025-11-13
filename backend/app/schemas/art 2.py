"""Schemas for AI-generated pet art endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class ArtGenerationRequest(BaseModel):
    pet_id: str = Field(..., description="Pet receiving the generated art.")
    accessory_ids: List[str] = Field(default_factory=list, description="Accessories to feature in the art.")
    style: Optional[str] = Field(default=None, description="Optional art style hint, e.g., watercolor.")
    force_refresh: bool = Field(default=False, description="Ignore cached results and force a new generation.")


class ArtGenerationResponse(BaseModel):
    image_base64: str = Field(..., description="Base64 encoded image data URI.")
    cached: bool = Field(..., description="Indicates whether this response came from cache.")
    prompt: str = Field(..., description="Prompt used for the generation.")
    style: Optional[str] = None
    accessory_ids: List[str] = Field(default_factory=list)
    mood: Optional[str] = None
    palette: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)

