"""Entrypoint for the FastAPI application."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import connect_to_database, disconnect_from_database
from app.core.errors import register_exception_handlers
from app.middleware.authentication import JWTAuthenticationMiddleware
from app.middleware.error_handler import error_handling_middleware
from app.routers import api_router
from app.routers.health import router as health_router
from app.utils.logging import configure_logging


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()

    app = FastAPI(
        title="Virtual Pet API",
        description="Backend services for the Virtual Pet web application.",
        version="0.1.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.get_allowed_origins(),
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )
    app.add_middleware(
        JWTAuthenticationMiddleware,
        excluded_paths=(
            "/health",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/api/auth/signup",
            "/api/auth/login",
            "/api/auth/refresh",
        ),
    )

    app.middleware("http")(error_handling_middleware)

    register_exception_handlers(app)

    app.include_router(health_router)
    app.include_router(api_router)

    @app.on_event("startup")
    async def startup_event() -> None:  # pragma: no cover - FastAPI lifecycle
        await connect_to_database(app)

    @app.on_event("shutdown")
    async def shutdown_event() -> None:  # pragma: no cover - FastAPI lifecycle
        await disconnect_from_database(app)

    return app


app = create_app()
