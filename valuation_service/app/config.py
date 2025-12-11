"""Configuration settings for the valuation service."""
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # API Settings
    app_name: str = "Property Valuation Service"
    app_version: str = "1.0.0"
    api_prefix: str = "/api/v1"

    # Server Settings
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True

    # CORS Settings
    allowed_origins: List[str] = ["http://localhost:3000"]
    allowed_methods: List[str] = ["*"]
    allowed_headers: List[str] = ["*"]

    # Logging
    log_level: str = "INFO"

    class Config:  # pylint: disable=too-few-public-methods
        """Pydantic configuration."""
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# Create settings instance
settings = Settings()
