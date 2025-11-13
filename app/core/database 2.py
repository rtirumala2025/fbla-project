"""
Database connection utilities.

This module initialises an async SQLAlchemy engine backed by Supabase/PostgreSQL
and provides helpers for acquiring sessions. The abstraction keeps database
access consistent across the application and ready for dependency injection in
FastAPI routes.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any, Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

# Lazily create the engine when accessed; this ensures environment variables
# are validated once during application startup.
_engine: Optional[AsyncEngine] = None
async_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> AsyncEngine:
    """
    Retrieve (or create) the global async SQLAlchemy engine instance.

    Returns:
        AsyncEngine: Configured SQLAlchemy async engine.
    """

    global _engine, async_session_factory  # noqa: PLW0603

    if _engine is None:
        settings = get_settings()
        database_url = settings.database_url

        engine_options: dict[str, Any] = {
            "echo": False,
            "pool_pre_ping": True,
        }
        connect_args: dict[str, Any] = {}

        if database_url.startswith("sqlite"):
            connect_args.update({
                "timeout": 30,
                "check_same_thread": False,
            })
            engine_options["poolclass"] = NullPool

        if connect_args:
            engine_options["connect_args"] = connect_args

        _engine = create_async_engine(
            database_url,
            **engine_options,
        )
        async_session_factory = async_sessionmaker(
            _engine,
            expire_on_commit=False,
        )

    return _engine


def get_session_factory() -> async_sessionmaker[AsyncSession]:
    """
    Retrieve the async session factory.

    Returns:
        async_sessionmaker[AsyncSession]: Configured session factory.
    """

    global async_session_factory  # noqa: PLW0603
    if async_session_factory is None:
        get_engine()
    assert async_session_factory is not None  # for type checkers
    return async_session_factory


async def get_db() -> AsyncIterator[AsyncSession]:
    """
    FastAPI dependency that yields an async database session.

    The session is automatically committed on success and rolled back on
    exceptions, which keeps transaction handling consistent for all callers.

    Yields:
        AsyncIterator[AsyncSession]: Active async session.
    """

    session_factory = get_session_factory()
    async with session_factory() as session:
        try:
            yield session
            await session.commit()
        except SQLAlchemyError:
            await session.rollback()
            raise
        finally:
            await session.close()


__all__ = ["get_engine", "get_session_factory", "get_db", "async_session_factory"]

