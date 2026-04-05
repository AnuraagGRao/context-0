"""Application configuration loaded from environment variables."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://quiz_user:quiz_pass@db:5432/quiz_db"

    # JWT
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_super_secret_key_1234567890"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # App
    app_name: str = "General Knowledge Quiz API"
    debug: bool = False

    # CORS – comma-separated list of allowed origins
    cors_origins: str = "http://localhost:3000,http://frontend:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
