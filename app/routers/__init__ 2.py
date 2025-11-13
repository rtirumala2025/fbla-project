"""
Router package for API endpoints.

Each module inside this package defines logically grouped FastAPI routers.
For example, `health.py` exposes application health endpoints, while future
modules such as `users.py` or `pets.py` will encapsulate their respective
domain routes.
"""

from app.routers import ai, analytics, art, coach, finance, games, next_gen, pets, profiles, quests, shop, social, sync, users

__all__ = [
    "finance",
    "games",
    "analytics",
    "art",
    "next_gen",
    "pets",
    "profiles",
    "shop",
    "social",
    "quests",
    "coach",
    "sync",
    "users",
    "ai",
]

