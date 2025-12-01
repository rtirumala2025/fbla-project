"""AI interaction endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.models import AuthenticatedUser
from app.schemas.ai import (
    AIChatRequest,
    AIChatResponse,
    BudgetAdviceRequest,
    BudgetAdviceResponse,
    DecisionEvaluationRequest,
    DecisionEvaluationResponse,
    FinanceScenarioRequest,
    FinanceScenarioResponse,
    HabitPredictionRequest,
    HabitPredictionResponse,
    PetBehaviorRequest,
    PetBehaviorResponse,
    PetMoodForecastRequest,
    PetMoodForecastResponse,
    PetNameSuggestionRequest,
    PetNameSuggestionResponse,
)
from app.api.ai import get_unified_ai_service, UnifiedAIService
from app.services.ai_service import AIService
from app.services.finance_simulator import FinanceSimulatorService
from app.services.habit_prediction import HabitPredictionService
from app.services.pet_mood_forecast import PetMoodForecastService
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
    """
    Chat with the virtual pet AI companion (Scout).
    
    Endpoint for conversational interactions with the AI. Provides context-aware
    responses based on pet state and conversation history. Supports multi-turn
    conversations with session management.
    
    Authentication: Required (Bearer token)
    
    Args:
        payload: Chat request with message and optional session_id
        current_user: Authenticated user (injected via dependency)
        service: AI service instance (injected via dependency)
        pet_service: Pet service for retrieving pet state (injected via dependency)
        
    Returns:
        AIChatResponse with AI message, mood analysis, notifications, pet state, and health forecast
        
    Raises:
        401: If not authenticated
        404: If pet not found (optional - continues without pet context if missing)
        500: If AI service fails
    """
    # Retrieve current pet state for context-aware responses
    pet_snapshot = None
    pet = await pet_service.get_pet(current_user.id)
    if pet is not None:
        # Build pet snapshot with current stats for AI context
        pet_snapshot = {
            "id": pet.id,
            "name": pet.name,
            "species": pet.species,
            "mood": pet.stats.mood,
            "hunger": pet.stats.hunger,
            "hygiene": pet.stats.hygiene,
            "energy": pet.stats.energy,
            "health": pet.stats.health,
            "cleanliness": pet.stats.hygiene,  # Alias for compatibility
        }
    # Delegate to AI service for processing (handles LLM calls, context management, etc.)
    return await service.chat(current_user.id, payload, pet_snapshot)


@router.post("/budget_advice", response_model=BudgetAdviceResponse, summary="Get AI-powered budget advice")
async def get_budget_advice(
    payload: BudgetAdviceRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    ai_service: UnifiedAIService = Depends(get_unified_ai_service),
) -> BudgetAdviceResponse:
    """
    Generate personalized budget advice and spending forecast based on transaction history.
    
    Analyzes user's transaction history to identify spending patterns, provides
    personalized financial advice, and generates spending forecasts. Uses consolidated
    AI forecasting engine with Python-based statistical analysis and AI-powered insights.
    
    Authentication: Required (Bearer token)
    
    Security: Validates that user_id in request matches authenticated user to prevent
    unauthorized access to other users' financial data.
    
    Args:
        payload: Budget advice request with user_id and transaction history
        current_user: Authenticated user (injected via dependency)
        ai_service: Unified AI service instance (injected via dependency)
        
    Returns:
        BudgetAdviceResponse with AI-generated advice and spending forecast
        
    Raises:
        403: If attempting to access another user's budget advice
        500: If AI service fails or transaction analysis fails
    """
    # Security check: ensure user can only access their own budget advice
    if payload.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access budget advice for another user",
        )

    try:
        # Convert transaction history to format expected by forecasting engine
        transactions = []
        for txn in payload.transaction_history:
            transactions.append({
                "amount": txn.amount,
                "category": txn.category,
                "date": txn.date,
                "description": getattr(txn, "description", None),
            })
        
        # Generate comprehensive forecast
        forecast_result = await ai_service.generate_budget_forecast(
            transactions=transactions,
            forecast_months=6,
            user_id=payload.user_id,
        )
        
        # Generate AI advice from recommendations
        advice = " ".join(forecast_result.get("recommendations", [])[:3])
        if not advice:
            advice = "Continue tracking expenses to identify spending patterns and optimize your budget."
        
        # Convert forecast items to response format
        from app.schemas.ai import ForecastItem
        forecast_items = [
            ForecastItem(month=item["month"], predicted_spend=item["predicted_spend"])
            for item in forecast_result.get("monthly_forecast", [])
        ]
        
        return BudgetAdviceResponse(advice=advice, forecast=forecast_items)
    except Exception as e:
        # Convert service exceptions to HTTP errors
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
    
    Validates names against business rules:
    - Length: 1-20 characters
    - Character set: alphanumeric plus spaces, hyphens, apostrophes
    - Content: filters offensive/inappropriate words
    - Must contain at least one letter
    
    Generates creative name suggestions using AI when validation passes or fails.
    Provides fallback suggestions if AI is unavailable.
    
    Authentication: Not required (public endpoint for pet naming)
    
    Args:
        payload: Pet name suggestion request with input_name
        
    Returns:
        PetNameSuggestionResponse with validation result and 5 name suggestions
        
    Raises:
        500: If AI service fails (fallback suggestions still returned)
    """
    ai_service = get_unified_ai_service()
    try:
        result = await ai_service.validate_and_suggest_name(
            input_name=payload.input_name,
            pet_species=None,
        )
        return PetNameSuggestionResponse(
            valid=result["valid"],
            suggestions=result["suggestions"][:5],
        )
    except Exception as e:
        # Service should handle fallbacks internally, but catch unexpected errors
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
    
    Uses AI to analyze historical pet interactions and predict:
    - Mood forecasts: predicted emotional states for upcoming periods
    - Activity predictions: likely care needs and interaction patterns
    
    Helpful for proactive pet care planning and understanding pet behavior trends.
    
    Authentication: Required (Bearer token)
    
    Security: Validates that pet belongs to authenticated user before analysis.
    
    Args:
        payload: Behavior analysis request with pet_id and interaction_history
        current_user: Authenticated user (injected via dependency)
        pet_service: Pet service for validation (injected via dependency)
        
    Returns:
        PetBehaviorResponse with mood forecasts and activity predictions
        
    Raises:
        404: If pet not found for current user
        403: If attempting to analyze another user's pet
        500: If AI analysis fails
    """
    # Security check: verify pet exists and belongs to user
    pet = await pet_service.get_pet(current_user.id)
    if pet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pet not found",
        )
    
    # Additional security: ensure pet_id in request matches user's pet
    if payload.pet_id != str(pet.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access behavior analysis for another user's pet",
        )

    ai_service = get_unified_ai_service()
    try:
        # Convert interaction history to format expected by prediction model
        interaction_history = []
        for item in payload.interaction_history:
            interaction_history.append({
                "action": item.action,
                "timestamp": item.timestamp,
                "pet_stats_before": item.pet_stats_before,
                "pet_stats_after": item.pet_stats_after,
            })
        
        # Get current pet stats for context
        current_stats = {
            "hunger": pet.stats.hunger,
            "happiness": pet.stats.happiness if hasattr(pet.stats, "happiness") else 70,
            "energy": pet.stats.energy,
            "cleanliness": pet.stats.hygiene,
            "health": pet.stats.health,
        }
        
        # Generate behavior predictions
        result = await ai_service.predict_behavior(
            pet_id=payload.pet_id,
            interaction_history=interaction_history,
            forecast_days=7,
            current_stats=current_stats,
        )
        
        return PetBehaviorResponse(
            mood_forecast=result.get("mood_forecast", [])[:10],
            activity_prediction=result.get("activity_prediction", [])[:10],
        )
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
    
    Parses natural language pet care commands (e.g., "feed my pet", "play with Fluffy")
    and returns structured action data. Supports multi-turn conversations with
    session-based context tracking.
    
    Uses OpenAI API for advanced NLP understanding with intelligent fallback to
    rule-based pattern matching if AI is unavailable.
    
    Supported actions: feed, play, bathe, rest, status, shop, budget
    
    Authentication: Required (Bearer token)
    
    Request body format:
    {
        "command": "feed my pet",  // Required: natural language command
        "user_id": "user-id",      // Optional: defaults to authenticated user
        "session_id": "optional-session-id",  // Optional: for conversation continuity
        "pet_context": {...}       // Optional: pet state context (auto-fetched if missing)
    }
    
    Args:
        payload: Dict with command and optional context fields
        current_user: Authenticated user (injected via dependency)
        pet_service: Pet service for retrieving pet context (injected via dependency)
        
    Returns:
        Dict with parsed action, confidence score, intent, and suggestions
        
    Raises:
        400: If command is missing or invalid
        403: If attempting to process commands for another user
        404: If pet not found (when fetching context)
        500: If NLP processing fails
    """
    command = payload.get("command")
    user_id = payload.get("user_id", current_user.id)  # Default to authenticated user
    session_id = payload.get("session_id")
    pet_context = payload.get("pet_context")
    
    # Validation: command is required
    if not command:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Command is required",
        )
    
    # Security: ensure user can only process commands for themselves
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot process commands for another user",
        )
    
    # Auto-fetch pet context if not provided in request
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
    
    ai_service = get_unified_ai_service()
    try:
        result = await ai_service.process_nlp_command(
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


@router.post("/pet_mood_forecast", response_model=PetMoodForecastResponse, summary="Generate pet mood forecast")
async def get_pet_mood_forecast(
    payload: PetMoodForecastRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
) -> PetMoodForecastResponse:
    """
    Generate AI-powered mood forecast for a pet based on current stats and interaction history.
    
    Uses OpenAI API to predict future mood states with confidence scores and reasoning.
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
            detail="Cannot access mood forecast for another user's pet",
        )

    service = PetMoodForecastService()
    try:
        forecast = await service.forecast_mood(
            pet_id=payload.pet_id,
            current_stats=payload.current_stats,
            interaction_history=payload.interaction_history,
            forecast_days=payload.forecast_days,
        )
        return PetMoodForecastResponse(forecast=forecast)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate mood forecast: {str(e)}",
        )


@router.post("/habit_prediction", response_model=HabitPredictionResponse, summary="Predict user habits")
async def predict_user_habits(
    payload: HabitPredictionRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> HabitPredictionResponse:
    """
    Predict user pet care habits based on interaction patterns and history.
    
    Uses OpenAI API to analyze behavioral patterns and predict future care routines.
    """
    # Verify user_id matches authenticated user
    if payload.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot access habit predictions for another user",
        )

    service = HabitPredictionService()
    try:
        predictions = await service.predict_habits(
            user_id=payload.user_id,
            interaction_history=payload.interaction_history,
            pet_stats_history=payload.pet_stats_history,
            forecast_days=payload.forecast_days,
        )
        return HabitPredictionResponse(**predictions)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict habits: {str(e)}",
        )


@router.post("/finance_simulator/scenario", response_model=FinanceScenarioResponse, summary="Generate financial scenario")
async def generate_finance_scenario(
    payload: FinanceScenarioRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> FinanceScenarioResponse:
    """
    Generate an interactive financial literacy scenario.
    
    Creates educational scenarios for loans, investments, budgeting, or savings decisions.
    Uses OpenAI API to generate realistic, personalized scenarios.
    """
    service = FinanceSimulatorService()
    try:
        scenario = await service.generate_scenario(
            scenario_type=payload.scenario_type,
            user_context=payload.user_context,
        )
        return FinanceScenarioResponse(**scenario)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate scenario: {str(e)}",
        )


@router.post("/finance_simulator/evaluate", response_model=DecisionEvaluationResponse, summary="Evaluate financial decision")
async def evaluate_finance_decision(
    payload: DecisionEvaluationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> DecisionEvaluationResponse:
    """
    Evaluate a user's financial decision in a scenario.
    
    Provides AI-powered feedback, learning outcomes, and recommendations.
    """
    service = FinanceSimulatorService()
    try:
        evaluation = await service.evaluate_decision(
            scenario_id=payload.scenario_id,
            user_decision={"selected_option_id": payload.selected_option_id},
            scenario_context=payload.scenario_context,
        )
        return DecisionEvaluationResponse(**evaluation)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate decision: {str(e)}",
        )
