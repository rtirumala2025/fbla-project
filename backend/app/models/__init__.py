"""Domain-level models for the Virtual Pet backend."""
from __future__ import annotations

from .auth import AuthenticatedUser
from .event import Event, EventEffect, EventParticipation, WeatherSnapshot
from .accessory import Accessory, EquippedAccessory, PetArtCacheEntry
from .pet import Pet, PetDiaryEntry, PetStats
from .quest import Quest, QuestDifficulty, QuestStatus, QuestType, UserQuest
from .shop import ShopItem
from .social import BlockedUser, FriendRequest, FriendStatus, Friendship
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
    "Quest",
    "UserQuest",
    "QuestType",
    "QuestDifficulty",
    "QuestStatus",
    "Friendship",
    "FriendRequest",
    "FriendStatus",
    "BlockedUser",
]
