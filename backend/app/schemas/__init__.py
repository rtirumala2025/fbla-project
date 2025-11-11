"""Public schemas exposed by the application."""
from __future__ import annotations

from .ai import AIChatRequest, AIChatResponse
from .art import ArtGenerationRequest, ArtGenerationResponse
from .auth import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, TokenResponse
from .profiles import (
    AvatarUploadResponse,
    Preferences,
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
)
from .pets import (
    EvolutionStage,
    PetAction,
    PetActionRequest,
    PetActionResponse,
    PetCreate,
    PetDiaryCreate,
    PetDiaryEntryResponse,
    PetInteractRequest,
    PetInteractResponse,
    PetResponse,
    PetStats,
    PetUpdate,
)
from .shop import PurchaseRequest, ShopItem
from .users import UserBase, UserCreate, UserResponse
from .events import (
    EventEffectPayload,
    EventListResponse,
    EventResponse,
    ParticipationResponse,
    SeasonalMoodPayload,
    WeatherResponse,
)
from .accessories import (
    AccessoryEquipRequest,
    AccessoryEquipResponse,
    AccessoryListResponse,
    AccessorySchema,
    EquippedAccessorySchema,
)

__all__ = [
    "AIChatRequest",
    "AIChatResponse",
    "ArtGenerationRequest",
    "ArtGenerationResponse",
    "SignupRequest",
    "LoginRequest",
    "RefreshRequest",
    "LogoutRequest",
    "TokenResponse",
    "ProfileCreate",
    "ProfileUpdate",
    "ProfileResponse",
    "AvatarUploadResponse",
    "Preferences",
    "PetCreate",
    "PetUpdate",
    "PetResponse",
    "PetStats",
    "PetAction",
    "PetActionRequest",
    "PetActionResponse",
    "PetInteractRequest",
    "PetInteractResponse",
    "PetDiaryCreate",
    "PetDiaryEntryResponse",
    "EvolutionStage",
    "AccessorySchema",
    "AccessoryListResponse",
    "AccessoryEquipRequest",
    "AccessoryEquipResponse",
    "EquippedAccessorySchema",
    "PurchaseRequest",
    "ShopItem",
    "UserBase",
    "UserCreate",
    "UserResponse",
    "EventResponse",
    "EventListResponse",
    "EventEffectPayload",
    "ParticipationResponse",
    "WeatherResponse",
    "SeasonalMoodPayload",
]
