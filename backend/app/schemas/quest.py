"""Pydantic schemas for quest system."""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class QuestType(str, Enum):
    """Quest type enumeration."""
    DAILY = "daily"
    WEEKLY = "weekly"
    EVENT = "event"


class QuestDifficulty(str, Enum):
    """Quest difficulty enumeration."""
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"
    HEROIC = "heroic"


class QuestStatus(str, Enum):
    """Quest status enumeration."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CLAIMED = "claimed"


class QuestReward(BaseModel):
    """Quest reward structure."""
    coins: int = Field(ge=0, default=0)
    xp: int = Field(ge=0, default=0)
    items: List[str] = Field(default_factory=list)


class QuestResponse(BaseModel):
    """Quest response schema."""
    id: str
    quest_key: str
    description: str
    quest_type: QuestType
    difficulty: QuestDifficulty
    rewards: QuestReward
    target_value: int
    icon: Optional[str] = None
    start_at: Optional[datetime] = None
    end_at: Optional[datetime] = None
    progress: int = Field(ge=0, default=0)
    status: QuestStatus = QuestStatus.PENDING

    model_config = {"from_attributes": True}


class ActiveQuestsResponse(BaseModel):
    """Response for active quests listing."""
    daily: List[QuestResponse] = Field(default_factory=list)
    weekly: List[QuestResponse] = Field(default_factory=list)
    event: List[QuestResponse] = Field(default_factory=list)
    refreshed_at: datetime = Field(default_factory=datetime.utcnow)


class QuestCompleteRequest(BaseModel):
    """Request to complete a quest."""
    quest_id: str = Field(..., description="UUID of the quest to complete")


class QuestClaimRequest(BaseModel):
    """Request to claim quest rewards."""
    quest_id: str = Field(..., description="UUID of the quest to claim rewards from")


class QuestCompletionResponse(BaseModel):
    """Response after completing a quest."""
    result: Dict[str, Any] = Field(
        ...,
        description="Completion result with quest details and rewards"
    )


class QuestClaimResponse(BaseModel):
    """Response after claiming quest rewards."""
    result: Dict[str, Any] = Field(
        ...,
        description="Claim result with quest details and rewards"
    )


class DailyQuestsResponse(BaseModel):
    """Response for daily quests only."""
    daily: List[QuestResponse] = Field(default_factory=list)
    refreshed_at: datetime = Field(default_factory=datetime.utcnow)
    next_reset_at: Optional[datetime] = Field(
        default=None,
        description="When daily quests will reset next"
    )
