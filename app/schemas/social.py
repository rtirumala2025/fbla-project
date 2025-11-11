"""
Pydantic schemas for the social layer API.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.social import FriendStatus


class AchievementBadge(BaseModel):
    """Lightweight representation of an achievement shown on public profiles."""

    name: str
    description: Optional[str] = None
    earned_at: Optional[datetime] = None


class PublicProfileSummary(BaseModel):
    """Details exposed on the public profile feed."""

    id: UUID
    user_id: UUID
    pet_id: UUID
    display_name: str
    bio: Optional[str]
    achievements: list[AchievementBadge]
    total_xp: int = Field(..., ge=0)
    total_coins: int = Field(..., ge=0)
    is_visible: bool

class FriendRequestPayload(BaseModel):
    """Payload for initiating a new friend request."""

    friend_id: UUID = Field(..., description="Target user ID to befriend.")


class FriendRespondPayload(BaseModel):
    """Payload for responding to an incoming friend request."""

    request_id: UUID
    action: Literal["accept", "decline"]


class FriendListEntry(BaseModel):
    """Entry returned from the friends list endpoint."""

    id: UUID
    status: FriendStatus
    direction: Literal["incoming", "outgoing", "friend"]
    counterpart_user_id: UUID
    requested_at: datetime
    responded_at: Optional[datetime]
    profile: Optional[PublicProfileSummary] = None


class FriendsListResponse(BaseModel):
    """Grouped friend list response with convenience counts."""

    friends: list[FriendListEntry]
    pending_incoming: list[FriendListEntry]
    pending_outgoing: list[FriendListEntry]
    total_count: int


class PublicProfilesResponse(BaseModel):
    """Response for /public_profiles endpoint."""

    profiles: list[PublicProfileSummary]


class LeaderboardEntry(BaseModel):
    """Single entry in the social leaderboard."""

    user_id: UUID
    display_name: str
    pet_id: UUID
    total_xp: int
    total_coins: int
    achievements_count: int
    rank: int
    metric_value: int


class LeaderboardResponse(BaseModel):
    """Leaderboard payload returned to clients."""

    metric: Literal["xp", "coins", "achievements"]
    entries: list[LeaderboardEntry]


