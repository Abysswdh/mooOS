"""
MooOS v2 — FastAPI Application Factory.

Kept under 50 lines per convention. All routes live in routers/.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import create_all_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables (dev convenience). Shutdown: cleanup."""
    create_all_tables()
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

    # Register routers (will be added in Step 3)
    # from app.routers import auth, cows, members, ...
    # app.include_router(auth.router, prefix="/auth", tags=["Auth"])
    # etc.

    return app


app = create_app()
