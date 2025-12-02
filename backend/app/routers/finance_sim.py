"""Financial literacy simulator API endpoints."""

from __future__ import annotations

from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

from app.core.jwt import get_current_user_id
from app.services.finance_simulator import FinanceSimulatorService

router = APIRouter(prefix="/finance-sim", tags=["Finance Simulator"])

finance_sim_service = FinanceSimulatorService()


@router.post("/scenario")
async def generate_scenario(
    scenario_type: str = Body(..., description="Type of scenario: loan, investment, budgeting, savings"),
    user_context: Optional[Dict[str, Any]] = Body(default=None, description="Optional user financial context"),
    user_id: str = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """
    Generate an interactive financial literacy scenario.
    
    Args:
        scenario_type: Type of scenario (loan, investment, budgeting, savings)
        user_context: Optional user financial context for personalization
    
    Returns:
        Dictionary with scenario details, questions, and expected outcomes
    """
    valid_types = ["loan", "investment", "budgeting", "savings"]
    if scenario_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid scenario type. Must be one of: {', '.join(valid_types)}"
        )
    
    try:
        scenario = await finance_sim_service.generate_scenario(
            scenario_type=scenario_type,
            user_context=user_context,
        )
        return scenario
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate scenario: {str(e)}"
        ) from e


@router.post("/evaluate")
async def evaluate_decision(
    scenario_id: str = Body(..., description="Scenario identifier"),
    user_decision: Dict[str, Any] = Body(..., description="User's decision/choices"),
    scenario_context: Dict[str, Any] = Body(..., description="Original scenario context"),
    user_id: str = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """
    Evaluate a user's financial decision in a scenario.
    
    Args:
        scenario_id: Scenario identifier
        user_decision: User's decision/choices
        scenario_context: Original scenario context
    
    Returns:
        Dictionary with evaluation, feedback, and learning outcomes
    """
    try:
        evaluation = await finance_sim_service.evaluate_decision(
            scenario_id=scenario_id,
            user_decision=user_decision,
            scenario_context=scenario_context,
        )
        return evaluation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to evaluate decision: {str(e)}"
        ) from e


@router.get("/scenarios")
async def list_scenario_types(
    _: str = Depends(get_current_user_id),
) -> Dict[str, Any]:
    """
    List available scenario types and their descriptions.
    """
    return {
        "scenario_types": [
            {
                "id": "loan",
                "name": "Loan Decisions",
                "description": "Learn about student loans, car loans, and personal loans",
            },
            {
                "id": "investment",
                "name": "Investment Planning",
                "description": "Explore stocks, savings accounts, and retirement planning",
            },
            {
                "id": "budgeting",
                "name": "Budget Management",
                "description": "Practice monthly budget planning and expense management",
            },
            {
                "id": "savings",
                "name": "Savings Strategies",
                "description": "Learn about emergency funds, goal-based savings, and compound interest",
            },
        ]
    }
