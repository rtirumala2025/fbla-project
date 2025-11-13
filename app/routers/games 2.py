"""
Mini-game API endpoints for playing games and retrieving leaderboards.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.game import (
    GAME_TYPE_PATTERN,
    GameLeaderboardResponse,
    GamePlayRequest,
    GamePlayResponse,
    GameRewardsResponse,
    GameScoreSubmission,
    GameStartRequest,
    GameStartResponse,
)
from app.services.games_service import (
    GameRuleError,
    get_games_leaderboard,
    get_reward_summary,
    start_game,
    submit_game_score,
)

router = APIRouter(prefix="/api/games", tags=["Games"])


@router.post("/start", response_model=GameStartResponse, status_code=status.HTTP_201_CREATED)
async def start_game_endpoint(
    payload: GameStartRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Initialise a new game round using the adaptive difficulty engine.
    """

    try:
        return await start_game(session, user_id, payload)
    except GameRuleError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/submit-score", response_model=GamePlayResponse, status_code=status.HTTP_201_CREATED)
async def submit_score_endpoint(
    payload: GameScoreSubmission,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Submit the score for a finished round, allocate rewards, and update streaks.
    """

    try:
        return await submit_game_score(session, user_id, payload)
    except GameRuleError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/rewards", response_model=GameRewardsResponse)
async def rewards_summary_endpoint(
    game_type: str = Query(..., regex=GAME_TYPE_PATTERN),
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve the current player's reward trajectory, streaks, and recent history.
    """

    return await get_reward_summary(session, user_id, game_type)


@router.get("/leaderboard", response_model=GameLeaderboardResponse)
async def games_leaderboard_endpoint(
    game_type: str = Query(..., regex=GAME_TYPE_PATTERN),
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),  # noqa: ARG001 - ensure auth
):
    """
    Retrieve leaderboard for a given mini-game type.
    """

    entries = await get_games_leaderboard(session, game_type)
    return GameLeaderboardResponse(entries=entries)


@router.post("/play", response_model=GamePlayResponse, status_code=status.HTTP_201_CREATED, deprecated=True)
async def legacy_play_game_endpoint(
    payload: GamePlayRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Deprecated: one-shot play endpoint retained for backwards compatibility.
    """

    try:
        round_info = await start_game(
            session,
            user_id,
            GameStartRequest(
                game_type=payload.game_type,
                preferred_difficulty=payload.difficulty,
                practice_mode=False,
            ),
        )
        submission = GameScoreSubmission(
            session_id=round_info.session_id,
            score=payload.score,
            duration_seconds=payload.duration_seconds,
            difficulty=payload.difficulty,
            metadata=payload.metadata,
        )
        return await submit_game_score(session, user_id, submission)
    except GameRuleError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

