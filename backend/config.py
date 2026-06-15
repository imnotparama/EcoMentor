"""
Application settings loaded from environment variables.
"""

import logging
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)

_INSECURE_DEFAULT_KEY = "change_me_in_production_please"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./ecomentorAI.db"
    SECRET_KEY: str = _INSECURE_DEFAULT_KEY
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    FRONTEND_URL: str = "http://localhost:5173"
    ANTHROPIC_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    ENVIRONMENT: str = "development"

    @model_validator(mode="after")
    def warn_insecure_secret(self) -> "Settings":
        if self.SECRET_KEY == _INSECURE_DEFAULT_KEY:
            if self.ENVIRONMENT == "production":
                raise ValueError(
                    "SECRET_KEY must be changed from the default value in production! "
                    "Set a secure random SECRET_KEY environment variable."
                )
            logger.warning(
                "⚠️  Using default SECRET_KEY — do NOT deploy to production without "
                "setting a secure SECRET_KEY environment variable."
            )
        return self


settings = Settings()
