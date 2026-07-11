"""
Application configuration via pydantic-settings.
All values read from environment variables / .env file.
No hardcoded secrets or magic numbers.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central config — every tunable value lives here."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = "sqlite:///./mooos.db"

    # ── Auth / JWT ────────────────────────────────────────────
    SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480  # 8-hour shift

    # ── Telegram Bot ──────────────────────────────────────────
    TELEGRAM_BOT_TOKEN: str = ""
    TELEGRAM_BOT_USERNAME: str = "MooOSBot"
    TELEGRAM_GROUP_PAKAN: str = ""
    TELEGRAM_GROUP_SUSU: str = ""
    TELEGRAM_GROUP_PUPUK: str = ""
    TELEGRAM_GROUP_ADMIN: str = ""

    # ── CORS ──────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # ── Business defaults (overridable per koperasi) ──────────
    DEFAULT_FEED_KG_PER_COW_PER_DAY: float = 10.0
    DEFAULT_WASTE_KG_PER_COW_PER_DAY: float = 10.0
    DEFAULT_FERMENTATION_DAYS: int = 14
    FEED_CRITICAL_DAYS_THRESHOLD: int = 7
    FERTILIZER_READY_MIN_KG: float = 500.0
    PROFIT_SHARE_KOPERASI: float = 0.6
    PROFIT_SHARE_MEMBER: float = 0.4


def get_settings() -> Settings:
    """Dependency-injectable settings factory."""
    return Settings()
