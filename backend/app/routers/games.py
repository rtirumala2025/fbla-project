"""Game-related API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models import AuthenticatedUser
from app.schemas.games import GameScoreSubmit, GameScoreResponse
from app.services.game_service import GameService
from app.utils.dependencies import get_current_user, get_db_pool

router = APIRouter(prefix="/games", tags=["games"])


def get_game_service(pool=Depends(get_db_pool)) -> GameService:
    """Dependency to get game service instance."""
    return GameService(pool=pool)


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
