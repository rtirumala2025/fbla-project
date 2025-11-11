"""
Pydantic schemas for cloud sync operations.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class SyncSnapshot(BaseModel):
    """Structured snapshot persisted in the cloud."""

    pets: list[dict[str, Any]] = Field(default_factory=list)
    inventory: list[dict[str, Any]] = Field(default_factory=list)
    quests: list[dict[str, Any]] = Field(default_factory=list)
    progress: dict[str, Any] = Field(default_factory=dict)


class CloudSyncState(BaseModel):
    """Cloud sync payload with metadata."""

    snapshot: SyncSnapshot
    last_modified: datetime
    device_id: str
    version: int


class SyncFetchResponse(BaseModel):
    """Response for GET /api/sync."""

    state: CloudSyncState
    conflicts: list[dict[str, Any]] = Field(default_factory=list)


class SyncPushRequest(BaseModel):
    """Request payload for POST /api/sync."""

    snapshot: SyncSnapshot
    last_modified: datetime
    device_id: str
    version: int


class SyncPushResponse(BaseModel):
    """Response payload after attempting to push local state."""

    state: CloudSyncState
    resolution: Literal["accepted", "merged", "ignored"]
    conflicts: list[dict[str, Any]] = Field(default_factory=list)


