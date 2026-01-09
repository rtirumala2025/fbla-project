"""Schemas for game-related operations."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class GameScoreSubmit(BaseModel):
    """Request to submit a game score."""
    game_type: str = Field(..., description="Type of game (agility, vet_reaction, etc.)")
    score: int = Field(..., ge=0, description="Score achieved")
    difficulty: str = Field(default="normal", description="Game difficulty level")
    pet_id: Optional[str] = None


class GameScoreResponse(BaseModel):
    """Response after submitting a game score."""
    success: bool
    score: int
    coins_earned: int
    happiness_gained: int
    new_best: bool
    leaderboard_rank: Optional[int] = None
    message: str


class LeaderboardEntry(BaseModel):
    """Single entry in a game leaderboard."""
    rank: int
    user_id: str
    username: Optional[str] = None
    best_score: int
    games_played: int
    total_coins: int
