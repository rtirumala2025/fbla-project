"""
Pydantic schemas for quests and AI coach advice.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.quest import QuestDifficulty, QuestStatus, QuestType


class QuestReward(BaseModel):
    """Structured rewards distributed when a quest is completed."""

    coins: int = Field(0, ge=0)
    xp: int = Field(0, ge=0)
    items: list[str] = Field(default_factory=list)


class QuestRead(BaseModel):
    """Quest definition merged with the user's current progress."""

    id: UUID
    quest_key: str
    description: str
    quest_type: QuestType
    difficulty: QuestDifficulty
    rewards: QuestReward
    target_value: int = Field(..., ge=1)
    icon: Optional[str]
    start_at: Optional[datetime]
    end_at: Optional[datetime]
    progress: int = Field(..., ge=0)
    status: QuestStatus


class ActiveQuestsResponse(BaseModel):
    """Payload returned to clients for `/api/quests`."""

    daily: list[QuestRead]
    weekly: list[QuestRead]
    event: list[QuestRead]
    refreshed_at: datetime


class QuestCompletionRequest(BaseModel):
    """Client request for marking a quest as completed."""

    quest_id: UUID


class QuestCompletionResult(BaseModel):
    """Detailed result after a quest has been completed and rewards applied."""

    quest: QuestRead
    coins_awarded: int
    xp_awarded: int
    new_balance: Optional[int] = Field(default=None, description="Updated wallet balance if available.")
    total_xp: Optional[int] = Field(default=None, description="Updated profile XP if tracked.")
    message: str


class QuestCompletionResponse(BaseModel):
    """Wrapper response for `/api/quests/complete`."""

    result: QuestCompletionResult


class CoachInsight(BaseModel):
    """Single line of advice keyed by a category."""

    category: Literal["care", "activity", "quest", "difficulty", "motivation"]
    recommendation: str


class CoachAdviceResponse(BaseModel):
    """AI coach guidance summarising next best actions."""

    mood: Optional[str]
    difficulty_hint: QuestDifficulty
    summary: str
    suggestions: list[CoachInsight]
    generated_at: datetime
    source: Literal["heuristic", "llm"]


