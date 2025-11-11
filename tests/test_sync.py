"""
Integration tests for cloud sync endpoints.
"""

from __future__ import annotations

from datetime import datetime, timezone
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.sync import CloudSyncSnapshot
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


def iso_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


@pytest.mark.asyncio
async def test_fetch_sync_state_initialises_snapshot(client: AsyncClient, db_session: AsyncSession):
    """
    Fetching sync state should provision a default snapshot for new users.
    """

    user = User(email=f"syncer-{uuid.uuid4()}@example.com", password_hash=hash_password("SyncPass1!"))
    db_session.add(user)
    await db_session.flush()

    response = await client.get("/api/sync", headers=auth_headers(user.id))
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["state"]["snapshot"]["pets"] == []
    assert payload["state"]["version"] == 1

    await db_session.execute(delete(CloudSyncSnapshot).where(CloudSyncSnapshot.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


@pytest.mark.asyncio
async def test_push_sync_state_accepts_newer_snapshot(client: AsyncClient, db_session: AsyncSession):
    """
    Pushing a newer snapshot should replace the stored state.
    """

    user = User(email=f"sync-accept-{uuid.uuid4()}@example.com", password_hash=hash_password("SyncPass2!"))
    db_session.add(user)
    await db_session.flush()

    snapshot = {
        "pets": [{"id": "pet-1", "name": "Nova", "updated_at": datetime.now(tz=timezone.utc).isoformat()}],
        "inventory": [],
        "quests": [],
        "progress": {"xp": 120},
    }

    push_response = await client.post(
        "/api/sync",
        json={
            "snapshot": snapshot,
            "last_modified": iso_now(),
            "device_id": "device-A",
            "version": 1,
        },
        headers=auth_headers(user.id),
    )
    assert push_response.status_code == 200, push_response.text
    result = push_response.json()
    assert result["resolution"] == "accepted"
    assert result["state"]["snapshot"]["progress"]["xp"] == 120

    await db_session.execute(delete(CloudSyncSnapshot).where(CloudSyncSnapshot.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


@pytest.mark.asyncio
async def test_push_sync_state_merges_on_conflict(client: AsyncClient, db_session: AsyncSession):
    """
    When an older snapshot is pushed, server should merge items and record conflicts.
    """

    user = User(email=f"sync-merge-{uuid.uuid4()}@example.com", password_hash=hash_password("SyncPass3!"))
    db_session.add(user)
    await db_session.flush()

    initial_snapshot = CloudSyncSnapshot(
        user_id=user.id,
        snapshot={
            "pets": [{"id": "pet-1", "name": "Nova", "updated_at": "2025-01-01T10:00:00Z"}],
            "inventory": [{"id": "item-1", "name": "Ball", "updated_at": "2025-01-01T09:00:00Z"}],
            "quests": [],
            "progress": {"xp": 200},
        },
        last_modified=datetime(2025, 1, 1, 11, 0, 0, tzinfo=timezone.utc),
        last_device_id="device-main",
        version=3,
    )
    db_session.add(initial_snapshot)
    await db_session.commit()

    older_snapshot = {
        "pets": [{"id": "pet-1", "name": "Nova Prime", "updated_at": "2024-12-31T23:59:59Z"}],
        "inventory": [{"id": "item-1", "name": "Ball Deluxe", "updated_at": "2025-01-02T09:00:00Z"}],
        "quests": [],
        "progress": {"xp": 220},
    }

    push_response = await client.post(
        "/api/sync",
        json={
            "snapshot": older_snapshot,
            "last_modified": "2025-01-01T10:30:00Z",
            "device_id": "device-secondary",
            "version": 2,
        },
        headers=auth_headers(user.id),
    )
    assert push_response.status_code == 200, push_response.text
    payload = push_response.json()
    assert payload["resolution"] == "merged"
    # Inventory newer timestamp should win
    inventory = payload["state"]["snapshot"]["inventory"][0]
    assert inventory["name"] == "Ball Deluxe"
    # Pet older timestamp should keep existing name
    pet = payload["state"]["snapshot"]["pets"][0]
    assert pet["name"] == "Nova"
    assert payload["conflicts"], "Expected conflicts to be recorded."

    await db_session.execute(delete(CloudSyncSnapshot).where(CloudSyncSnapshot.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


