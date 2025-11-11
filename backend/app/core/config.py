"""Application configuration utilities."""
from __future__ import annotations

from functools import lru_cache
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings loaded from the environment."""

    database_url: str = Field(default="", alias="DATABASE_URL")
    jwt_secret: str = Field(default="", alias="JWT_SECRET")
    supabase_jwt_secret: str = Field(default="", alias="SUPABASE_JWT_SECRET")
    supabase_url: str = Field(default="", alias="SUPABASE_URL")
    supabase_anon_key: str = Field(default="", alias="SUPABASE_ANON_KEY")
    supabase_service_role_key: str = Field(default="", alias="SUPABASE_SERVICE_ROLE_KEY")
    supabase_storage_bucket: str = Field(default="avatars", alias="SUPABASE_STORAGE_BUCKET")
    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="openrouter/llama-4-11b-instruct-scout", alias="OPENROUTER_MODEL")
    openrouter_base_url: str = Field(default="https://openrouter.ai/api/v1/chat/completions", alias="OPENROUTER_BASE_URL")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    openai_image_model: str = Field(default="gpt-image-1", alias="OPENAI_IMAGE_MODEL")
    openai_image_api: str = Field(default="https://api.openai.com/v1/images/generations", alias="OPENAI_IMAGE_API")
    art_cache_ttl_hours: int = Field(default=12, alias="ART_CACHE_TTL_HOURS")
    weather_api_key: str = Field(default="", alias="WEATHER_API_KEY")
    allowed_origins: List[str] = Field(default_factory=lambda: ["*"])

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    def get_allowed_origins(self) -> List[str]:
        """Allow providing origins as comma-separated string."""
        if len(self.allowed_origins) == 1 and "," in self.allowed_origins[0]:
            return [origin.strip() for origin in self.allowed_origins[0].split(",") if origin.strip()]
        return self.allowed_origins


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()  # type: ignore[call-arg]
