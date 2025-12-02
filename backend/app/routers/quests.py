"""Quest system API routes."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.models import AuthenticatedUser
from app.schemas.quest import (
    ActiveQuestsResponse,
    DailyQuestsResponse,
    QuestClaimRequest,
    QuestClaimResponse,
    QuestCompleteRequest,
    QuestCompletionResponse,
)
from app.services.quest_service import QuestService
from app.utils import get_current_user, get_quest_service

router = APIRouter(prefix="/quests", tags=["quests"])


@router.get("", response_model=ActiveQuestsResponse)
async def get_active_quests(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: QuestService = Depends(get_quest_service),
) -> ActiveQuestsResponse:
    """
    Get all active quests for the authenticated user, grouped by type (daily, weekly, event).
    
    Returns quests that are currently active based on their start_at and end_at timestamps,
    along with the user's current progress and status for each quest.
    """
    return await service.get_active_quests(current_user.id)


@router.get("/daily", response_model=DailyQuestsResponse)
async def get_daily_quests(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: QuestService = Depends(get_quest_service),
) -> DailyQuestsResponse:
    """
    Get only daily quests for the authenticated user.
    
    Includes information about when daily quests will reset next (midnight UTC).
    """
    return await service.get_daily_quests(current_user.id)


@router.post("/complete", response_model=QuestCompletionResponse)
async def complete_quest(
    payload: QuestCompleteRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: QuestService = Depends(get_quest_service),
) -> QuestCompletionResponse:
    """
    Complete a quest and receive rewards.
    
    Marks the quest as completed if progress has reached the target value,
    and awards coins and XP rewards. The quest must be in 'in_progress' status
    and have sufficient progress to complete.
    """
    return await service.complete_quest(current_user.id, payload.quest_id)


@router.post("/claim-reward", response_model=QuestClaimResponse)
async def claim_quest_reward(
    payload: QuestClaimRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: QuestService = Depends(get_quest_service),
) -> QuestClaimResponse:
    """
    Claim rewards from a completed quest.
    
    Changes the quest status from 'completed' to 'claimed'. Rewards are
    automatically awarded when the quest is completed, so this endpoint
    primarily updates the status to indicate the user has collected their rewards.
    """
    return await service.claim_reward(current_user.id, payload.quest_id)
