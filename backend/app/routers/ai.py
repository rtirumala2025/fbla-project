"""AI interaction endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.models import AuthenticatedUser
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    BudgetAdviceRequest,
    BudgetAdviceResponse,
    PetBehaviorRequest,
    PetBehaviorResponse,
    PetNameSuggestionRequest,
    PetNameSuggestionResponse,
)
from app.services.ai_service import AIService
from app.services.budget_ai_service import BudgetAIService
from app.services.pet_behavior_ai_service import PetBehaviorAIService
from app.services.pet_name_ai_service import PetNameAIService
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


@router.post("/budget_advice", response_model=BudgetAdviceResponse, summary="Get AI-powered budget advice")
async def get_budget_advice(
    payload: BudgetAdviceRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> BudgetAdviceResponse:
    """
    Generate personalized budget advice and spending forecast based on transaction history.
    
    Uses OpenAI API to analyze spending patterns and provide actionable financial advice.
    """
    # Verify user_id matches authenticated user
    if payload.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access budget advice for another user",
        )

    service = BudgetAIService()
    try:
        return await service.get_budget_advice(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate budget advice: {str(e)}",
        )


@router.post("/pet_name_suggestions", response_model=PetNameSuggestionResponse, summary="Validate and suggest pet names")
async def get_pet_name_suggestions(
    payload: PetNameSuggestionRequest,
) -> PetNameSuggestionResponse:
    """
    Validate a pet name and generate AI-powered alternative suggestions.
    
    Validates names against length, offensive words, and character rules.
    Uses OpenAI API to generate creative, appropriate name suggestions.
    """
    service = PetNameAIService()
    try:
        return await service.validate_and_suggest(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to validate name and generate suggestions: {str(e)}",
        )


@router.post("/pet_behavior", response_model=PetBehaviorResponse, summary="Analyze and predict pet behavior")
async def analyze_pet_behavior(
    payload: PetBehaviorRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
) -> PetBehaviorResponse:
    """
    Analyze pet interaction history and predict future behavior patterns.
    
    Uses OpenAI API to analyze interaction patterns and predict:
    - Mood forecasts for upcoming periods
    - Activity predictions based on historical data
    """
    # Verify pet belongs to user
    pet = await pet_service.get_pet(current_user.id)
    if pet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found",
        )
    
    if payload.pet_id != str(pet.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access behavior analysis for another user's pet",
        )

    service = PetBehaviorAIService()
    try:
        return await service.analyze_behavior(payload)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to analyze pet behavior: {str(e)}",
        )
