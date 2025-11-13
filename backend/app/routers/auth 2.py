"""Authentication API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, Header, status

from app.schemas import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, TokenResponse
from app.services.auth_service import AuthService
from app.utils import get_auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    return await service.signup(payload)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    return await service.login(payload)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, service: AuthService = Depends(get_auth_service)) -> TokenResponse:
    return await service.refresh(payload)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    payload: LogoutRequest,
    service: AuthService = Depends(get_auth_service),
    authorization: str | None = Header(default=None, convert_underscores=False),
) -> None:
    token = authorization.split(" ", 1)[1] if authorization and " " in authorization else None
    await service.logout(payload, access_token=token)
