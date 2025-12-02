"""Pydantic schemas for social features."""
from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class AchievementBadge(BaseModel):
    """Achievement badge schema."""
    name: str
    description: Optional[str] = None
    earned_at: Optional[str] = None


class PublicProfileSummary(BaseModel):
    """Public profile summary schema."""
    id: str
    user_id: str
    pet_id: str
    display_name: str
    bio: Optional[str] = None
    achievements: List[AchievementBadge] = Field(default_factory=list)
    total_xp: int = 0
    total_coins: int = 0
    is_visible: bool = True


class FriendListEntry(BaseModel):
    """Friend list entry schema."""
    id: str
    status: str  # 'pending', 'accepted', 'declined'
    direction: str  # 'incoming', 'outgoing', 'friend'
    counterpart_user_id: str
    requested_at: str
    responded_at: Optional[str] = None
    profile: Optional[PublicProfileSummary] = None


class FriendsListResponse(BaseModel):
    """Friends list response schema."""
    friends: List[FriendListEntry] = Field(default_factory=list)
    pending_incoming: List[FriendListEntry] = Field(default_factory=list)
    pending_outgoing: List[FriendListEntry] = Field(default_factory=list)
    total_count: int = 0


class FriendRequestPayload(BaseModel):
    """Friend request payload schema."""
    friend_id: str


class FriendRespondPayload(BaseModel):
    """Friend request response payload schema."""
    request_id: str
    action: str  # 'accept' or 'decline'


class PublicProfilesResponse(BaseModel):
    """Public profiles response schema."""
    profiles: List[PublicProfileSummary] = Field(default_factory=list)


class LeaderboardEntry(BaseModel):
    """Leaderboard entry schema."""
    user_id: str
    display_name: str
    pet_id: str
    total_xp: int
    total_coins: int
    achievements_count: int
    rank: int
    metric_value: int


class LeaderboardResponse(BaseModel):
    """Leaderboard response schema."""
    metric: str  # 'xp', 'coins', 'achievements'
    entries: List[LeaderboardEntry] = Field(default_factory=list)
