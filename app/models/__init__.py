"""
Model package for Pydantic schemas and ORM models.

Future modules in this package will define data representations used by the
application, such as user data transfer objects (DTOs) or SQLAlchemy models
for Supabase-backed tables.
"""

from app.models.analytics import (
    AnalyticsDailySnapshot,
    AnalyticsMonthlySnapshot,
    AnalyticsNotification,
    AnalyticsWeeklySnapshot,
)
from app.models.base import Base, TimestampMixin
from app.models.finance import Goal, InventoryItem, ShopItem, Transaction, Wallet
from app.models.game import GameAchievement, GameLeaderboard, GameRound, GameSession
from app.models.pet_art import PetArtCache
from app.models.pet import BREED_OPTIONS, Pet, SpeciesEnum
from app.models.profile import Profile, UserPreferences
from app.models.quest import Quest, QuestDifficulty, QuestStatus, QuestType, UserQuest
from app.models.social import FriendStatus, Friendship, PublicProfile
from app.models.next_gen import ARSession, VoiceCommand
from app.models.sync import CloudSyncSnapshot
from app.models.user import User, UserCreate, UserLogin, UserRead, UserUpdate

__all__ = [
    "Base",
    "TimestampMixin",
    "User",
    "UserCreate",
    "UserLogin",
    "UserRead",
    "UserUpdate",
    "Wallet",
    "Transaction",
    "InventoryItem",
    "Goal",
    "ShopItem",
    "PetArtCache",
    "GameRound",
    "GameSession",
    "GameLeaderboard",
    "GameAchievement",
    "Pet",
    "SpeciesEnum",
    "BREED_OPTIONS",
    "Friendship",
    "FriendStatus",
    "PublicProfile",
    "Quest",
    "QuestType",
    "QuestDifficulty",
    "QuestStatus",
    "UserQuest",
    "CloudSyncSnapshot",
    "AnalyticsDailySnapshot",
    "AnalyticsWeeklySnapshot",
    "AnalyticsMonthlySnapshot",
    "AnalyticsNotification",
    "Profile",
    "UserPreferences",
    "VoiceCommand",
    "ARSession",
]

