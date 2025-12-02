"""Domain models for social features."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional


class FriendStatus(str, Enum):
    """Friend request status."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    DECLINED = "declined"


@dataclass(slots=True)
class Friendship:
    """Represents a friendship relationship between two users."""
    id: str
    user_id: str
    friend_id: str
    status: FriendStatus
    requested_at: datetime
    responded_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


@dataclass(slots=True)
class FriendRequest:
    """Represents a friend request."""
    id: str
    user_id: str
    friend_id: str
    status: FriendStatus
    requested_at: datetime
    responded_at: Optional[datetime] = None


@dataclass(slots=True)
class BlockedUser:
    """Represents a blocked user relationship."""
    id: str
    user_id: str
    blocked_user_id: str
    created_at: datetime
    reason: Optional[str] = None
