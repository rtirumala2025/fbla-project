"""Pet management API routes."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status

from app.models import AuthenticatedUser
from app.schemas import (
    HealthCheckRequest,
    HealthCheckResponse,
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
    return pet  # type: ignore[return-value]  # Guaranteed non-None after check


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
    # pet is guaranteed non-None after check above
    assert pet is not None
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


# ========== Room System Endpoints (Multi-Room Hub) ==========

from pydantic import BaseModel
from typing import Dict, Any, Optional


class UseItemRequest(BaseModel):
    """Request payload for using an inventory item."""
    quantity: int = 1


class EquipItemRequest(BaseModel):
    """Request payload for equipping/unequipping an accessory."""
    slot: str  # collar, hat, glasses, bandana, back


@router.post("/inventory/{item_id}/use", summary="Use a consumable inventory item")
async def use_inventory_item(
    item_id: str,
    payload: UseItemRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> Dict[str, Any]:
    """
    Use a consumable item (food, hygiene, toy) from inventory.
    Applies stat effects to the pet and decrements inventory quantity.
    
    Returns:
    - success: bool
    - remaining_quantity: int
    - stat_updates: Dict[str, int] - changes applied
    - message: str
    """
    return await service.use_inventory_item(
        user_id=current_user.id,
        item_id=item_id,
        quantity=payload.quantity,
    )


@router.post("/inventory/{item_id}/equip", summary="Toggle equip/unequip an accessory")
async def toggle_equip_item(
    item_id: str,
    payload: EquipItemRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> Dict[str, Any]:
    """
    Toggle an accessory's equipped state in a specific slot.
    If item is already equipped in the slot, it will be unequipped.
    
    Valid slots: collar, hat, glasses, bandana, back
    
    Returns:
    - success: bool
    - action: 'equipped' | 'unequipped'
    - slot: str
    - item_id: str | None
    - equipped_loadout: Dict[str, str]
    """
    return await service.toggle_equip_item(
        user_id=current_user.id,
        item_id=item_id,
        slot=payload.slot,
    )


@router.get("/equipped", summary="Get currently equipped accessories")
async def get_equipped_loadout(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> Dict[str, str]:
    """
    Get the pet's current equipped accessory loadout.
    
    Returns a dictionary mapping slot names to item IDs.
    Example: {"collar": "acc-collar-fancy", "hat": "acc-hat-crown"}
    """
    try:
        return await service.get_equipped_loadout(current_user.id)
    except Exception as e:
        # Log the error but return safe default instead of crashing
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"CRASH AVOIDED in get_equipped_loadout: {e}")
        # Return empty loadout so frontend loads without accessories
        return {}


VET_VISIT_COST = 25  # Cost of a vet visit in coins


@router.post("/health-check", summary="Perform a vet health check")
async def perform_health_check(
    payload: HealthCheckRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: PetService = Depends(get_pet_service),
) -> HealthCheckResponse:
    """
    Perform a vet health check on the pet.
    
    Deducts the vet visit cost from the user's wallet and applies the health boost.
    The health boost amount is based on the mini-game score achieved in the frontend.
    """
    from asyncpg import Pool
    
    # Get the database pool from the service
    pool = service._pool
    if pool is None:
        from fastapi import HTTPException
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database not configured")
    
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Get user's wallet
            wallet = await conn.fetchrow(
                """
                SELECT id, balance
                FROM finance_wallets
                WHERE user_id = $1
                """,
                current_user.id,
            )
            
            if not wallet:
                from fastapi import HTTPException
                raise HTTPException(
                    status.HTTP_404_NOT_FOUND,
                    "Wallet not found. Please initialize your wallet first.",
                )
            
            current_balance = wallet["balance"] or 0
            
            # Check if user can afford the vet visit
            if current_balance < VET_VISIT_COST:
                from fastapi import HTTPException
                raise HTTPException(
                    status.HTTP_400_BAD_REQUEST,
                    f"Insufficient funds. Balance: {current_balance}, Required: {VET_VISIT_COST}",
                )
            
            # Get current pet health
            pet = await conn.fetchrow(
                """
                SELECT id, health
                FROM pets
                WHERE user_id = $1
                """,
                current_user.id,
            )
            
            if not pet:
                raise_status_not_found()
            
            health_before = pet["health"] or 0
            health_after = min(100, health_before + payload.health_boost)
            
            # Deduct coins from wallet
            new_balance = current_balance - VET_VISIT_COST
            await conn.execute(
                """
                UPDATE finance_wallets
                SET balance = $1, 
                    lifetime_spent = COALESCE(lifetime_spent, 0) + $2,
                    updated_at = NOW()
                WHERE id = $3
                """,
                new_balance,
                VET_VISIT_COST,
                wallet["id"],
            )
            
            # Record transaction
            await conn.execute(
                """
                INSERT INTO finance_transactions (
                    wallet_id, user_id, item_id, item_name, amount,
                    transaction_type, category, description, balance_after
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                """,
                wallet["id"],
                current_user.id,
                "vet_visit",
                "Vet Health Check",
                -VET_VISIT_COST,
                "expense",
                "healthcare",
                f"Vet visit: +{payload.health_boost}% health boost",
                new_balance,
            )
            
            # Apply health boost to pet
            await conn.execute(
                """
                UPDATE pets
                SET health = $1, updated_at = NOW()
                WHERE id = $2
                """,
                health_after,
                pet["id"],
            )
    
    return HealthCheckResponse(
        success=True,
        cost=VET_VISIT_COST,
        new_balance=new_balance,
        health_before=health_before,
        health_after=health_after,
        message=f"Health check complete! +{payload.health_boost}% health applied.",
    )


def raise_status_not_found() -> None:
    from fastapi import HTTPException

    raise HTTPException(status.HTTP_404_NOT_FOUND, detail="Pet not found.")
