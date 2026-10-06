from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://quiz_user:quiz_pass@db:5432/quiz_db"

    @field_validator("database_url", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: str) -> str:
        if isinstance(v, str):
            if v.startswith("postgres://"):
                return v.replace("postgres://", "postgresql+asyncpg://", 1)
            elif v.startswith("postgresql://") and not v.startswith("postgresql+asyncpg://"):
                return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        return v

    # JWT
    secret_key: str = "CHANGE_ME_IN_PRODUCTION_super_secret_key_1234567890"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # App
    app_name: str = "Context0 API"
    debug: bool = False

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()

