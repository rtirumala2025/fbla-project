"""
Quest API endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.quest import ActiveQuestsResponse, QuestCompletionRequest, QuestCompletionResponse
from app.services.quest_service import (
    QuestAlreadyCompletedError,
    QuestNotFoundError,
    complete_quest,
    get_active_quests,
)

router = APIRouter(prefix="/api/quests", tags=["Quests"])


@router.get("", response_model=ActiveQuestsResponse)
async def list_active_quests(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ActiveQuestsResponse:
    """
    Retrieve the current set of active quests alongside the user's progress.
    """

    return await get_active_quests(session, user_id)


@router.post("/complete", response_model=QuestCompletionResponse, status_code=status.HTTP_200_OK)
async def complete_quest_endpoint(
    payload: QuestCompletionRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> QuestCompletionResponse:
    """
    Mark a quest as completed and apply rewards atomically.
    """

    try:
        result = await complete_quest(session, user_id, payload)
    except QuestNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except QuestAlreadyCompletedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    return QuestCompletionResponse(result=result)


