"""Comprehensive tests for social endpoints."""
from __future__ import annotations

import pytest
from fastapi import status
from httpx import AsyncClient

from app.models import AuthenticatedUser
from app.schemas.social import FriendsListResponse
from app.services.social_service import SocialService
from app.utils.dependencies import get_current_user, get_db_pool, get_social_service


class FakeSocialService(SocialService):
    """Fake social service for testing."""
    
    def __init__(self) -> None:
        super().__init__(pool=None)
        self.friends_data: dict[str, FriendsListResponse] = {}
        self.sent_requests: list[tuple[str, str]] = []
        self.accepted_requests: list[str] = []
        self.rejected_requests: list[str] = []
        self.removed_friends: list[tuple[str, str]] = []
    
    async def list_friendships(self, user_id: str) -> FriendsListResponse:
        return self.friends_data.get(user_id, FriendsListResponse(
            friends=[],
            pending_incoming=[],
            pending_outgoing=[],
            total_count=0,
        ))
    
    async def send_friend_request(self, user_id: str, friend_id: str) -> FriendsListResponse:
        if user_id == friend_id:
            from fastapi import HTTPException
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot send friend request to yourself.")
        
        self.sent_requests.append((user_id, friend_id))
        # Simulate adding to pending_outgoing
        response = await self.list_friendships(user_id)
        from app.schemas.social import FriendListEntry
        from datetime import datetime
        response.pending_outgoing.append(FriendListEntry(
            id="req-123",
            status="pending",
            direction="outgoing",
            counterpart_user_id=friend_id,
            requested_at=datetime.now().isoformat(),
            profile=None,
        ))
        self.friends_data[user_id] = response
        return response
    
    async def respond_to_friend_request(
        self, user_id: str, request_id: str, action: str
    ) -> FriendsListResponse:
        if action == 'accept':
            self.accepted_requests.append(request_id)
        elif action == 'decline':
            self.rejected_requests.append(request_id)
        
        response = await self.list_friendships(user_id)
        # Remove from pending_incoming and add to friends if accepted
        if action == 'accept':
            response.pending_incoming = [
                req for req in response.pending_incoming if req.id != request_id
            ]
            from app.schemas.social import FriendListEntry
            from datetime import datetime
            response.friends.append(FriendListEntry(
                id=request_id,
                status="accepted",
                direction="friend",
                counterpart_user_id="friend-123",
                requested_at=datetime.now().isoformat(),
                responded_at=datetime.now().isoformat(),
                profile=None,
            ))
            response.total_count = len(response.friends)
        self.friends_data[user_id] = response
        return response
    
    async def remove_friend(self, user_id: str, friend_id: str) -> FriendsListResponse:
        if user_id == friend_id:
            from fastapi import HTTPException
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot remove yourself as a friend.")
        
        self.removed_friends.append((user_id, friend_id))
        response = await self.list_friendships(user_id)
        response.friends = [
            f for f in response.friends if f.counterpart_user_id != friend_id
        ]
        response.total_count = len(response.friends)
        self.friends_data[user_id] = response
        return response
    
    async def get_incoming_requests(self, user_id: str) -> FriendsListResponse:
        response = await self.list_friendships(user_id)
        return FriendsListResponse(
            friends=[],
            pending_incoming=response.pending_incoming,
            pending_outgoing=[],
            total_count=0,
        )
    
    async def get_outgoing_requests(self, user_id: str) -> FriendsListResponse:
        response = await self.list_friendships(user_id)
        return FriendsListResponse(
            friends=[],
            pending_incoming=[],
            pending_outgoing=response.pending_outgoing,
            total_count=0,
        )
    
    async def fetch_public_profiles(self, user_id: str, search: str | None = None, limit: int = 20):
        from app.schemas.social import PublicProfilesResponse, PublicProfileSummary, AchievementBadge
        return PublicProfilesResponse(profiles=[
            PublicProfileSummary(
                id="profile-1",
                user_id="user-2",
                pet_id="pet-2",
                display_name="Test User",
                bio="Test bio",
                achievements=[AchievementBadge(name="First Pet")],
                total_xp=1000,
                total_coins=500,
                is_visible=True,
            )
        ])
    
    async def get_leaderboard(self, user_id: str, metric: str = 'xp', limit: int = 20):
        from app.schemas.social import LeaderboardResponse, LeaderboardEntry
        return LeaderboardResponse(
            metric=metric,
            entries=[
                LeaderboardEntry(
                    user_id="user-1",
                    display_name="Top User",
                    pet_id="pet-1",
                    total_xp=2000,
                    total_coins=1000,
                    achievements_count=5,
                    rank=1,
                    metric_value=2000,
                )
            ],
        )


