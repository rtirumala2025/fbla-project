"""
Application configuration management.

This module centralizes environment variable loading and validation for the
backend. Future configuration values (for example, third-party API keys or
feature flags) should be added here.
"""

from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from dotenv import load_dotenv
from pydantic import AnyHttpUrl, BaseSettings, Field, ValidationError, validator
from sqlalchemy.engine.url import make_url


ENV_FILE = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=ENV_FILE, override=False)


class Settings(BaseSettings):
    """
    Strongly-typed environment configuration.

    Environment variables defined here are validated during application start-up.
    """

    database_url: str = Field(..., env="DATABASE_URL")
    jwt_secret: str = Field(..., env="JWT_SECRET")

    supabase_url: Optional[AnyHttpUrl] = Field(default=None, env="SUPABASE_URL")
    supabase_anon_key: str = Field(default="", env="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(default="", env="SUPABASE_SERVICE_ROLE_KEY")
    supabase_jwt_secret: str = Field(default="", env="SUPABASE_JWT_SECRET")

    openrouter_api_key: str = Field(default="", env="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="openrouter/llama-4-11b-instruct-scout", env="OPENROUTER_MODEL")
    openrouter_base_url: AnyHttpUrl = Field(
        default="https://openrouter.ai/api/v1/chat/completions",
        env="OPENROUTER_BASE_URL",
    )

    openai_api_key: str = Field(default="", env="OPENAI_API_KEY")
    openai_image_model: str = Field(default="gpt-image-1", env="OPENAI_IMAGE_MODEL")
    openai_image_api: AnyHttpUrl = Field(
        default="https://api.openai.com/v1/images/generations",
        env="OPENAI_IMAGE_API",
    )

    art_cache_ttl_hours: int = Field(default=12, ge=1, le=72, env="ART_CACHE_TTL_HOURS")

    allowed_origins: List[str] = Field(default_factory=lambda: ["*"], env="ALLOWED_ORIGINS")
    weather_api_key: str = Field(default="", env="WEATHER_API_KEY")
    ai_coach_endpoint: Optional[AnyHttpUrl] = Field(default=None, env="AI_COACH_ENDPOINT")

    class Config:
        env_file = ENV_FILE
        env_file_encoding = "utf-8"
        case_sensitive = False

    @validator("allowed_origins", pre=True)
    def _split_allowed_origins(cls, value: List[str] | str) -> List[str]:
        if isinstance(value, list):
            return value
        return [origin.strip() for origin in value.split(",") if origin.strip()]

    @validator("database_url", pre=True)
    def _normalize_database_url(cls, value: str) -> str:
        """
        Allow Supabase-style Postgres URLs (postgres://...) by translating them to
        SQLAlchemy's async driver scheme (postgresql+psycopg://) and ensure SSL is
        enforced when connecting to Supabase. Accept sqlite URLs for test runs.
        """

        if not value:
            return value

        normalized = value.strip()
        if normalized.startswith("sqlite"):
            return normalized

        if normalized.startswith("postgres://"):
            normalized = "postgresql+psycopg://" + normalized[len("postgres://") :]
        elif normalized.startswith("postgresql://") and "+" not in normalized.split("://", 1)[0]:
            normalized = "postgresql+psycopg://" + normalized[len("postgresql://") :]

        parsed = urlparse(normalized)
        if parsed.hostname and parsed.hostname.endswith("supabase.co"):
            query = dict(parse_qsl(parsed.query))
            if "sslmode" not in query:
                query["sslmode"] = "require"
                normalized = urlunparse(parsed._replace(query=urlencode(query)))

        return normalized

    @validator("database_url")
    def _validate_database_url(cls, value: str) -> str:
        try:
            url = make_url(value)
        except Exception as exc:  # pragma: no cover - defensive validation
            raise ValueError("DATABASE_URL is not a valid SQLAlchemy connection string.") from exc

        if url.drivername.startswith("sqlite"):
            return value

        if not url.drivername.startswith("postgresql"):
            raise ValueError("DATABASE_URL must use a PostgreSQL driver or sqlite for tests.")
        if "psycopg" not in url.drivername:
            raise ValueError("PostgreSQL DATABASE_URL must include the psycopg driver (e.g. postgresql+psycopg://).")
        return value


@lru_cache
def get_settings() -> Settings:
    """
    Retrieve cached application settings.

    Returns:
        Settings: Loaded configuration settings.

    Raises:
        RuntimeError: If required environment variables are missing or invalid.
    """

    try:
        return Settings()
    except ValidationError as exc:  # pragma: no cover - validated during startup
        missing_envs = ", ".join(str(error["loc"][0]) for error in exc.errors() if error.get("loc")) or "environment"
        raise RuntimeError(f"Invalid environment configuration: {missing_envs}") from exc


# Provide a convenient module-level reference for future imports.
settings: Optional[Settings] = None

