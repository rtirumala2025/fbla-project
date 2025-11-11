"""
Authentication routes for the Virtual Pet backend leveraging Supabase Auth.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Header, HTTPException, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import decode_token, create_access_token, create_refresh_token
from app.core.config import get_settings
from app.models.user import UserCreate
from app.schemas.auth import LoginRequest, LogoutRequest, RefreshRequest, SignupRequest, TokenResponse
from app.services import (
    UserAlreadyExistsError,
    create_user,
    get_user_by_email,
    supabase_auth_service,
    refresh_token_store,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


def _get_auth_service():
    return supabase_auth_service


def _supabase_configured() -> bool:
    settings = get_settings()
    return bool(settings.supabase_url and settings.supabase_anon_key)


def _issue_local_tokens(user_id: str) -> TokenResponse:
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    # Match Supabase default of one hour access token TTL
    return TokenResponse(access_token=access_token, refresh_token=refresh_token, expires_in=3600)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup_user(
    payload: SignupRequest,
    session: AsyncSession = Depends(get_db),
    service=Depends(_get_auth_service),
):
    """
    Register a new user with Supabase and mirror the record in the local database.
    """

    supabase_enabled = _supabase_configured()
    tokens: TokenResponse
    if supabase_enabled:
        tokens = await service.signup(payload)

    try:
        user = await create_user(session, UserCreate(email=payload.email, password=payload.password))
    except UserAlreadyExistsError:
        existing = await get_user_by_email(session, payload.email)
        if existing is None:
            raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Unable to resolve existing user record.")
        user = existing

    if not supabase_enabled:
        tokens = _issue_local_tokens(str(user.id))

    refresh_token_store.remember(tokens.refresh_token, str(user.id), tokens.expires_in)
    return {"user": user, **tokens.dict()}


@router.post("/login")
async def login_user(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db),
    service=Depends(_get_auth_service),
):
    """
    Authenticate a user via Supabase credentials, ensuring a local record exists.
    """

    supabase_enabled = _supabase_configured()
    tokens: TokenResponse
    if supabase_enabled:
        tokens = await service.login(payload)

    user = await get_user_by_email(session, payload.email)
    if user is None:
        # Create a local shadow record when Supabase holds the primary credentials.
        try:
            user = await create_user(session, UserCreate(email=payload.email, password=payload.password))
        except UserAlreadyExistsError:
            user = await get_user_by_email(session, payload.email)
            if user is None:
                raise HTTPException(
                    status.HTTP_500_INTERNAL_SERVER_ERROR, "Supabase login succeeded but local user cannot be created."
                )

    if not supabase_enabled:
        tokens = _issue_local_tokens(str(user.id))

    refresh_token_store.remember(tokens.refresh_token, str(user.id), tokens.expires_in)
    return {"user": user, **tokens.dict()}


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(payload: RefreshRequest, service=Depends(_get_auth_service)) -> TokenResponse:
    """
    Exchange a refresh token for a new pair of credentials.
    """

    if not refresh_token_store.is_active(payload.refresh_token):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Refresh token has been revoked or expired.")

    supabase_enabled = _supabase_configured()
    refresh_token_store.revoke(payload.refresh_token)

    if supabase_enabled:
        tokens = await service.refresh(payload)
        refresh_token_store.remember(tokens.refresh_token, None, tokens.expires_in)
        return tokens

    try:
        payload_data = decode_token(payload.refresh_token)
    except HTTPException:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.") from None
    if payload_data.type != "refresh":
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")

    tokens = _issue_local_tokens(payload_data.sub)
    refresh_token_store.remember(tokens.refresh_token, payload_data.sub, tokens.expires_in)
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout_user(
    payload: LogoutRequest,
    service=Depends(_get_auth_service),
    authorization: str | None = Header(default=None, convert_underscores=False),
) -> Response:
    """
    Revoke the active Supabase session and purge cached refresh tokens.
    """

    bearer_token = None
    if authorization and authorization.lower().startswith("bearer "):
        bearer_token = authorization.split(" ", 1)[1]
        try:
            decode_token(bearer_token)
        except HTTPException:
            bearer_token = None

    if _supabase_configured():
        await service.logout(payload, access_token=bearer_token)
    if payload.refresh_token:
        refresh_token_store.revoke(payload.refresh_token)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

