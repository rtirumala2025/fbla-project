"""Schemas for AI-related API endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AIChatRequest(BaseModel):
    """Incoming payload for conversational AI chat."""

    session_id: Optional[str] = Field(
        default=None,
        description="Opaque client-provided identifier for caching context.",
        max_length=128,
    )
    message: str = Field(..., min_length=1, max_length=1500)
    model: Optional[str] = Field(
        default=None,
        description="Override for the default OpenRouter model.",
        max_length=128,
    )


class AIChatResponse(BaseModel):
    """LLM-backed response payload."""

    session_id: str = Field(description="Resolved session identifier managed by MCP.")
    message: str = Field(description="Assistant response surfaced to the UI.")
    mood: Optional[str] = Field(
        default=None,
        description="Assistant-evaluated mood label (ecstatic, happy, content, anxious, distressed).",
    )
    notifications: List[str] = Field(default_factory=list)
    pet_state: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Derived pet state snapshot for dashboard visualisations.",
    )
    health_forecast: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Predictive health analytics generated for upcoming interactions.",
    )
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# Budget Advisor Schemas
class TransactionHistoryItem(BaseModel):
    """Individual transaction entry for budget analysis."""

    amount: float = Field(..., description="Transaction amount (positive for income, negative for expenses)")
    category: str = Field(..., description="Transaction category", max_length=50)
    date: str = Field(..., description="Transaction date in ISO format (YYYY-MM-DD)")
    description: Optional[str] = Field(default=None, description="Optional transaction description", max_length=255)


class BudgetAdviceRequest(BaseModel):
    """Request payload for budget advice endpoint."""

    user_id: str = Field(..., description="User ID for personalization")
    transaction_history: List[TransactionHistoryItem] = Field(..., description="List of transactions to analyze")


class ForecastItem(BaseModel):
    """Monthly spending forecast."""

    month: str = Field(..., description="Month identifier (YYYY-MM format)")
    predicted_spend: float = Field(..., description="Predicted spending amount for the month")


class BudgetAdviceResponse(BaseModel):
    """Response payload for budget advice endpoint."""

    advice: str = Field(..., description="Personalized budget advice from AI")
    forecast: List[ForecastItem] = Field(..., description="Monthly spending forecast")


# Pet Name Validator Schemas
class PetNameSuggestionRequest(BaseModel):
    """Request payload for pet name validation and suggestions."""

    input_name: str = Field(..., min_length=1, max_length=50, description="Pet name to validate")


class PetNameSuggestionResponse(BaseModel):
    """Response payload for pet name validation."""

    valid: bool = Field(..., description="Whether the input name is valid")
    suggestions: List[str] = Field(..., min_items=0, max_items=5, description="List of alternative name suggestions")


# Pet Behavior Analysis Schemas
class InteractionHistoryItem(BaseModel):
    """Individual interaction entry for behavior analysis."""

    action: str = Field(..., description="Action type (feed, play, bathe, rest, etc.)")
    timestamp: str = Field(..., description="Interaction timestamp in ISO format")
    pet_stats_before: Optional[Dict[str, Any]] = Field(default=None, description="Pet stats before interaction")
    pet_stats_after: Optional[Dict[str, Any]] = Field(default=None, description="Pet stats after interaction")


class PetBehaviorRequest(BaseModel):
    """Request payload for pet behavior analysis."""

    pet_id: str = Field(..., description="Pet ID for analysis")
    interaction_history: List[InteractionHistoryItem] = Field(..., description="List of pet interactions")


class PetBehaviorResponse(BaseModel):
    """Response payload for pet behavior analysis."""

    mood_forecast: List[str] = Field(..., description="Predicted mood states for upcoming period")
    activity_prediction: List[str] = Field(..., description="Predicted activity patterns")
