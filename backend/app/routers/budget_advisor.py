"""Budget advisor API endpoints."""
from __future__ import annotations

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.jwt import get_current_user_id
from app.services.budget_ai_service import BudgetAIService
from app.schemas.ai import BudgetAdviceRequest, BudgetAdviceResponse, TransactionHistoryItem

router = APIRouter(prefix="/api/budget-advisor", tags=["Budget Advisor"])


class BudgetAdvisorRequest(BaseModel):
    """Request payload for budget advisor analysis."""
    
    transactions: List[Dict[str, Any]] = Field(..., description="List of transactions to analyze")
    monthly_budget: Optional[float] = Field(default=None, description="Optional monthly budget limit")
    user_id: Optional[str] = Field(default=None, description="User ID for personalization")


class BudgetAdvisorResponse(BaseModel):
    """Response payload for budget advisor analysis."""
    
    status: str = Field(..., description="Response status: 'success' or 'error'")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Analysis data")
    message: str = Field(..., description="Response message")


@router.post("/analyze", response_model=BudgetAdvisorResponse)
async def analyze_budget(
    payload: BudgetAdvisorRequest,
    user_id: str = Depends(get_current_user_id),
) -> BudgetAdvisorResponse:
    """
    Analyze budget and provide AI-powered recommendations.
    
    This endpoint analyzes transaction history to provide:
    - Spending patterns and trends
    - Overspending alerts
    - Budget recommendations
    - Financial insights
    
    Authentication: Required (Bearer token)
    
    Args:
        payload: Budget advisor request with transactions and optional budget
        user_id: Authenticated user ID (injected via dependency)
        
    Returns:
        BudgetAdvisorResponse with analysis data, trends, alerts, and suggestions
        
    Raises:
        400: If transactions list is empty or invalid
        500: If analysis fails
    """
    # Use authenticated user_id if not provided in payload
    effective_user_id = payload.user_id or user_id
    
    # Validate transactions
    if not payload.transactions or len(payload.transactions) == 0:
        return BudgetAdvisorResponse(
            status="error",
            data=None,
            message="No transactions provided for analysis",
        )
    
    try:
        # Convert transactions to TransactionHistoryItem format
        transaction_history: List[TransactionHistoryItem] = []
        for txn in payload.transactions:
            # Handle both dict and object formats
            if isinstance(txn, dict):
                amount = txn.get("amount", 0)
                category = txn.get("category", "uncategorized")
                date = txn.get("date", "")
                description = txn.get("description")
            else:
                amount = getattr(txn, "amount", 0)
                category = getattr(txn, "category", "uncategorized")
                date = getattr(txn, "date", "")
                description = getattr(txn, "description", None)
            
            transaction_history.append(
                TransactionHistoryItem(
                    amount=float(amount),
                    category=str(category),
                    date=str(date),
                    description=description,
                )
            )
        
        # Create budget advice request
        budget_request = BudgetAdviceRequest(
            user_id=effective_user_id,
            transaction_history=transaction_history,
        )
        
        # Get budget advice from service
        service = BudgetAIService()
        advice_response: BudgetAdviceResponse = await service.get_budget_advice(budget_request)
        
        # Calculate additional analysis metrics
        total_spending = sum(abs(t.amount) for t in transaction_history if t.amount < 0)
        total_income = sum(t.amount for t in transaction_history if t.amount > 0)
        net_balance = total_income - total_spending
        
        # Calculate average daily spending
        if transaction_history:
            dates = [t.date for t in transaction_history]
            unique_days = len(set(dates))
            average_daily_spending = total_spending / unique_days if unique_days > 0 else 0
        else:
            average_daily_spending = 0
        
        # Calculate top categories
        category_totals: Dict[str, float] = {}
        for t in transaction_history:
            if t.amount < 0:  # Only expenses
                category_totals[t.category] = category_totals.get(t.category, 0) + abs(t.amount)
        
        top_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)[:5]
        top_category_names = [cat for cat, _ in top_categories]
        
        # Generate trends (simplified - in production, calculate actual trends)
        trends: List[Dict[str, Any]] = []
        for category, total in top_categories:
            trends.append({
                "category": category,
                "total_spent": total,
                "transaction_count": sum(1 for t in transaction_history if t.category == category and t.amount < 0),
                "average_amount": total / max(1, sum(1 for t in transaction_history if t.category == category and t.amount < 0)),
                "trend": "stable",  # Simplified - would calculate actual trend
                "percentage_change": None,
            })
        
        # Generate overspending alerts
        overspending_alerts: List[Dict[str, Any]] = []
        if payload.monthly_budget:
            if total_spending > payload.monthly_budget:
                excess = total_spending - payload.monthly_budget
                severity = "high" if excess > payload.monthly_budget * 0.2 else "medium"
                overspending_alerts.append({
                    "category": "Overall Budget",
                    "current_spending": total_spending,
                    "budget_limit": payload.monthly_budget,
                    "excess_amount": excess,
                    "severity": severity,
                    "recommendation": f"You've exceeded your monthly budget by ${excess:.2f}. Consider reducing spending in top categories.",
                })
        
        # Extract suggestions from AI advice
        suggestions = advice_response.advice.split(". ") if advice_response.advice else []
        suggestions = [s.strip() for s in suggestions if s.strip()]
        
        # Build analysis data
        analysis_data = {
            "total_spending": total_spending,
            "total_income": total_income,
            "net_balance": net_balance,
            "average_daily_spending": average_daily_spending,
            "top_categories": top_category_names,
            "trends": trends,
            "overspending_alerts": overspending_alerts,
            "suggestions": suggestions,
            "analysis_period": {
                "start": min(t.date for t in transaction_history) if transaction_history else "",
                "end": max(t.date for t in transaction_history) if transaction_history else "",
            },
            "forecast": [{"month": f.month, "predicted_spend": f.predicted_spend} for f in advice_response.forecast],
        }
        
        return BudgetAdvisorResponse(
            status="success",
            data=analysis_data,
            message="Budget analysis completed successfully",
        )
        
    except Exception as e:
        # Log error and return error response
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Budget analysis failed: {str(e)}", exc_info=True)
        
        return BudgetAdvisorResponse(
            status="error",
            data=None,
            message=f"Failed to analyze budget: {str(e)}",
        )
