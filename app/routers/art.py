"""
AI pet art generation routes.
"""

from __future__ import annotations

from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.art import ArtGenerationRequest, ArtGenerationResponse
from app.services import get_pet_by_user, pet_art_service

router = APIRouter(prefix="/api/art", tags=["Art"])


@router.post("/generate", response_model=ArtGenerationResponse)
async def generate_pet_art(
    payload: ArtGenerationRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> ArtGenerationResponse:
    pet = await get_pet_by_user(session, user_id)
    if pet is None or str(pet.id) != str(payload.pet_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found for this user.")

    accessories: List[Dict[str, str]] = [
        {"accessory_id": str(accessory_id)} for accessory_id in payload.accessory_ids
    ]
    base_prompt = (
        f"A charismatic portrait of {pet.name}, a {pet.species.value} companion with {pet.color_pattern} tones."
    )

    result, cached = await pet_art_service.generate_pet_art(
        session,
        user_id=user_id,
        pet_id=payload.pet_id,
        mood=pet.stats.mood,
        accessories=accessories,
        style=payload.style,
        base_prompt=base_prompt,
        force_refresh=payload.force_refresh,
    )

    palette = result.metadata.get("palette", {}) if result.metadata else {}
    return ArtGenerationResponse(
        image_base64=result.image_base64,
        cached=cached,
        prompt=result.prompt,
        style=result.style,
        accessory_ids=result.accessory_ids,
        mood=result.mood,
        palette=palette,
        created_at=result.created_at,
    )
