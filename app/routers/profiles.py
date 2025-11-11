"""
Profile management API routes.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.profile import (
    AvatarUpdateRequest,
    AvatarUploadResponse,
    ProfileCreate,
    ProfileResponse,
    ProfileUpdate,
)
from app.services import (
    ProfileNotFoundError,
    create_user_profile,
    delete_user_profile,
    get_user_profile,
    set_profile_avatar_url,
    update_user_profile,
)

router = APIRouter(prefix="/api/profiles", tags=["Profiles"])


@router.get("/me", response_model=ProfileResponse)
async def fetch_my_profile(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ProfileResponse:
    profile = await get_user_profile(session, user_id)
    if profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found.")
    return profile


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ProfileResponse:
    return await create_user_profile(session, user_id, payload)


@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ProfileResponse:
    try:
        return await update_user_profile(session, user_id, payload)
    except ProfileNotFoundError as exc:  # pragma: no cover - defensive
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> Response:
    try:
        await delete_user_profile(session, user_id)
    except ProfileNotFoundError as exc:  # pragma: no cover - defensive
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/me/avatar", response_model=AvatarUploadResponse)
async def update_avatar(
    payload: AvatarUpdateRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> AvatarUploadResponse:
    try:
        profile = await set_profile_avatar_url(session, user_id, payload.avatar_url)
    except ProfileNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    return AvatarUploadResponse(avatar_url=profile.avatar_url or "")

