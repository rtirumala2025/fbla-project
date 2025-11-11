"""Social layer API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.social import (
    FriendRequestPayload,
    FriendRespondPayload,
    FriendsListResponse,
    LeaderboardResponse,
    PublicProfilesResponse,
)
from app.services.social_service import (
    FriendRequestExistsError,
    FriendRequestNotFoundError,
    FriendRequestPermissionError,
    fetch_leaderboard,
    fetch_public_profiles,
    list_friendships,
    respond_to_friend_request,
    send_friend_request,
)

router = APIRouter(prefix="/api/social", tags=["Social"])


@router.get("/friends", response_model=FriendsListResponse)
async def get_friends(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> FriendsListResponse:
    """Return the authenticated user's friendship graph."""

    return await list_friendships(session, user_id)


@router.post("/friends/request", response_model=FriendsListResponse, status_code=status.HTTP_201_CREATED)
async def create_friend_request(
    payload: FriendRequestPayload,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> FriendsListResponse:
    """Initiate a new friend request."""

    try:
        await send_friend_request(session, user_id, payload.friend_id)
    except FriendRequestExistsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return await list_friendships(session, user_id)


@router.patch("/friends/respond", response_model=FriendsListResponse)
async def respond_friend_request(
    payload: FriendRespondPayload,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> FriendsListResponse:
    """Accept or decline a pending friend request."""

    try:
        await respond_to_friend_request(session, payload.request_id, user_id, payload.action)
    except FriendRequestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except FriendRequestPermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except FriendRequestExistsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return await list_friendships(session, user_id)


@router.get("/public_profiles", response_model=PublicProfilesResponse)
async def list_public_profiles(
    search: str | None = Query(default=None, max_length=60),
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PublicProfilesResponse:
    """List public pet profiles."""

    profiles = await fetch_public_profiles(session, user_id, search=search, limit=limit)
    return PublicProfilesResponse(profiles=profiles)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    metric: str = Query("xp", pattern="^(xp|coins|achievements)$"),
    limit: int = Query(default=20, ge=1, le=100),
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> LeaderboardResponse:
    """Return the friend leaderboard for the requested metric."""

    metric_value = metric if metric in {"xp", "coins", "achievements"} else "xp"
    return await fetch_leaderboard(session, user_id, metric=metric_value, limit=limit)

