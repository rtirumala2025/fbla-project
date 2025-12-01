"""Habit prediction API endpoints."""

from __future__ import annotations

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.services.habit_prediction import HabitPredictionService
from app.services.pet_service import get_pet_by_user_id
from app.services.profile_service import get_user_interaction_history

router = APIRouter(prefix="/api/habits", tags=["Habits"])

habit_service = HabitPredictionService()


@router.get("/predict")
async def predict_habits(
    forecast_days: int = Query(default=14, ge=1, le=30),
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """
    Predict user habits based on interaction patterns and pet care history.
    
    Returns:
        Dictionary with predicted habits, patterns, and recommendations
    """
    try:
        # Get user's pet
        pet = await get_pet_by_user_id(session, user_id)
        if not pet:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Pet not found for user"
            )
        
        # Get interaction history
        interaction_history = await get_user_interaction_history(session, user_id)
        
        # Get pet stats history (simplified - in production would query historical stats)
        pet_stats_history = [
            {
                "timestamp": pet.updated_at.isoformat() if hasattr(pet, 'updated_at') else "",
                "hunger": getattr(pet, 'hunger', 50),
                "happiness": getattr(pet, 'happiness', 50),
                "health": getattr(pet, 'health', 50),
                "energy": getattr(pet, 'energy', 50),
            }
        ]
        
        # Convert interaction history to expected format
        formatted_interactions: List[Dict[str, Any]] = []
        for interaction in interaction_history:
            formatted_interactions.append({
                "timestamp": interaction.get("timestamp", ""),
                "action": interaction.get("action", "unknown"),
                "pet_id": str(pet.id),
            })
        
        # Get predictions
        predictions = await habit_service.predict_habits(
            user_id=user_id,
            interaction_history=formatted_interactions,
            pet_stats_history=pet_stats_history,
            forecast_days=forecast_days,
        )
        
        return predictions
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to predict habits: {str(e)}"
        ) from e
