"""
SQLAlchemy engine, session factory, and Base declarative class.
No seed logic here — seeding is a separate CLI command (seed.py).
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


_settings = get_settings()

if _settings.DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        _settings.DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(
        _settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


def create_all_tables() -> None:
    """Create all tables defined by models that import Base.

    Call this once at app startup (lifespan) or from a migration script.
    In production, prefer Alembic migrations over create_all.
    """
    # Import all model modules so Base.metadata knows about them.
    import app.models.user  # noqa: F401
    import app.models.member  # noqa: F401
    import app.models.barn  # noqa: F401
    import app.models.cow  # noqa: F401
    import app.models.milk  # noqa: F401
    import app.models.feed  # noqa: F401
    import app.models.waste  # noqa: F401
    import app.models.market_price  # noqa: F401
    import app.models.checklist  # noqa: F401
    import app.models.notification  # noqa: F401
    import app.models.attendance  # noqa: F401
    import app.models.telegram_contact  # noqa: F401
    import app.models.health_log  # noqa: F401
    import app.models.milk_offer  # noqa: F401
    import app.models.settings  # noqa: F401
    import app.models.auction  # noqa: F401

    Base.metadata.create_all(bind=engine)


def get_db() -> Session:  # type: ignore[misc]
    """FastAPI dependency that yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db  # type: ignore[misc]
    finally:
        db.close()
