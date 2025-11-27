"""Router composition for the application."""
from __future__ import annotations

from fastapi import APIRouter

from .accessories import router as accessories_router
from .ai import router as ai_router
from .art import router as art_router
from .auth import router as auth_router
from .events import events_router, weather_router
from .pets import router as pets_router
from .pet_interactions import router as pet_interactions_router
from .profiles import router as profiles_router
from .shop import router as shop_router
from .social import router as social_router
from .users import router as users_router

api_router = APIRouter(prefix="/api")
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(profiles_router)
api_router.include_router(pets_router)
api_router.include_router(pet_interactions_router)
api_router.include_router(ai_router)
api_router.include_router(shop_router)
api_router.include_router(events_router)
api_router.include_router(weather_router)
api_router.include_router(accessories_router)
api_router.include_router(art_router)
api_router.include_router(social_router)

__all__ = ["api_router"]
