"""
FastAPI application entry-point.

Data flow overview:
  Browser/React  →  HTTP request  →  FastAPI router  →  SQLAlchemy async query  →  PostgreSQL
  PostgreSQL      →  ORM objects  →  Pydantic schema  →  JSON response  →  Browser/React
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, progress, quiz


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    """
    Application lifespan handler.
    Tables are created via Alembic migrations (run before server starts in Docker).
    This hook can be used for other startup/teardown tasks.
    """
    yield


app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="General Knowledge Learning Application API",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allow the React dev server (port 3000) to communicate with the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://frontend:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(quiz.router)
app.include_router(progress.router)


@app.get("/health", tags=["health"])
async def health_check() -> dict:
    """Simple liveness probe used by Docker health checks."""
    return {"status": "ok"}