@pytest.fixture(autouse=True)
def override_dependencies(monkeypatch: pytest.MonkeyPatch):
    fake_social_service = FakeSocialService()

    def _social_service_override(pool=None):
        return fake_social_service

    async def _current_user_override():
        return AuthenticatedUser(id="user-1", email="test@example.com")

    from app.main import app
    from app.routers.social import get_social_service

    app.dependency_overrides[get_social_service] = _social_service_override
    app.dependency_overrides[get_current_user] = _current_user_override

    yield fake_social_service

    app.dependency_overrides.pop(get_social_service, None)
    app.dependency_overrides.pop(get_current_user, None)


@pytest.mark.anyio
async def test_get_friends(test_client: AsyncClient, override_dependencies) -> None:
    """Test getting friends list."""
    response = await test_client.get("/api/social/friends")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "friends" in data
    assert "pending_incoming" in data
    assert "pending_outgoing" in data
    assert "total_count" in data


@pytest.mark.anyio
async def test_send_friend_request(test_client: AsyncClient, override_dependencies) -> None:
    """Test sending a friend request."""
    response = await test_client.post(
        "/api/social/friends/request",
        json={"friend_id": "user-2"},
    )
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert len(data["pending_outgoing"]) > 0
    assert override_dependencies.sent_requests == [("user-1", "user-2")]


@pytest.mark.anyio
async def test_send_friend_request_to_self(test_client: AsyncClient, override_dependencies) -> None:
    """Test that users cannot friend themselves."""
    response = await test_client.post(
        "/api/social/friends/request",
        json={"friend_id": "user-1"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.anyio
async def test_accept_friend_request(test_client: AsyncClient, override_dependencies) -> None:
    """Test accepting a friend request."""
    # First send a request
    await test_client.post(
        "/api/social/friends/request",
        json={"friend_id": "user-2"},
    )
    
    # Accept it
    response = await test_client.post(
        "/api/social/accept",
        json={"request_id": "req-123"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert "req-123" in override_dependencies.accepted_requests


@pytest.mark.anyio
async def test_reject_friend_request(test_client: AsyncClient, override_dependencies) -> None:
    """Test rejecting a friend request."""
    response = await test_client.post(
        "/api/social/reject",
        json={"request_id": "req-123"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert "req-123" in override_dependencies.rejected_requests


@pytest.mark.anyio
async def test_respond_to_friend_request(test_client: AsyncClient, override_dependencies) -> None:
    """Test responding to a friend request via the original endpoint."""
    response = await test_client.patch(
        "/api/social/friends/respond",
        json={"request_id": "req-123", "action": "accept"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert "req-123" in override_dependencies.accepted_requests


@pytest.mark.anyio
async def test_remove_friend(test_client: AsyncClient, override_dependencies) -> None:
    """Test removing a friend."""
    response = await test_client.post(
        "/api/social/remove",
        json={"friend_id": "user-2"},
    )
    assert response.status_code == status.HTTP_200_OK
    assert ("user-1", "user-2") in override_dependencies.removed_friends


@pytest.mark.anyio
async def test_remove_friend_self(test_client: AsyncClient, override_dependencies) -> None:
    """Test that users cannot remove themselves."""
    response = await test_client.post(
        "/api/social/remove",
        json={"friend_id": "user-1"},
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.anyio
async def test_get_incoming_requests(test_client: AsyncClient, override_dependencies) -> None:
    """Test getting incoming friend requests."""
    response = await test_client.get("/api/social/requests/incoming")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "pending_incoming" in data
    assert "pending_outgoing" in data
    assert len(data["pending_outgoing"]) == 0


@pytest.mark.anyio
async def test_get_outgoing_requests(test_client: AsyncClient, override_dependencies) -> None:
    """Test getting outgoing friend requests."""
    response = await test_client.get("/api/social/requests/outgoing")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "pending_outgoing" in data
    assert "pending_incoming" in data
    assert len(data["pending_incoming"]) == 0


@pytest.mark.anyio
async def test_get_public_profiles(test_client: AsyncClient, override_dependencies) -> None:
    """Test getting public profiles."""
    response = await test_client.get("/api/social/public_profiles")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "profiles" in data
    assert len(data["profiles"]) > 0


@pytest.mark.anyio
async def test_get_leaderboard(test_client: AsyncClient, override_dependencies) -> None:
    """Test getting leaderboard."""
    response = await test_client.get("/api/social/leaderboard?metric=xp")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "metric" in data
    assert "entries" in data
    assert data["metric"] == "xp"
