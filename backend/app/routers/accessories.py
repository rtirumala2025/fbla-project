"""Accessory catalog and equipment endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.models import AuthenticatedUser
from app.schemas import (
    AccessoryEquipRequest,
    AccessoryEquipResponse,
    AccessoryListResponse,
    AccessorySchema,
)
from app.services.accessory_service import AccessoryService
from app.services.pet_service import PetService
from app.utils import get_accessory_service, get_current_user, get_pet_service

router = APIRouter(prefix="/accessories", tags=["accessories"])


def _serialize_accessory(accessory) -> AccessorySchema:
    return AccessorySchema(
        accessory_id=accessory.accessory_id,
        name=accessory.name,
        type=accessory.type,
        rarity=accessory.rarity,
        effects=accessory.effects,
        color_palette=accessory.color_palette,
        preview_url=accessory.preview_url,
    )


@router.get("", response_model=AccessoryListResponse, summary="List available accessories")
async def list_accessories(
    service: AccessoryService = Depends(get_accessory_service),
) -> AccessoryListResponse:
    accessories = await service.list_accessories()
    return AccessoryListResponse(accessories=[_serialize_accessory(item) for item in accessories])


@router.post(
    "/equip",
    response_model=AccessoryEquipResponse,
    status_code=status.HTTP_200_OK,
    summary="Equip or unequip an accessory for the current user",
)
async def toggle_accessory(
    payload: AccessoryEquipRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    accessory_service: AccessoryService = Depends(get_accessory_service),
    pet_service: PetService = Depends(get_pet_service),
) -> AccessoryEquipResponse:
    pet = await pet_service.get_pet(current_user.id)
    mood = None
    pet_id = payload.pet_id
    if pet is not None:
        if pet_id is None:
            pet_id = pet.id
        if pet_id != pet.id:
            pet = None  # the specified pet is not owned by the user
    if pet is None and pet_id is not None:
        raise_not_found()
    if pet is not None:
        mood = pet.stats.mood

    if payload.equipped:
        equipped = await accessory_service.equip_accessory(
            user_id=current_user.id,
            pet_id=pet_id,
            accessory_id=payload.accessory_id,
            mood=mood,
        )
    else:
        equipped = await accessory_service.unequip_accessory(
            user_id=current_user.id,
            pet_id=pet_id,
            accessory_id=payload.accessory_id,
        )
    return AccessoryEquipResponse(
        accessory_id=equipped.accessory_id,
        pet_id=equipped.pet_id,
        equipped=equipped.equipped,
        equipped_color=equipped.equipped_color,
        equipped_slot=equipped.equipped_slot,
        applied_mood=mood,
        updated_at=equipped.updated_at,
    )


def raise_not_found() -> None:
    from fastapi import HTTPException

    raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found for accessory equip.")

