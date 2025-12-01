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
from app.services.nlp_command_service import NLPCommandService
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


@router.post("/nlp_command", summary="Process natural language command with context awareness")
async def process_nlp_command(
    payload: dict,
    current_user: AuthenticatedUser = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
) -> dict:
    """
    Process a natural language command with context-aware, multi-turn conversation support.
    
    Uses OpenAI API for better understanding with fallback to rule-based parsing.
    Maintains conversation context for multi-turn interactions.
    
    Request body:
    {
        "command": "feed my pet",
        "user_id": "user-id",
        "session_id": "optional-session-id",
        "pet_context": {...}
    }
    """
    command = payload.get("command")
    user_id = payload.get("user_id", current_user.id)
    session_id = payload.get("session_id")
    pet_context = payload.get("pet_context")
    
    if not command:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Command is required",
        )
    
    # Verify user_id matches authenticated user
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot process commands for another user",
        )
    
    # Get pet context if not provided
    if not pet_context:
        pet = await pet_service.get_pet(current_user.id)
        if pet is not None:
            pet_context = {
                "name": pet.name,
                "hunger": pet.stats.hunger if hasattr(pet.stats, 'hunger') else 70,
                "happiness": pet.stats.happiness if hasattr(pet.stats, 'happiness') else 70,
                "energy": pet.stats.energy if hasattr(pet.stats, 'energy') else 70,
                "cleanliness": pet.stats.hygiene if hasattr(pet.stats, 'hygiene') else 70,
            }
    
    service = NLPCommandService()
    try:
        result = await service.process_command(
            command=command,
            user_id=user_id,
            session_id=session_id,
            pet_context=pet_context,
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process command: {str(e)}",
        )
