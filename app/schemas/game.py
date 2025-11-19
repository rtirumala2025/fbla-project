"""
Pydantic schemas for mini-game API interactions.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.finance import FinanceSummary


GAME_TYPE_PATTERN = "^(fetch|memory|puzzle|reaction|clicker)$"
DIFFICULTY_PATTERN = "^(easy|normal|hard)$"


class GameStartRequest(BaseModel):
    game_type: str = Field(..., regex=GAME_TYPE_PATTERN)
    preferred_difficulty: Optional[str] = Field(default=None, regex=DIFFICULTY_PATTERN)
    practice_mode: bool = False


class AdaptiveDifficultyProfile(BaseModel):
    recommended_difficulty: str
    confidence: float = Field(..., ge=0, le=1)
    skill_rating: float = Field(..., ge=0, le=100)
    recent_average: float = Field(..., ge=0, le=100)
    current_streak: int
    daily_streak: int
    pet_mood: Optional[str] = None


class GameStartResponse(BaseModel):
    session_id: UUID
    game_type: str
    difficulty: str
    expires_at: datetime
    ai_profile: AdaptiveDifficultyProfile
    longest_streak: int


class GameScoreSubmission(BaseModel):
    session_id: UUID
    score: int = Field(..., ge=0, le=100)
    duration_seconds: int = Field(..., ge=1)
    difficulty: Optional[str] = Field(default=None, regex=DIFFICULTY_PATTERN)
    metadata: Optional[dict] = None


class GamePlayRequest(BaseModel):
    """
    Legacy schema retained for backward compatibility with /api/games/play.
    """

    game_type: str = Field(..., regex=GAME_TYPE_PATTERN)
    difficulty: str = Field(default="normal", regex=DIFFICULTY_PATTERN)
    score: int = Field(..., ge=0, le=100)
    duration_seconds: int = Field(..., ge=1)
    metadata: Optional[dict] = None


class GameReward(BaseModel):
    coins: int
    happiness: int
    streak_bonus: int = 0
    achievement_unlocked: Optional[str] = None


class GamePlayResponse(BaseModel):
    reward: GameReward
    finance: FinanceSummary
    mood: Optional[str] = None
    message: str
    streak_days: Optional[int] = None
    daily_streak: Optional[int] = None


class GameLeaderboardEntry(BaseModel):
    user_id: UUID
    game_type: str
    best_score: int
    total_wins: int
    last_played_at: datetime
    average_score: Optional[float] = None
    current_streak: Optional[int] = None
    daily_streak: Optional[int] = None


class GameLeaderboardResponse(BaseModel):
    entries: List[GameLeaderboardEntry]


class GameRewardHistory(BaseModel):
    session_id: UUID
    game_type: str
    difficulty: str
    score: int
    coins: int
    happiness: int
    played_at: datetime


class GameRewardsResponse(BaseModel):
    streak_days: int
    daily_streak: int
    longest_streak: int
    next_streak_bonus: Optional[int]
    leaderboard_rank: Optional[int]
    average_score: Optional[float]
    recent_rewards: List[GameRewardHistory]