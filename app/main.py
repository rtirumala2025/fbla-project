"""
Main FastAPI application entry point.

Run the application with:
    uvicorn app.main:app --reload
"""

from fastapi import FastAPI

from app.core.config import get_settings
from app.routers import (
    ai,
    analytics,
    art,
    auth,
    budget_advisor,
    coach,
    finance,
    games,
    health,
    name_validator,
    next_gen,
    pet_commands,
    pets,
    profiles,
    quests,
    reports,
    shop,
    social,
    stats,
    sync,
    users,
)


def create_application() -> FastAPI:
    """
    Instantiate and configure the FastAPI application.

    Returns:
        FastAPI: Configured FastAPI application instance.
    """
    application = FastAPI(
        title="Virtual Pet API",
        description=(
            "Backend API for the Virtual Pet application. "
            "This initial scaffold exposes health check endpoints and "
            "provides a foundation for future feature development."
        ),
        version="0.1.0",
    )

    # Force environment validation during startup; raises helpful errors if misconfigured.
    get_settings()

    application.include_router(health.router)
    application.include_router(auth.router)
    application.include_router(ai.router)
    application.include_router(art.router)
    application.include_router(budget_advisor.router)
    application.include_router(pets.router)
    application.include_router(pets.legacy_router)
    application.include_router(pet_commands.router)
    application.include_router(finance.router)
    application.include_router(games.router)
    application.include_router(analytics.router)
    application.include_router(reports.router)
    application.include_router(next_gen.router)
    application.include_router(profiles.router)
    application.include_router(shop.router)
    application.include_router(social.router)
    application.include_router(stats.router)
    application.include_router(quests.router)
    application.include_router(coach.router)
    application.include_router(sync.router)
    application.include_router(users.router)
    application.include_router(name_validator.router)

    return application


app = create_application()

