"""Profile management API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile, status

from app.models import AuthenticatedUser
from app.schemas import AvatarUploadResponse, ProfileCreate, ProfileResponse, ProfileUpdate
from app.services.profile_service import ProfileService
from app.services.storage_service import StorageService
from app.utils import get_current_user, get_profile_service, get_storage_service

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/me", response_model=ProfileResponse)
async def get_my_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    profile = await service.get_profile(current_user.id)
    if profile is None:
        raise_status_not_found()
    return profile


@router.post("/", response_model=ProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    payload: ProfileCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    return await service.create_profile(current_user.id, payload)


@router.put("/me", response_model=ProfileResponse)
async def update_profile(
    payload: ProfileUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> ProfileResponse:
    return await service.update_profile(current_user.id, payload)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: ProfileService = Depends(get_profile_service),
) -> None:
    await service.delete_profile(current_user.id)


@router.post("/me/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user),
    profile_service: ProfileService = Depends(get_profile_service),
    storage_service: StorageService = Depends(get_storage_service),
) -> AvatarUploadResponse:
    signed_url = await storage_service.upload_avatar(current_user.id, file)
    await profile_service.set_avatar_url(current_user.id, signed_url)
    return AvatarUploadResponse(avatar_url=signed_url)


def raise_status_not_found() -> None:
    from fastapi import HTTPException

    raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Profile not found.")
