"""
Budget Advisor AI API endpoints.

This module provides the REST API endpoint for budget analysis and recommendations.
Handles transaction data analysis, trend detection, and overspending alerts.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.budget_advisor import BudgetAdvisorRequest, BudgetAdvisorResponse
from app.services.budget_advisor_service import BudgetAdvisorService

# Configure logger for this module
LOGGER = logging.getLogger(__name__)

router = APIRouter(prefix="/api/budget-advisor", tags=["Budget Advisor"])


@router.post(
    "/analyze",
    response_model=BudgetAdvisorResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze transaction data and get budget insights",
    description=(
        "Accepts user transaction data (amount, category, date) and analyzes spending patterns, "
        "detects trends, identifies overspending, and generates actionable recommendations. "
        "Handles edge cases including empty input, missing categories, and invalid data."
    ),
)
async def analyze_budget(
    request: BudgetAdvisorRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> BudgetAdvisorResponse:
    """
    Analyze transaction data and provide budget insights.

    This endpoint:
    - Validates transaction input data
    - Analyzes spending trends by category
    - Detects overspending patterns
    - Generates actionable recommendations
    - Handles edge cases gracefully

    Args:
        request: Budget advisor request containing transactions and optional budget
        session: Database session (for future use with user-specific data)
        user_id: Authenticated user ID (optional, for future personalization)

    Returns:
        BudgetAdvisorResponse: Standardized response with status, data, and message

    Raises:
        HTTPException: 400 if request validation fails, 500 for server errors
    """
    # Log request details
    LOGGER.info(
        f"Budget analysis request received - User: {user_id}, "
        f"Transactions: {len(request.transactions)}, "
        f"Monthly Budget: {request.monthly_budget or 'not provided'}"
    )

    try:
        # Note: If no transactions provided, service will attempt to fetch from database
        # Validate transaction data only if transactions are provided
        if request.transactions:
            invalid_transactions = []
            for idx, transaction in enumerate(request.transactions):
                # Check for missing required fields (Pydantic handles this, but we log it)
                if not transaction.category or not transaction.category.strip():
                    invalid_transactions.append(f"Transaction {idx + 1}: missing category")
                if transaction.amount <= 0:
                    invalid_transactions.append(f"Transaction {idx + 1}: amount must be positive")

            if invalid_transactions:
                LOGGER.warning(f"Invalid transactions detected: {invalid_transactions}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid transaction data: {', '.join(invalid_transactions)}",
                )

        # Perform analysis with database session and user_id
        # Service will fetch from database if no transactions provided
        LOGGER.debug("Starting budget analysis with database session")
        try:
            analysis = await BudgetAdvisorService.analyze_budget(
                request, session=session, user_id=user_id
            )
        except ValueError as ve:
            # Handle case where no transactions are available
            if "No transactions" in str(ve):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=str(ve),
                ) from ve
            raise

        # Log analysis results
        LOGGER.info(
            f"Budget analysis complete - Total Spending: ${analysis.total_spending:.2f}, "
            f"Trends: {len(analysis.trends)}, Alerts: {len(analysis.overspending_alerts)}, "
            f"Suggestions: {len(analysis.suggestions)}"
        )

        # Return success response
        return BudgetAdvisorResponse(
            status="success",
            data=analysis,
            message="Budget analysis completed successfully",
        )

    except HTTPException:
        # Re-raise HTTP exceptions (validation errors)
        raise

    except ValueError as e:
        # Handle value errors from service
        LOGGER.error(f"Value error during budget analysis: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid request data: {str(e)}",
        ) from e

    except Exception as e:
        # Handle unexpected errors
        LOGGER.error(f"Unexpected error during budget analysis: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing your request. Please try again later.",
        ) from e


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check for budget advisor service",
)
async def health_check() -> dict:
    """
    Health check endpoint for budget advisor service.

    Returns:
        dict: Health status
    """
    LOGGER.debug("Budget advisor health check requested")
    return {
        "status": "healthy",
        "service": "budget-advisor",
        "message": "Budget advisor service is operational",
    }

