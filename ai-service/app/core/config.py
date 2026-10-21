from functools import lru_cache
from typing import Any

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the standalone AI service.

    Environment variables use the ``AI_SERVICE_`` prefix, for example
    ``AI_SERVICE_PORT`` or ``AI_SERVICE_CORS_ORIGINS``.
    """

    app_name: str = "BoostUP AI Service"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8090
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="AI_SERVICE_",
        case_sensitive=False,
        extra="ignore",
    )

    @field_validator("api_prefix")
    @classmethod
    def normalize_api_prefix(cls, value: str) -> str:
        value = value.strip()
        if not value.startswith("/"):
            value = f"/{value}"
        return value.rstrip("/")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
