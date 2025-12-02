"""Habit prediction API endpoints."""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

from app.core.jwt import get_current_user_id
from app.services.habit_prediction import HabitPredictionService

router = APIRouter(prefix="/habits", tags=["Habits"])

habit_service = HabitPredictionService()


@router.post("/predict")
async def predict_habits(
    interaction_history: List[Dict[str, Any]] = Body(default=[], description="User interaction history"),
    pet_stats_history: List[Dict[str, Any]] = Body(default=[], description="Historical pet statistics"),
    forecast_days: int = Body(default=14, ge=1, le=30, description="Number of days to forecast"),
    user_id: str = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """
    Predict user habits based on interaction patterns and pet care history.
    
    Args:
        interaction_history: List of user interactions with pet
        pet_stats_history: Historical pet statistics
        forecast_days: Number of days to forecast habits (default: 14)
    
    Returns:
        Dictionary with predicted habits, patterns, and recommendations
    """
    try:
        # Get predictions
        predictions = await habit_service.predict_habits(
            user_id=user_id,
            interaction_history=interaction_history,
            pet_stats_history=pet_stats_history,
            forecast_days=forecast_days,
        )
        
        return predictions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict habits: {str(e)}"
        ) from e
