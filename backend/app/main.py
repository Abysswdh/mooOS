"""
MooOS v2 — FastAPI Application Factory.

Kept under 50 lines per convention. All routes live in routers/.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_all_tables


from app.bot import start_bot_thread

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables (dev convenience). Shutdown: cleanup."""
    create_all_tables()
    start_bot_thread()
    yield


def create_app() -> FastAPI:
    """App factory — returns a fully configured FastAPI instance."""
    settings = get_settings()

    app = FastAPI(
        title="MooOS API",
        description="SaaS Operating System untuk Koperasi Ternak Sapi Perah",
        version="2.0.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register routers
    from app.routers import auth, cows, members, dashboard, checklist, feed, milk, waste
    app.include_router(auth.router)
    app.include_router(cows.router)
    app.include_router(members.router)
    app.include_router(dashboard.router)
    app.include_router(checklist.router)
    app.include_router(feed.router)
    app.include_router(milk.router)
    app.include_router(waste.waste_router)
    app.include_router(waste.fertilizer_router)
    
    from app.routers import prices, attendance, notifications, health, telegram, reports, settings
    app.include_router(prices.router)
    app.include_router(attendance.router)
    app.include_router(notifications.router)
    app.include_router(health.router)
    app.include_router(telegram.router)
    app.include_router(reports.router)
    app.include_router(settings.router)

    return app


app = create_app()
