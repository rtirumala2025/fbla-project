"""
Pytest fixtures shared across the test suite.

The fixtures defined here provide database sessions connected to the configured
Supabase/PostgreSQL instance. Tests are skipped automatically if the database
is unreachable—useful when running locally without a configured DATABASE_URL.
"""

from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from typing import AsyncIterator

import pytest
from httpx import AsyncClient
from pydantic import ValidationError
from sqlalchemy import JSON, event, schema, text
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

import uuid

ROOT = Path(__file__).resolve().parents[1]
BACKEND_ROOT = ROOT / "backend"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

# Provide sane defaults so tests can run without a fully provisioned environment.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///./tests/test.db")
os.environ.setdefault("JWT_SECRET", "test-secret")

from app.core.database import get_db, get_engine, get_session_factory
from app.models import Base

try:
    from app.main import app
except Exception:  # pragma: no cover - unit tests that don't hit the API can proceed
    app = None

_SQLITE_UUID_FUNCTION_REGISTERED = False


@pytest.fixture(scope="session")
def event_loop() -> asyncio.AbstractEventLoop:
    """
    Create a dedicated event loop for async tests.
    """

    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


async def _ensure_schema(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def _reset_database(engine: AsyncEngine) -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


def _register_sqlite_extensions(engine: AsyncEngine) -> None:
    global _SQLITE_UUID_FUNCTION_REGISTERED
    if not engine.url.drivername.startswith("sqlite"):
        return
    if _SQLITE_UUID_FUNCTION_REGISTERED:
        return

    @event.listens_for(engine.sync_engine, "connect")
    def _sqlite_uuid(connection, _record):  # type: ignore[override]
        connection.create_function("uuid_generate_v4", 0, lambda: str(uuid.uuid4()))

    for table in Base.metadata.tables.values():
        for column in table.columns:
            server_default = getattr(column, "server_default", None)
            if server_default is not None and "uuid_generate_v4()" in str(server_default.arg):
                column.server_default = None
                column.default = schema.ColumnDefault(uuid.uuid4)
                server_default = column.server_default
            if server_default is not None and "::jsonb" in str(server_default.arg):
                default_text = str(server_default.arg)
                column.server_default = None
                if default_text.strip().startswith("'[]'"):
                    column.default = schema.ColumnDefault(lambda: [])
                else:
                    column.default = schema.ColumnDefault(lambda: {})
                server_default = column.server_default
            if server_default is not None and "NOW()" in str(server_default.arg).upper():
                column.server_default = schema.DefaultClause(text("CURRENT_TIMESTAMP"))
            if column.type.__class__.__name__.lower() == "jsonb":
                column.type = JSON()

    _SQLITE_UUID_FUNCTION_REGISTERED = True


@pytest.fixture()
async def db_session() -> AsyncIterator[AsyncSession]:
    """
    Yield an async session for database operations.

    The fixture automatically skips tests if the database is unreachable,
    preventing false negatives when the environment is not fully configured.
    """

    try:
        session_factory = get_session_factory()
        engine = get_engine()
        _register_sqlite_extensions(engine)
        await _reset_database(engine)
    except ValidationError as exc:  # pragma: no cover - handled via skip for local/dev
        pytest.skip(f"Database configuration invalid: {exc}")

    try:
        async with session_factory() as session:
            try:
                await session.execute(text("SELECT 1"))
            except Exception as exc:  # pragma: no cover - environment-dependent
                await session.close()
                pytest.skip(f"Database unavailable: {exc}")
            yield session
            if session.in_transaction():
                await session.rollback()
    except SQLAlchemyError as exc:
        pytest.skip(f"Database unavailable: {exc}")


@pytest.fixture()
async def client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    """
    Async HTTP client bound to the FastAPI app for integration tests.
    """

    if app is None:
        pytest.skip("FastAPI app unavailable for HTTP client fixture")
    async def _override_get_db() -> AsyncIterator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    try:
        async with AsyncClient(app=app, base_url="http://testserver") as async_client:
            yield async_client
    finally:
        app.dependency_overrides.pop(get_db, None)

