"""Common dependency functions for FastAPI routes."""
from __future__ import annotations

from functools import lru_cache
from typing import Optional

from asyncpg import Pool
from fastapi import Depends, HTTPException, Request, status

from app.core.database import database
from app.models import AuthenticatedUser


async def get_db_pool() -> Optional[Pool]:
    return database.pool


async def get_users_service(pool: Optional[Pool] = Depends(get_db_pool)):
    from app.services.users_service import UserService

    return UserService(pool)


async def get_ai_service(pool: Optional[Pool] = Depends(get_db_pool)):
    from app.services.ai_service import AIService

    return AIService(pool=pool)


async def get_shop_service():
    from app.services.shop_service import ShopService

    return ShopService()


async def get_auth_service():
    from app.services.auth_service import AuthService

    return AuthService()


async def get_profile_service(pool: Optional[Pool] = Depends(get_db_pool)):
    from app.services.profile_service import ProfileService

    return ProfileService(pool)


async def get_storage_service():
    from app.services.storage_service import StorageService

    return StorageService()


async def get_accessory_service(pool: Optional[Pool] = Depends(get_db_pool)):
    from app.services.accessory_service import AccessoryService

    return AccessoryService(pool)


async def get_pet_art_service(pool: Optional[Pool] = Depends(get_db_pool)):
    from app.services.pet_art_service import PetArtService

    return PetArtService(pool)


async def get_pet_ai_service(pool: Optional[Pool] = Depends(get_db_pool)):
    from app.services.pet_ai_service import PetAIService

    return PetAIService(pool)


async def get_pet_service(
    pool: Optional[Pool] = Depends(get_db_pool),
    ai_service=Depends(get_pet_ai_service),
    seasonal_service=Depends(get_seasonal_service),
):
    from app.services.pet_service import PetService

    return PetService(pool, ai_service, seasonal_service)


async def get_event_service(pool: Optional[Pool] = Depends(get_db_pool)):
    from app.services.event_service import EventService

    return EventService(pool)


@lru_cache(maxsize=1)
def _weather_service_singleton():
    from app.services.weather_service import WeatherService

    return WeatherService()


def get_weather_service():
    return _weather_service_singleton()


async def get_seasonal_service(
    event_service=Depends(get_event_service),
    weather_service=Depends(get_weather_service),
):
    from app.services.seasonal_service import SeasonalReactionsService

    if event_service is None:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Seasonal features unavailable without database.")
    return SeasonalReactionsService(event_service, weather_service)


async def get_current_user(request: Request) -> AuthenticatedUser:
    user = getattr(request.state, "user", None)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated.")
    return user
