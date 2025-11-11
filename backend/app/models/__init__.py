"""Domain-level models for the Virtual Pet backend."""
from __future__ import annotations

from .auth import AuthenticatedUser
from .event import Event, EventEffect, EventParticipation, WeatherSnapshot
from .accessory import Accessory, EquippedAccessory, PetArtCacheEntry
from .pet import Pet, PetDiaryEntry, PetStats
from .shop import ShopItem
from .user import User

__all__ = [
    "User",
    "ShopItem",
    "AuthenticatedUser",
    "Pet",
    "PetStats",
    "PetDiaryEntry",
    "Accessory",
    "EquippedAccessory",
    "PetArtCacheEntry",
    "Event",
    "EventEffect",
    "EventParticipation",
    "WeatherSnapshot",
]
