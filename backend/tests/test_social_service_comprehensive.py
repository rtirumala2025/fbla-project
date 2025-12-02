"""Comprehensive unit tests for SocialService."""
from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from asyncpg import Pool
from fastapi import HTTPException, status

from app.services.social_service import SocialService
from app.schemas.social import FriendsListResponse, PublicProfilesResponse, LeaderboardResponse


@pytest.fixture
def mock_pool():
    """Create a mock asyncpg pool."""
    pool = MagicMock(spec=Pool)
    connection = AsyncMock()
    pool.acquire.return_value.__aenter__.return_value = connection
    pool.acquire.return_value.__aexit__.return_value = None
    connection.transaction.return_value.__aenter__.return_value = None
    connection.transaction.return_value.__aexit__.return_value = None
    return pool, connection


@pytest.mark.anyio
async def test_list_friendships_empty(mock_pool):
    """Test listing friendships when user has none."""
    pool, connection = mock_pool
    connection.fetch.return_value = []
    
    service = SocialService(pool)
    result = await service.list_friendships("user-1")
    
    assert isinstance(result, FriendsListResponse)
    assert len(result.friends) == 0
    assert len(result.pending_incoming) == 0
    assert len(result.pending_outgoing) == 0
    assert result.total_count == 0


@pytest.mark.anyio
async def test_list_friendships_with_accepted_friends(mock_pool):
    """Test listing friendships with accepted friends."""
    pool, connection = mock_pool
    user_id = str(uuid4())
    friend_id = str(uuid4())
    
    # Mock friendship row
    friendship_row = MagicMock()
    friendship_row.__getitem__.side_effect = lambda key: {
        'id': 'friendship-1',
        'user_id': user_id,
        'friend_id': friend_id,
        'status': 'accepted',
        'requested_at': '2024-01-01T00:00:00',
        'responded_at': '2024-01-01T01:00:00',
        'counterpart_user_id': friend_id,
        'direction': 'friend'
    }[key]
    
    connection.fetch.return_value = [friendship_row]
    connection.fetch.side_effect = [
        [friendship_row],  # First call for friendships
        [],  # Second call for profiles
    ]
    
    service = SocialService(pool)
    result = await service.list_friendships(user_id)
    
    assert len(result.friends) == 1
    assert result.friends[0].status == 'accepted'
    assert result.friends[0].counterpart_user_id == friend_id


@pytest.mark.anyio
async def test_send_friend_request_self_error(mock_pool):
    """Test that users cannot friend themselves."""
    pool, _ = mock_pool
    service = SocialService(pool)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.send_friend_request("user-1", "user-1")
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "yourself" in exc_info.value.detail.lower()


@pytest.mark.anyio
async def test_send_friend_request_already_friends(mock_pool):
    """Test sending request when already friends."""
    pool, connection = mock_pool
    user_id = "user-1"
    friend_id = "user-2"
    
    existing_row = MagicMock()
    existing_row.__getitem__.side_effect = lambda key: {
        'id': 'friendship-1',
        'status': 'accepted'
    }[key]
    
    connection.fetchrow.return_value = existing_row
    
    service = SocialService(pool)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.send_friend_request(user_id, friend_id)
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "already friends" in exc_info.value.detail.lower()


@pytest.mark.anyio
async def test_respond_to_friend_request_invalid_action(mock_pool):
    """Test responding with invalid action."""
    pool, _ = mock_pool
    service = SocialService(pool)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.respond_to_friend_request("user-1", "req-1", "invalid")
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.anyio
async def test_respond_to_friend_request_not_found(mock_pool):
    """Test responding to non-existent request."""
    pool, connection = mock_pool
    connection.fetchrow.return_value = None
    
    service = SocialService(pool)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.respond_to_friend_request("user-1", "req-999", "accept")
    
    assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.anyio
async def test_remove_friend_self_error(mock_pool):
    """Test that users cannot remove themselves."""
    pool, _ = mock_pool
    service = SocialService(pool)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.remove_friend("user-1", "user-1")
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.anyio
async def test_get_incoming_requests(mock_pool):
    """Test getting incoming requests."""
    pool, connection = mock_pool
    connection.fetch.return_value = []
    
    service = SocialService(pool)
    result = await service.get_incoming_requests("user-1")
    
    assert isinstance(result, FriendsListResponse)


@pytest.mark.anyio
async def test_get_outgoing_requests(mock_pool):
    """Test getting outgoing requests."""
    pool, connection = mock_pool
    connection.fetch.return_value = []
    
    service = SocialService(pool)
    result = await service.get_outgoing_requests("user-1")
    
    assert isinstance(result, FriendsListResponse)


@pytest.mark.anyio
async def test_fetch_public_profiles_no_search(mock_pool):
    """Test fetching public profiles without search."""
    pool, connection = mock_pool
    connection.fetch.return_value = []
    
    service = SocialService(pool)
    result = await service.fetch_public_profiles("user-1")
    
    assert isinstance(result, PublicProfilesResponse)
    assert len(result.profiles) == 0


@pytest.mark.anyio
async def test_fetch_public_profiles_with_search(mock_pool):
    """Test fetching public profiles with search."""
    pool, connection = mock_pool
    connection.fetch.return_value = []
    
    service = SocialService(pool)
    result = await service.fetch_public_profiles("user-1", search="test")
    
    assert isinstance(result, PublicProfilesResponse)


@pytest.mark.anyio
async def test_get_leaderboard_xp(mock_pool):
    """Test getting leaderboard by XP."""
    pool, connection = mock_pool
    connection.fetch.return_value = []
    
    service = SocialService(pool)
    result = await service.get_leaderboard("xp", limit=10)
    
    assert isinstance(result, LeaderboardResponse)
    assert result.metric == "xp"


@pytest.mark.anyio
async def test_get_leaderboard_coins(mock_pool):
    """Test getting leaderboard by coins."""
    pool, connection = mock_pool
    connection.fetch.return_value = []
    
    service = SocialService(pool)
    result = await service.get_leaderboard("coins", limit=10)
    
    assert isinstance(result, LeaderboardResponse)
    assert result.metric == "coins"


@pytest.mark.anyio
async def test_get_leaderboard_invalid_metric(mock_pool):
    """Test getting leaderboard with invalid metric."""
    pool, connection = mock_pool
    service = SocialService(pool)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.get_leaderboard("invalid", limit=10)
    
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.anyio
async def test_require_pool_raises_when_none():
    """Test that _require_pool raises when pool is None."""
    service = SocialService(None)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.list_friendships("user-1")
    
    assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
