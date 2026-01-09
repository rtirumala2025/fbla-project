"""Game-related API routes."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel

from app.models import AuthenticatedUser
from app.schemas.games import GameScoreSubmit, GameScoreResponse, LeaderboardEntry
from app.services.game_service import GameService
from app.utils.dependencies import get_current_user, get_db_pool

router = APIRouter(prefix="/games", tags=["games"])


def get_game_service(pool=Depends(get_db_pool)) -> GameService:
    """Dependency to get game service instance."""
    return GameService(pool=pool)


# ---- Schemas ----

class GameStartRequest(BaseModel):
    """Request to start a game session."""
    game_type: str
    preferred_difficulty: str = "normal"
    practice_mode: bool = False


class GameStartResponse(BaseModel):
    """Response when starting a game session."""
    session_id: str
    game_type: str
    difficulty: str
    expires_at: str
    ai_profile: dict
    longest_streak: int


class GameLeaderboardResponse(BaseModel):
    """Response with leaderboard entries."""
    entries: List[LeaderboardEntry]


class RewardHistoryItem(BaseModel):
    session_id: str
    game_type: str
    difficulty: str
    score: int
    coins: int
    happiness: int
    played_at: str


class GameRewardsResponse(BaseModel):
    """Response with rewards summary."""
    streak_days: int
    daily_streak: int
    longest_streak: int
    next_streak_bonus: Optional[int]
    leaderboard_rank: Optional[int]
    average_score: Optional[float]
    recent_rewards: List[RewardHistoryItem]


# ---- Endpoints ----

@router.post("/start", response_model=GameStartResponse, summary="Start a game session")
async def start_game(
    payload: GameStartRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: GameService = Depends(get_game_service),
) -> GameStartResponse:
    """
    Start a new game session with adaptive difficulty.
    
    Returns a session_id to use when submitting the score.
    """
    pool = await service._require_pool()
    
    async with pool.acquire() as conn:
        # Get user's leaderboard stats for adaptive difficulty
        stats = await conn.fetchrow(
            """
            SELECT best_score, games_played, average_score
            FROM game_leaderboards
            WHERE user_id = $1 AND game_type = $2
            """,
            current_user.id,
            payload.game_type,
        )
        
        # Calculate adaptive difficulty
        skill_rating = 50.0
        recommended_diff = payload.preferred_difficulty
        longest_streak = 0
        
        if stats:
            skill_rating = min(100, (stats["average_score"] or 0) / 10)
            longest_streak = stats.get("games_played", 0)  # Simplified, could track actual streak
            
            if skill_rating > 70:
                recommended_diff = "hard"
            elif skill_rating > 40:
                recommended_diff = "normal"
            else:
                recommended_diff = "easy"
    
    session_id = str(uuid.uuid4())
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat()
    
    return GameStartResponse(
        session_id=session_id,
        game_type=payload.game_type,
        difficulty=recommended_diff,
        expires_at=expires_at,
        ai_profile={
            "recommended_difficulty": recommended_diff,
            "confidence": 0.8,
            "skill_rating": skill_rating,
            "recent_average": stats["average_score"] if stats else 0,
            "current_streak": 0,
            "daily_streak": 0,
            "pet_mood": None,
        },
        longest_streak=longest_streak,
    )


@router.get("/leaderboard", response_model=GameLeaderboardResponse, summary="Get game leaderboard")
async def get_leaderboard(
    game_type: str = Query(..., description="Type of game"),
    limit: int = Query(20, ge=1, le=100),
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: GameService = Depends(get_game_service),
) -> GameLeaderboardResponse:
    """
    Get the top players on the leaderboard for a specific game type.
    """
    pool = await service._require_pool()
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT 
                gl.user_id,
                gl.best_score,
                gl.games_played,
                gl.total_coins,
                p.username,
                RANK() OVER (ORDER BY gl.best_score DESC) as rank
            FROM game_leaderboards gl
            LEFT JOIN profiles p ON gl.user_id = p.user_id
            WHERE gl.game_type = $1
            ORDER BY gl.best_score DESC
            LIMIT $2
            """,
            game_type,
            limit,
        )
    
    entries = [
        LeaderboardEntry(
            rank=row["rank"],
            user_id=row["user_id"],
            username=row["username"],
            best_score=row["best_score"],
            games_played=row["games_played"],
            total_coins=row["total_coins"] or 0,
        )
        for row in rows
    ]
    
    return GameLeaderboardResponse(entries=entries)


@router.get("/rewards", response_model=GameRewardsResponse, summary="Get rewards summary")
async def get_rewards_summary(
    game_type: str = Query(..., description="Type of game"),
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: GameService = Depends(get_game_service),
) -> GameRewardsResponse:
    """
    Get the user's rewards summary and recent game history for a game type.
    """
    pool = await service._require_pool()
    
    async with pool.acquire() as conn:
        # Get leaderboard stats
        stats = await conn.fetchrow(
            """
            SELECT 
                best_score,
                games_played,
                total_coins,
                total_happiness,
                average_score,
                last_played_at
            FROM game_leaderboards
            WHERE user_id = $1 AND game_type = $2
            """,
            current_user.id,
            game_type,
        )
        
        # Get rank
        rank = await conn.fetchval(
            """
            SELECT rank FROM (
                SELECT user_id, RANK() OVER (ORDER BY best_score DESC) as rank
                FROM game_leaderboards
                WHERE game_type = $1
            ) ranked
            WHERE user_id = $2
            """,
            game_type,
            current_user.id,
        )
        
        # Get recent game sessions
        sessions = await conn.fetch(
            """
            SELECT 
                id::text as session_id,
                game_type,
                difficulty,
                score,
                coins_earned,
                happiness_gain,
                created_at
            FROM game_sessions
            WHERE user_id = $1 AND game_type = $2
            ORDER BY created_at DESC
            LIMIT 10
            """,
            current_user.id,
            game_type,
        )
    
    recent_rewards = [
        RewardHistoryItem(
            session_id=s["session_id"],
            game_type=s["game_type"],
            difficulty=s["difficulty"] or "normal",
            score=s["score"],
            coins=s["coins_earned"] or 0,
            happiness=s["happiness_gain"] or 0,
            played_at=s["created_at"].isoformat() if s["created_at"] else "",
        )
        for s in sessions
    ]
    
    return GameRewardsResponse(
        streak_days=stats["games_played"] if stats else 0,  # Simplified
        daily_streak=0,
        longest_streak=stats["games_played"] if stats else 0,
        next_streak_bonus=10 if stats else 5,
        leaderboard_rank=rank,
        average_score=stats["average_score"] if stats else None,
        recent_rewards=recent_rewards,
    )


@router.post("/submit-score", response_model=GameScoreResponse, summary="Submit game score")
async def submit_game_score(
    payload: GameScoreSubmit,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: GameService = Depends(get_game_service),
) -> GameScoreResponse:
    """
    Submit a game score and receive rewards.
    
    Awards coins based on score and updates leaderboard.
    Optionally applies happiness boost to pet if pet_id is provided.
    """
    return await service.submit_score(
        user_id=current_user.id,
        game_type=payload.game_type,
        score=payload.score,
        difficulty=payload.difficulty,
        pet_id=payload.pet_id,
    )
