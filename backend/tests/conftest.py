"""Shared pytest fixtures for the Context0 backend test suite.

Each test function gets a fresh in-memory SQLite database via StaticPool, so
tests are fully isolated without needing a running PostgreSQL instance.
"""
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

# Import all models so Base.metadata registers every table before create_all.
import app.models  # noqa: F401

from app.database import Base, get_db
from app.main import app


@pytest_asyncio.fixture
async def engine():
    """Fresh in-memory SQLite engine — one per test for full isolation."""
    _engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield _engine
    await _engine.dispose()


@pytest_asyncio.fixture
async def client(engine):
    """AsyncClient with the FastAPI app wired to the test database."""
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def auth_client(client):
    """Client pre-loaded with a registered and logged-in user (testuser / Test1234)."""
    await client.post(
        "/api/auth/register",
        json={"username": "testuser", "email": "testuser@example.com", "password": "Test1234"},
    )
    resp = await client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "Test1234"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    token = resp.json()["access_token"]
    client.headers["Authorization"] = f"Bearer {token}"
    return client


@pytest_asyncio.fixture
async def seeded_client(auth_client, engine):
    """auth_client with one Science category and two easy questions seeded."""
    from app.models.category import Category
    from app.models.question import Question

    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        cat = Category(name="Science", description="Science questions", icon="🔬")
        session.add(cat)
        await session.flush()
        session.add_all([
            Question(
                category_id=cat.id,
                text="What is 2 + 2?",
                option_a="3", option_b="4", option_c="5", option_d="6",
                correct_option="B",
                difficulty="easy",
                explanation="2 + 2 equals 4.",
            ),
            Question(
                category_id=cat.id,
                text="What colour is the sky?",
                option_a="Green", option_b="Red", option_c="Blue", option_d="Yellow",
                correct_option="C",
                difficulty="easy",
                explanation="The sky appears blue due to Rayleigh scattering.",
            ),
        ])
        await session.commit()
    return auth_client
