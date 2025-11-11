"""AI interaction endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends

from app.models import AuthenticatedUser
from app.schemas import AIChatRequest, AIChatResponse
from app.services.ai_service import AIService
from app.services.pet_service import PetService
from app.utils.dependencies import get_ai_service, get_current_user, get_pet_service

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/chat", response_model=AIChatResponse, summary="Conversational AI chat endpoint")
async def chat_with_virtual_pet(
    payload: AIChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: AIService = Depends(get_ai_service),
    pet_service: PetService = Depends(get_pet_service),
) -> AIChatResponse:
    pet_snapshot = None
    pet = await pet_service.get_pet(current_user.id)
    if pet is not None:
        pet_snapshot = {
            "id": pet.id,
            "name": pet.name,
            "species": pet.species,
            "mood": pet.stats.mood,
            "hunger": pet.stats.hunger,
            "hygiene": pet.stats.hygiene,
            "energy": pet.stats.energy,
            "health": pet.stats.health,
            "cleanliness": pet.stats.hygiene,
        }
    return await service.chat(current_user.id, payload, pet_snapshot)
