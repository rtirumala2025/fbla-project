"""Service layer for seasonal events and participation tracking."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple

from asyncpg import Pool, Record
from fastapi import HTTPException, status

from app.models import Event, EventEffect, EventParticipation


@dataclass
class ParticipationRecord:
    """Internal representation of a participation row."""

    event_id: str
    status: str
    progress: Dict[str, Any]
    last_interacted_at: datetime


class EventService:
    """Provide access to seasonal events and user participation metadata."""

    def __init__(self, pool: Optional[Pool]) -> None:
        self._pool = pool

    async def _require_pool(self) -> Pool:
        if self._pool is None:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database connection is not configured.")
        return self._pool

    async def list_events(self, *, today: Optional[date] = None) -> Tuple[List[Event], List[Event]]:
        """Return events grouped into current and upcoming lists."""
        pool = await self._require_pool()
        today = today or date.today()
        async with pool.acquire() as connection:
            rows = await connection.fetch(
                """
                SELECT event_id, name, description, start_date, end_date, type, effects, created_at, updated_at
                FROM events
                WHERE end_date >= $1
                ORDER BY start_date ASC
                """,
                today,
            )

        events = [self._row_to_event(row) for row in rows]
        current = [event for event in events if event.is_active(today)]
        upcoming = [event for event in events if event.is_upcoming(today)]
        return current, upcoming

    async def get_event(self, event_id: str) -> Event:
        """Fetch a single event by id."""
        pool = await self._require_pool()
        async with pool.acquire() as connection:
            row = await connection.fetchrow(
                """
                SELECT event_id, name, description, start_date, end_date, type, effects, created_at, updated_at
                FROM events
                WHERE event_id = $1
                """,
                event_id,
            )
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Event not found.")
        return self._row_to_event(row)

    async def get_participation_map(self, user_id: str, event_ids: Iterable[str]) -> Dict[str, ParticipationRecord]:
        """Return participation metadata for the provided event ids."""
        ids = list(event_ids)
        if not ids:
            return {}
        pool = await self._require_pool()
        async with pool.acquire() as connection:
            rows = await connection.fetch(
                """
                SELECT event_id, status, progress, last_interacted_at
                FROM user_event_participation
                WHERE user_id = $1
                  AND event_id = ANY($2::uuid[])
                """,
                user_id,
                ids,
            )
        return {
            str(row["event_id"]): ParticipationRecord(
                event_id=str(row["event_id"]),
                status=row["status"],
                progress=dict(row["progress"] or {}),
                last_interacted_at=row["last_interacted_at"],
            )
            for row in rows
        }

    async def ensure_participation(self, user_id: str, event: Event, *, status_value: str = "active") -> ParticipationRecord:
        """Make sure a participation row exists for the user and event."""
        pool = await self._require_pool()
        async with pool.acquire() as connection:
            row = await connection.fetchrow(
                """
                INSERT INTO user_event_participation (event_id, user_id, status)
                VALUES ($1, $2, $3)
                ON CONFLICT (event_id, user_id) DO UPDATE SET
                    status = EXCLUDED.status,
                    last_interacted_at = NOW(),
                    updated_at = NOW()
                RETURNING event_id, status, progress, last_interacted_at
                """,
                event.event_id,
                user_id,
                status_value,
            )
        assert row is not None  # asyncpg guarantees row here
        return ParticipationRecord(
            event_id=str(row["event_id"]),
            status=row["status"],
            progress=dict(row["progress"] or {}),
            last_interacted_at=row["last_interacted_at"],
        )

    async def update_participation_progress(
        self,
        user_id: str,
        event_id: str,
        *,
        status_value: Optional[str] = None,
        progress: Optional[Dict[str, Any]] = None,
    ) -> ParticipationRecord:
        """Update participation progress payload for a user and event."""
        pool = await self._require_pool()
        updates: List[str] = ["last_interacted_at = NOW()", "updated_at = NOW()"]
        params: List[Any] = []
        idx = 3
        if status_value is not None:
            updates.append(f"status = ${idx}")
            params.append(status_value)
            idx += 1
        if progress is not None:
            updates.append(f"progress = ${idx}")
            params.append(progress)
            idx += 1

        if len(updates) == 2:  # no updates apart from timestamps
            return await self._fetch_participation(user_id, event_id)

        pool = await self._require_pool()
        async with pool.acquire() as connection:
            row = await connection.fetchrow(
                f"""
                UPDATE user_event_participation
                SET {', '.join(updates)}
                WHERE user_id = $1
                  AND event_id = $2
                RETURNING event_id, status, progress, last_interacted_at
                """,
                user_id,
                event_id,
                *params,
            )

        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Participation not found.")

        return ParticipationRecord(
            event_id=str(row["event_id"]),
            status=row["status"],
            progress=dict(row["progress"] or {}),
            last_interacted_at=row["last_interacted_at"],
        )

    async def _fetch_participation(self, user_id: str, event_id: str) -> ParticipationRecord:
        pool = await self._require_pool()
        async with pool.acquire() as connection:
            row = await connection.fetchrow(
                """
                SELECT event_id, status, progress, last_interacted_at
                FROM user_event_participation
                WHERE user_id = $1
                  AND event_id = $2
                """,
                user_id,
                event_id,
            )
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Participation not found.")
        return ParticipationRecord(
            event_id=str(row["event_id"]),
            status=row["status"],
            progress=dict(row["progress"] or {}),
            last_interacted_at=row["last_interacted_at"],
        )

    def _row_to_event(self, row: Record) -> Event:
        effects_payload = dict(row["effects"] or {})
        effect = EventEffect(
            mood=effects_payload.get("mood"),
            stat_modifiers=dict(effects_payload.get("stat_modifiers") or {}),
            visual_overlays=dict(effects_payload.get("visual_overlays") or {}),
        )
        return Event(
            event_id=str(row["event_id"]),
            name=row["name"],
            description=row["description"],
            start_date=row["start_date"],
            end_date=row["end_date"],
            type=row["type"],
            effects=effect,
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def current_timestamp(self) -> datetime:
        """Expose timezone-aware now for testability."""
        return datetime.now(timezone.utc)


__all__ = ["EventService", "ParticipationRecord"]

