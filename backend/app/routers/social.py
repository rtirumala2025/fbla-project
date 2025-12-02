"""Social features API routes (friends, leaderboard, public profiles)."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.jwt import get_current_user_id
from app.schemas.social import (
    FriendsListResponse,
    FriendRequestPayload,
    FriendRespondPayload,
    LeaderboardResponse,
    PublicProfilesResponse,
)
from app.services.social_service import SocialService
from app.utils.dependencies import get_db_pool
from asyncpg import Pool


def get_social_service(pool: Optional[Pool] = Depends(get_db_pool)) -> SocialService:
    """Dependency to get social service."""
    return SocialService(pool)


router = APIRouter(prefix="/social", tags=["Social"])


@router.get("/friends", response_model=FriendsListResponse)
async def get_friends(
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> FriendsListResponse:
    """
    Get the authenticated user's friendship graph.
    
    Returns:
        FriendsListResponse with friends, pending_incoming, and pending_outgoing lists
    """
    return await service.list_friendships(user_id)


@router.post("/friends/request", response_model=FriendsListResponse, status_code=status.HTTP_201_CREATED)
async def send_friend_request(
    payload: FriendRequestPayload,
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> FriendsListResponse:
    """
    Send a friend request to another user.
    
    Args:
        payload: FriendRequestPayload with friend_id
        
    Returns:
        FriendsListResponse with updated friendship list
    """
    return await service.send_friend_request(user_id, payload.friend_id)


@router.patch("/friends/respond", response_model=FriendsListResponse)
async def respond_to_friend_request(
    payload: FriendRespondPayload,
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> FriendsListResponse:
    """
    Accept or decline a friend request.
    
    Args:
        payload: FriendRespondPayload with request_id and action ('accept' or 'decline')
        
    Returns:
        FriendsListResponse with updated friendship list
    """
    return await service.respond_to_friend_request(user_id, payload.request_id, payload.action)


@router.get("/public_profiles", response_model=PublicProfilesResponse)
async def get_public_profiles(
    search: Optional[str] = Query(default=None, description="Search term for display name or bio"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of profiles to return"),
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> PublicProfilesResponse:
    """
    List public profiles with optional search.
    
    Args:
        search: Optional search term
        limit: Maximum number of profiles (1-100)
        
    Returns:
        PublicProfilesResponse with list of public profiles
    """
    return await service.fetch_public_profiles(user_id, search, limit)


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    metric: str = Query(default='xp', description="Metric: 'xp', 'coins', or 'achievements'"),
    limit: int = Query(default=20, ge=1, le=100, description="Maximum number of entries"),
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> LeaderboardResponse:
    """
    Get the social leaderboard for friends.
    
    Args:
        metric: Metric to rank by ('xp', 'coins', or 'achievements')
        limit: Maximum number of entries (1-100)
        
    Returns:
        LeaderboardResponse with ranked entries
    """
    return await service.get_leaderboard(user_id, metric, limit)


@router.post("/accept", response_model=FriendsListResponse)
async def accept_friend_request(
    payload: FriendRespondPayload,
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> FriendsListResponse:
    """
    Accept a friend request (convenience endpoint).
    
    Args:
        payload: FriendRespondPayload with request_id (action is ignored, always 'accept')
        
    Returns:
        FriendsListResponse with updated friendship list
    """
    return await service.respond_to_friend_request(user_id, payload.request_id, 'accept')


@router.post("/reject", response_model=FriendsListResponse)
async def reject_friend_request(
    payload: FriendRespondPayload,
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> FriendsListResponse:
    """
    Reject a friend request (convenience endpoint).
    
    Args:
        payload: FriendRespondPayload with request_id
        
    Returns:
        FriendsListResponse with updated friendship list
    """
    return await service.respond_to_friend_request(user_id, payload.request_id, 'decline')


@router.post("/remove", response_model=FriendsListResponse)
async def remove_friend(
    payload: FriendRequestPayload,
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> FriendsListResponse:
    """
    Remove a friend (bidirectional deletion).
    
    Args:
        payload: FriendRequestPayload with friend_id
        
    Returns:
        FriendsListResponse with updated friendship list
    """
    return await service.remove_friend(user_id, payload.friend_id)


@router.get("/requests/incoming", response_model=FriendsListResponse)
async def get_incoming_requests(
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> FriendsListResponse:
    """
    Get only incoming friend requests.
    
    Returns:
        FriendsListResponse with pending_incoming populated
    """
    return await service.get_incoming_requests(user_id)


@router.get("/requests/outgoing", response_model=FriendsListResponse)
async def get_outgoing_requests(
    user_id: str = Depends(get_current_user_id),
    service: SocialService = Depends(get_social_service),
) -> FriendsListResponse:
    """
    Get only outgoing friend requests.
    
    Returns:
        FriendsListResponse with pending_outgoing populated
    """
    return await service.get_outgoing_requests(user_id)
