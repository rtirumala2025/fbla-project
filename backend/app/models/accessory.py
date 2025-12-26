"""Domain models for pet accessories and art output."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class Accessory:
    """Represents an accessory in the catalog."""

    accessory_id: str
    name: str
    type: str
    rarity: str
    effects: Dict[str, object]
    color_palette: Dict[str, str]
    preview_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass
class EquippedAccessory:
    """Represents a user's equipped accessory state."""

    user_id: str
    pet_id: Optional[str]
    accessory_id: str
    equipped: bool
    equipped_color: Optional[str]
    equipped_slot: Optional[str]
    updated_at: datetime


@dataclass
class PetArtCacheEntry:
    """Represents a cached pet art generation result."""

    user_id: str
    pet_id: str
    prompt_hash: str
    prompt: str
    style: Optional[str]
    mood: Optional[str]
    accessory_ids: List[str]
    image_base64: str
    metadata: Dict[str, object]
    created_at: datetime
    expires_at: datetime

