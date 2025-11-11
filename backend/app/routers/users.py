"""User-related API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.schemas import UserCreate, UserResponse
from app.services.users_service import UserService
from app.utils.dependencies import get_users_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserResponse], summary="List users")
async def list_users(service: UserService = Depends(get_users_service)) -> list[UserResponse]:
    return await service.list_users()


@router.post(
    "/",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a user",
)
async def create_user(
    payload: UserCreate,
    service: UserService = Depends(get_users_service),
) -> UserResponse:
    return await service.create_user(payload)
