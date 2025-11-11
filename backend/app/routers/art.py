"""AI pet art generation endpoints."""
from __future__ import annotations

from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.models import AuthenticatedUser
from app.schemas import ArtGenerationRequest, ArtGenerationResponse
from app.services.accessory_service import AccessoryService
from app.services.pet_art_service import PetArtService
from app.services.pet_service import PetService
from app.utils import (
    get_accessory_service,
    get_current_user,
    get_pet_art_service,
    get_pet_service,
)

router = APIRouter(prefix="/art", tags=["art"])


@router.post(
    "/generate",
    response_model=ArtGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate a pet avatar using AI with accessory context.",
)
async def generate_pet_art(
    payload: ArtGenerationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
    accessory_service: AccessoryService = Depends(get_accessory_service),
    art_service: PetArtService = Depends(get_pet_art_service),
) -> ArtGenerationResponse:
    pet = await pet_service.get_pet(current_user.id)
    if pet is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found.")
    if payload.pet_id != pet.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet does not belong to the current user.")

    accessories = await accessory_service.get_accessories_by_ids(payload.accessory_ids)
    if len(accessories) != len(payload.accessory_ids):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "One or more accessories are invalid.")

    accessory_payloads = [
        {
            "accessory_id": accessory.accessory_id,
            "name": accessory.name,
            "type": accessory.type,
            "rarity": accessory.rarity,
            "effects": accessory.effects,
            "color_palette": accessory.color_palette,
        }
        for accessory in accessories
    ]

    base_prompt = _build_base_prompt(pet)
    entry, cached = await art_service.generate_pet_art(
        user_id=current_user.id,
        pet_id=pet.id,
        mood=pet.stats.mood,
        accessories=accessory_payloads,
        style=payload.style,
        base_prompt=base_prompt,
        force_refresh=payload.force_refresh,
    )
    palette: Dict[str, str] = entry.metadata.get("palette", {})

    return ArtGenerationResponse(
        image_base64=entry.image_base64,
        cached=cached,
        prompt=entry.prompt,
        style=entry.style,
        accessory_ids=entry.accessory_ids,
        mood=entry.mood,
        palette=palette,
        created_at=entry.created_at,
    )


def _build_base_prompt(pet) -> str:
    primary_color = pet.color or "vibrant hues"
    breed_text = f"{pet.breed} " if pet.breed else ""
    return (
        f"A charismatic portrait of {pet.name}, a {breed_text}{pet.species} companion. "
        f"The palette should reflect a {pet.stats.mood} mood with {primary_color} tones."
    )

