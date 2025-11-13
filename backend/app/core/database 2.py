"""Database connection management using asyncpg."""
from __future__ import annotations

import logging
from typing import Optional

import asyncpg
from asyncpg import Pool
from fastapi import FastAPI

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class Database:
    """Manage a connection pool to the Supabase PostgreSQL instance."""

    def __init__(self) -> None:
        self._pool: Optional[Pool] = None

    async def connect(self) -> None:
        settings = get_settings()
        dsn = settings.database_url
        if not dsn:
            logger.warning("DATABASE_URL not configured; skipping asyncpg pool initialization.")
            return

        logger.info("Creating asyncpg pool to Supabase instance")
        self._pool = await asyncpg.create_pool(dsn, command_timeout=60)

    async def disconnect(self) -> None:
        if self._pool is None:
            return

        logger.info("Closing asyncpg pool")
        await self._pool.close()
        self._pool = None

    @property
    def pool(self) -> Optional[Pool]:
        return self._pool


database = Database()


async def connect_to_database(app: FastAPI) -> None:
    """Create the database pool and attach it to the FastAPI app state."""
    await database.connect()
    app.state.db_pool = database.pool


async def disconnect_from_database(app: FastAPI) -> None:
    """Close the database pool stored on the FastAPI app state."""
    await database.disconnect()
    app.state.db_pool = None
