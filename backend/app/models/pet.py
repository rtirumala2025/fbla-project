"""Domain models representing pet state and diary entries."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional


@dataclass
class PetStats:
    hunger: int
    hygiene: int
    energy: int
    mood: str
    health: int
    xp: int
    level: int
    evolution_stage: str
    is_sick: bool


@dataclass
class PetDiaryEntry:
    id: str
    mood: str
    note: Optional[str]
    created_at: datetime


@dataclass
class Pet:
    id: str
    user_id: str
    name: str
    species: str
    breed: Optional[str]
    color: Optional[str]
    created_at: datetime
    updated_at: datetime
    stats: PetStats
    diary: List[PetDiaryEntry] = field(default_factory=list)
