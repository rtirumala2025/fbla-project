"""Pet management API routes."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status

from app.models import AuthenticatedUser
from app.schemas import (
    PetAction,
    PetActionRequest,
    PetActionResponse,
    PetCreate,
    PetDiaryCreate,
    PetDiaryEntryResponse,
    PetResponse,
    PetUpdate,
)
from app.services.pet_service import PetService
from app.utils import get_current_user, get_pet_service, get_quest_service, get_shop_service
from app.services.quest_service import QuestService

router = APIRouter(prefix="/pets", tags=["pets"])


@router.get("", response_model=PetResponse)
async def fetch_pet(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> PetResponse:
    pet = await service.get_pet(current_user.id)
    if pet is None:
        raise_status_not_found()
    return pet


@router.post("", response_model=PetResponse, status_code=status.HTTP_201_CREATED)
async def create_pet(
    payload: PetCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> PetResponse:
    return await service.create_pet(current_user.id, payload)


@router.patch("", response_model=PetResponse)
async def update_pet(
    payload: PetUpdate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> PetResponse:
    return await service.update_pet(current_user.id, payload)


@router.post("/actions/{action}", response_model=PetActionResponse)
async def perform_action(
    action: PetAction,
    payload: PetActionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
    quest_service: QuestService = Depends(get_quest_service),
) -> PetActionResponse:
    response = await service.apply_action(current_user.id, action, payload)
    
    # Track quest progress for pet actions
    try:
        # Map pet actions to quest keys
        quest_key_map = {
            PetAction.feed: ['daily_feed_pet', 'daily_feed_three', 'daily_care_complete'],
            PetAction.play: ['daily_play_pet', 'daily_play_five', 'daily_care_complete'],
            PetAction.bathe: ['daily_bathe_pet', 'daily_care_complete'],
            PetAction.rest: [],  # Rest doesn't have a direct quest yet
        }
        
        quest_keys = quest_key_map.get(action, [])
        for quest_key in quest_keys:
            # Update quest progress (fire-and-forget, don't block response)
            try:
                await quest_service.update_progress(current_user.id, quest_key, 1)
            except Exception as quest_err:
                # Log individual quest failures but continue
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"Quest progress update skipped for {quest_key}: {quest_err}")
    except Exception as e:
        # Log but don't fail the pet action if quest tracking fails
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to track quest progress for action {action}: {e}")
    
    return response


@router.get("/diary", response_model=List[PetDiaryEntryResponse])
async def get_diary_entries(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> List[PetDiaryEntryResponse]:
    return await service.get_diary(current_user.id)


@router.post("/diary", response_model=PetDiaryEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_diary_entry(
    payload: PetDiaryCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> PetDiaryEntryResponse:
    pet = await service.get_pet(current_user.id)
    if pet is None:
        raise_status_not_found()
    return await service.add_diary_entry(current_user.id, pet.id, payload)


@router.post("/game-loop", summary="Process game loop updates")
async def process_game_loop(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
    shop_service = Depends(get_shop_service),
) -> dict:
    """
    Process game loop updates (stat decay, idle coins, etc.).
    This endpoint can be called periodically or on login to catch up on missed time.
    """
    from app.services.game_loop_service import GameLoopService
    from app.utils import get_shop_service
    
    # Create game loop service
    game_loop_service = GameLoopService(
        pool=None,  # Will use pet_service's pool
        pet_service=service,
        shop_service=shop_service,
    )
    
    return await game_loop_service.process_game_loop(current_user.id)


def raise_status_not_found() -> None:
    from fastapi import HTTPException

    raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Pet not found.")
