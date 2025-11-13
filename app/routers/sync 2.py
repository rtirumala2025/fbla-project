"""
Cloud sync API endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.sync import SyncFetchResponse, SyncPushRequest, SyncPushResponse
from app.services.sync_service import apply_sync, fetch_cloud_state

router = APIRouter(prefix="/api/sync", tags=["Sync"])


@router.get("", response_model=SyncFetchResponse)
async def fetch_sync_state(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> SyncFetchResponse:
    """
    Retrieve the latest cloud snapshot for the authenticated user.
    """

    state = await fetch_cloud_state(session, user_id)
    return SyncFetchResponse(state=state, conflicts=[])


@router.post("", response_model=SyncPushResponse)
async def push_sync_state(
    payload: SyncPushRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> SyncPushResponse:
    """
    Push local changes to the cloud snapshot, resolving conflicts as needed.
    """

    state, resolution, conflicts = await apply_sync(session, user_id, payload)
    return SyncPushResponse(state=state, resolution=resolution, conflicts=conflicts)


