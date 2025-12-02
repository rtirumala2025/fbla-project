"""Schemas for AI-related API endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ============================================================================
# Unified AI Response Base Schema
# ============================================================================

class BaseAIResponse(BaseModel):
    """
    Base schema for all AI responses with consistent structure.
    
    All AI endpoints should extend this base to ensure:
    - Consistent metadata (generated_at, session_id when applicable)
    - Standardized error handling
    - Unified formatting across all AI features
    """
    
    generated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp when the AI response was generated"
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Session identifier for conversation continuity (when applicable)",
        max_length=128
    )


# ============================================================================
# AI Chat Schemas
# ============================================================================

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


class AIChatResponse(BaseAIResponse):
    """LLM-backed response payload with standardized structure."""

    session_id: str = Field(description="Resolved session identifier managed by MCP.")
    message: str = Field(description="Assistant response surfaced to the UI.")
    mood: Optional[str] = Field(
        default=None,
        description="Assistant-evaluated mood label (ecstatic, happy, content, anxious, distressed).",
    )
    notifications: List[str] = Field(
        default_factory=list,
        description="Actionable tips, reminders, or alerts for the user"
    )
    pet_state: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Derived pet state snapshot for dashboard visualisations.",
    )
    health_forecast: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Predictive health analytics generated for upcoming interactions.",
    )


# ============================================================================
# Budget Advisor Schemas
# ============================================================================

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


class SpendingTrend(BaseModel):
    """Spending trend for a category."""

    category: str = Field(..., description="Category name")
    total_spent: float = Field(..., description="Total amount spent in this category")
    transaction_count: int = Field(..., description="Number of transactions")
    average_amount: float = Field(..., description="Average transaction amount")
    trend: str = Field(..., description="Trend direction (increasing, decreasing, stable)")
    percentage_change: Optional[float] = Field(default=None, description="Percentage change from previous period")


class OverspendingAlert(BaseModel):
    """Alert for overspending in a category or overall budget."""

    category: str = Field(..., description="Category or 'Overall Budget'")
    current_spending: float = Field(..., description="Current spending amount")
    budget_limit: float = Field(..., description="Budget limit for this category/period")
    excess_amount: float = Field(..., description="Amount over budget")
    severity: str = Field(..., description="Severity level (low, medium, high)")
    recommendation: str = Field(..., description="Recommendation to address overspending")


class BudgetAdvisorAnalysis(BaseModel):
    """Complete budget analysis matching frontend schema expectations."""

    total_spending: float = Field(..., description="Total spending amount")
    total_income: float = Field(..., description="Total income amount")
    net_balance: float = Field(..., description="Net balance (income - spending)")
    average_daily_spending: float = Field(..., description="Average daily spending")
    top_categories: List[str] = Field(..., description="Top spending categories")
    trends: List[SpendingTrend] = Field(default_factory=list, description="Spending trends by category")
    overspending_alerts: List[OverspendingAlert] = Field(default_factory=list, description="Overspending alerts")
    suggestions: List[str] = Field(default_factory=list, description="AI-generated budget suggestions")
    analysis_period: Dict[str, str] = Field(..., description="Analysis period with start and end dates")
    forecast: List[ForecastItem] = Field(default_factory=list, description="Monthly spending forecast")


class BudgetAdviceResponse(BaseAIResponse):
    """Response payload for budget advice endpoint with standardized structure."""

    advice: str = Field(..., description="Personalized budget advice from AI")
    forecast: List[ForecastItem] = Field(..., description="Monthly spending forecast")


class BudgetAdvisorResponse(BaseAIResponse):
    """Unified budget advisor response matching frontend schema expectations."""

    total_spending: float = Field(..., description="Total spending amount")
    total_income: float = Field(..., description="Total income amount")
    net_balance: float = Field(..., description="Net balance (income - spending)")
    average_daily_spending: float = Field(..., description="Average daily spending")
    top_categories: List[str] = Field(..., description="Top spending categories")
    trends: List[SpendingTrend] = Field(default_factory=list, description="Spending trends by category")
    overspending_alerts: List[OverspendingAlert] = Field(default_factory=list, description="Overspending alerts")
    suggestions: List[str] = Field(default_factory=list, description="AI-generated budget suggestions")
    analysis_period: Dict[str, str] = Field(..., description="Analysis period with start and end dates")
    forecast: List[ForecastItem] = Field(default_factory=list, description="Monthly spending forecast")


# ============================================================================
# Pet Name Validator Schemas
# ============================================================================

class PetNameSuggestionRequest(BaseModel):
    """Request payload for pet name validation and suggestions."""

    input_name: str = Field(..., min_length=1, max_length=50, description="Pet name to validate")


class PetNameSuggestionResponse(BaseAIResponse):
    """Response payload for pet name validation with standardized structure."""

    valid: bool = Field(..., description="Whether the input name is valid")
    suggestions: List[str] = Field(..., min_length=0, max_length=5, description="List of alternative name suggestions")


# ============================================================================
# Pet Behavior Analysis Schemas
# ============================================================================

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


class PetBehaviorResponse(BaseAIResponse):
    """Response payload for pet behavior analysis with standardized structure."""

    mood_forecast: List[str] = Field(..., description="Predicted mood states for upcoming period")
    activity_prediction: List[str] = Field(..., description="Predicted activity patterns")


# ============================================================================
# Pet Mood Forecast Schemas
# ============================================================================

class PetMoodForecastRequest(BaseModel):
    """Request payload for pet mood forecast."""

    pet_id: str = Field(..., description="Pet ID for forecast")
    current_stats: Dict[str, Any] = Field(..., description="Current pet statistics")
    interaction_history: List[Dict[str, Any]] = Field(default_factory=list, description="Recent interaction history")
    forecast_days: int = Field(default=7, ge=1, le=30, description="Number of days to forecast")


class MoodForecastEntry(BaseModel):
    """Single mood forecast entry."""

    date: str = Field(..., description="Forecast date in YYYY-MM-DD format")
    predicted_mood: str = Field(..., description="Predicted mood state")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score (0.0-1.0)")
    reasoning: str = Field(..., description="Brief explanation for the prediction")


class PetMoodForecastResponse(BaseAIResponse):
    """Response payload for pet mood forecast with standardized structure."""

    forecast: List[MoodForecastEntry] = Field(..., description="Mood forecast entries")


# ============================================================================
# Habit Prediction Schemas
# ============================================================================

class HabitPredictionRequest(BaseModel):
    """Request payload for habit prediction."""

    user_id: str = Field(..., description="User ID for prediction")
    interaction_history: List[Dict[str, Any]] = Field(default_factory=list, description="User interaction history")
    pet_stats_history: List[Dict[str, Any]] = Field(default_factory=list, description="Historical pet statistics")
    forecast_days: int = Field(default=14, ge=1, le=60, description="Number of days to forecast")


class PredictedHabit(BaseModel):
    """Predicted user habit."""

    habit_type: str = Field(..., description="Type of habit (feeding, playing, cleaning, etc.)")
    frequency: str = Field(..., description="Predicted frequency (daily, every_other_day, weekly, irregular)")
    likely_times: List[str] = Field(..., description="Likely times of day for this habit")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score")
    description: str = Field(..., description="Description of the predicted habit")


class HabitPredictionResponse(BaseAIResponse):
    """Response payload for habit prediction with standardized structure."""

    predicted_habits: List[PredictedHabit] = Field(..., description="List of predicted habits")
    patterns_identified: List[str] = Field(..., description="Identified behavioral patterns")
    recommendations: List[str] = Field(..., description="Recommendations based on patterns")
    forecast_summary: str = Field(..., description="Summary of predicted care patterns")


# ============================================================================
# Finance Simulator Schemas
# ============================================================================

class FinanceScenarioRequest(BaseModel):
    """Request payload for generating a financial scenario."""

    scenario_type: str = Field(..., description="Type of scenario (loan, investment, budgeting, savings)")
    user_context: Optional[Dict[str, Any]] = Field(default=None, description="Optional user financial context")


class FinancialImpact(BaseModel):
    """Financial impact of an option."""

    income_change: float = Field(default=0.0, description="Change in income")
    expense_change: float = Field(default=0.0, description="Change in expenses")
    savings_change: float = Field(default=0.0, description="Change in savings")
    debt_change: float = Field(default=0.0, description="Change in debt")


class ScenarioOption(BaseModel):
    """Option in a financial scenario."""

    option_id: str = Field(..., description="Unique option identifier")
    label: str = Field(..., description="Option label")
    description: str = Field(..., description="What this option entails")
    financial_impact: FinancialImpact = Field(..., description="Financial impact of this option")
    risk_level: str = Field(..., description="Risk level (low, medium, high)")
    time_horizon: str = Field(..., description="Time horizon (short, medium, long)")


class FinanceScenarioResponse(BaseAIResponse):
    """Response payload for financial scenario with standardized structure."""

    scenario_id: str = Field(..., description="Unique scenario identifier")
    title: str = Field(..., description="Scenario title")
    description: str = Field(..., description="Detailed scenario description")
    scenario_type: str = Field(..., description="Type of scenario")
    initial_situation: Dict[str, float] = Field(..., description="Initial financial situation")
    options: List[ScenarioOption] = Field(..., description="Available options")
    learning_objectives: List[str] = Field(..., description="Learning objectives")
    concepts_covered: List[str] = Field(..., description="Financial concepts covered")


class DecisionEvaluationRequest(BaseModel):
    """Request payload for evaluating a financial decision."""

    scenario_id: str = Field(..., description="Scenario identifier")
    selected_option_id: str = Field(..., description="User's selected option")
    scenario_context: Dict[str, Any] = Field(..., description="Original scenario context")


class DecisionEvaluationResponse(BaseAIResponse):
    """Response payload for decision evaluation with standardized structure."""

    evaluation_score: float = Field(..., ge=0.0, le=1.0, description="Evaluation score (0.0-1.0)")
    immediate_impact: Dict[str, str] = Field(..., description="Immediate financial impact")
    long_term_consequences: List[str] = Field(..., description="Long-term consequences")
    lessons_learned: List[str] = Field(..., description="Lessons learned")
    feedback: str = Field(..., description="Detailed feedback")
    alternative_perspectives: List[str] = Field(..., description="Alternative perspectives")
    recommendations: List[str] = Field(..., description="Recommendations")
    overall_assessment: str = Field(..., description="Overall assessment")
    scenario_id: str = Field(..., description="Scenario identifier")
