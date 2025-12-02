"""Entrypoint for the FastAPI application."""
from __future__ import annotations

from contextlib import asynccontextmanager

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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    await connect_to_database(app)
    yield
    # Shutdown
    await disconnect_from_database(app)


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging()

    app = FastAPI(
        title="Virtual Pet API",
        description="Backend services for the Virtual Pet web application.",
        version="0.1.0",
        lifespan=lifespan,
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

    return app


app = create_app()
