"""Utility helpers for the Virtual Pet backend."""
from __future__ import annotations

from .dependencies import (
    get_accessory_service,
    get_ai_service,
    get_auth_service,
    get_current_user,
    get_db_pool,
    get_pet_ai_service,
    get_pet_art_service,
    get_pet_service,
    get_profile_service,
    get_shop_service,
    get_users_service,
)
from .logging import configure_logging, get_logger

__all__ = [
    "configure_logging",
    "get_logger",
    "get_current_user",
    "get_auth_service",
    "get_profile_service",
    "get_pet_service",
    "get_pet_ai_service",
    "get_pet_art_service",
    "get_accessory_service",
    "get_db_pool",
    "get_users_service",
    "get_ai_service",
    "get_shop_service",
]
