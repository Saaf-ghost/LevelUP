from functools import lru_cache
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration for the BoostUP AI service."""

    app_name: str = "BoostUP AI Service"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/api/v1"
    host: str = "0.0.0.0"
    port: int = 8090
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # RabbitMQ Settings
    rabbitmq_host: str = "localhost"
    rabbitmq_port: int = 5672
    rabbitmq_user: str = "boostup"
    rabbitmq_password: str = "boostup"
    rabbitmq_queue: str = "boostup.pdf.jobs"
    rabbitmq_dlq: str = "boostup.pdf.jobs.dlq"
    rabbitmq_exchange: str = "boostup.ai.exchange"
    rabbitmq_dlx: str = "boostup.ai.dlx"
    rabbitmq_routing_key: str = "pdf.job.process"
    rabbitmq_dlq_routing_key: str = "pdf.job.dlq"
    rabbitmq_prefetch_count: int = 1  # 1 message per worker to prevent LLM contention

    # Ollama Local LLM Settings
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3:latest"
    ollama_timeout_seconds: float = 300.0

    # PDF & OCR Thresholds
    min_chars_per_page_threshold: int = 50  # Below this, page is treated as scanned image
    ocr_languages: str = "en"

    # Backend Gateway Integration
    backend_api_base: str = "http://localhost:8082"
    backend_callback_path: str = "/api/v1/jobs/{job_id}/callback"
    backend_callback_token: str = "change-this-ai-callback-token"
    max_job_retries: int = 3

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

    @property
    def ocr_lang_list(self) -> list[str]:
        return [lang.strip() for lang in self.ocr_languages.split(",") if lang.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
