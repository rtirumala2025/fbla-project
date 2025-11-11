"""
Cloud sync service handling snapshot persistence and conflict resolution.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sync import CloudSyncSnapshot
from app.schemas.sync import CloudSyncState, SyncPushRequest


class SyncConflict(RuntimeError):
    """Raised when the incoming snapshot cannot be merged."""


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _ensure_aware(ts: datetime) -> datetime:
    if ts.tzinfo is None:
        return ts.replace(tzinfo=timezone.utc)
    return ts.astimezone(timezone.utc)


def _default_snapshot() -> Dict[str, Any]:
    return {"pets": [], "inventory": [], "quests": [], "progress": {}}


def _index_by_id(items: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    return {str(item.get("id")): item for item in items if item.get("id") is not None}


def _merge_collections(existing: List[Dict[str, Any]], incoming: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Merge collections with last-modified semantics per item.

    Returns:
        A tuple containing (merged_collection, conflicts_list).
    """

    conflicts: List[Dict[str, Any]] = []
    existing_index = _index_by_id(existing)
    incoming_index = _index_by_id(incoming)
    merged: Dict[str, Dict[str, Any]] = existing_index.copy()

    for item_id, incoming_item in incoming_index.items():
        existing_item = existing_index.get(item_id)
        if not existing_item:
            merged[item_id] = incoming_item
            continue

        incoming_ts = incoming_item.get("updated_at") or incoming_item.get("last_modified") or 0
        existing_ts = existing_item.get("updated_at") or existing_item.get("last_modified") or 0

        if incoming_ts > existing_ts:
            merged[item_id] = incoming_item
        elif incoming_ts == existing_ts:
            # merge fields shallowly
            merged[item_id] = {**existing_item, **incoming_item}
        else:
            conflicts.append(
                {
                    "id": item_id,
                    "existing": existing_item,
                    "incoming": incoming_item,
                    "reason": "older_timestamp",
                }
            )

    # retain items only in existing
    for item_id, existing_item in existing_index.items():
        if item_id not in merged:
            merged[item_id] = existing_item

    return list(merged.values()), conflicts


def _merge_snapshots(existing: Dict[str, Any], incoming: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    existing = existing or _default_snapshot()
    incoming = incoming or _default_snapshot()
    conflicts: List[Dict[str, Any]] = []

    pets, pet_conflicts = _merge_collections(existing.get("pets", []), incoming.get("pets", []))
    inventory, inventory_conflicts = _merge_collections(existing.get("inventory", []), incoming.get("inventory", []))
    quests, quest_conflicts = _merge_collections(existing.get("quests", []), incoming.get("quests", []))

    conflicts.extend([{"type": "pet", **c} for c in pet_conflicts])
    conflicts.extend([{"type": "inventory", **c} for c in inventory_conflicts])
    conflicts.extend([{"type": "quest", **c} for c in quest_conflicts])

    merged_progress = {**existing.get("progress", {}), **incoming.get("progress", {})}

    merged_snapshot = {
        "pets": pets,
        "inventory": inventory,
        "quests": quests,
        "progress": merged_progress,
    }
    return merged_snapshot, conflicts


async def _load_snapshot(session: AsyncSession, user_id: UUID) -> CloudSyncSnapshot | None:
    stmt = select(CloudSyncSnapshot).where(CloudSyncSnapshot.user_id == user_id).with_for_update(of=CloudSyncSnapshot)
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


def _build_state(record: CloudSyncSnapshot) -> CloudSyncState:
    return CloudSyncState(
        snapshot=record.snapshot or _default_snapshot(),
        last_modified=record.last_modified,
        device_id=record.last_device_id or "unknown",
        version=record.version,
    )


async def fetch_cloud_state(session: AsyncSession, user_id: UUID | str) -> CloudSyncState:
    """
    Retrieve the stored snapshot for a user, creating a default row when needed.
    """

    user_uuid = UUID(str(user_id))
    record = await _load_snapshot(session, user_uuid)
    if record is None:
        record = CloudSyncSnapshot(user_id=user_uuid, snapshot=_default_snapshot(), last_modified=_now())
        session.add(record)
        await session.flush()
    return _build_state(record)


async def apply_sync(
    session: AsyncSession,
    user_id: UUID | str,
    payload: SyncPushRequest,
) -> tuple[CloudSyncState, str, List[Dict[str, Any]]]:
    """
    Apply a sync payload and resolve conflicts.

    Returns:
        (cloud_state, resolution_status, conflicts)
    """

    user_uuid = UUID(str(user_id))
    record = await _load_snapshot(session, user_uuid)
    if record is None:
        record = CloudSyncSnapshot(
            user_id=user_uuid,
            snapshot=payload.snapshot.dict(),
            last_modified=_ensure_aware(payload.last_modified),
            last_device_id=payload.device_id,
            version=max(1, payload.version),
        )
        session.add(record)
        await session.flush()
        return _build_state(record), "accepted", []

    existing_ts = _ensure_aware(record.last_modified)
    incoming_ts = _ensure_aware(payload.last_modified)

    if incoming_ts > existing_ts:
        record.snapshot = payload.snapshot.dict()
        record.last_modified = incoming_ts
        record.last_device_id = payload.device_id
        record.version = max(record.version + 1, payload.version)
        await session.flush()
        return _build_state(record), "accepted", []

    if incoming_ts == existing_ts and payload.device_id == record.last_device_id:
        # duplicate push from same device
        return _build_state(record), "ignored", []

    merged_snapshot, conflicts = _merge_snapshots(record.snapshot or _default_snapshot(), payload.snapshot.dict())
    record.snapshot = merged_snapshot
    record.last_modified = max(existing_ts, incoming_ts)
    record.last_device_id = payload.device_id
    record.version += 1
    record.conflict_log = (record.conflict_log or []) + conflicts
    await session.flush()

    resolution = "merged" if conflicts else "accepted"
    return _build_state(record), resolution, conflicts


