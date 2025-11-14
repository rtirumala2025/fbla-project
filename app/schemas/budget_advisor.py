"""
Pydantic schemas for Budget Advisor AI endpoints.

This module defines the request and response models for the budget advisor feature,
which analyzes transaction data to detect spending trends and provide actionable suggestions.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, validator


class TransactionInput(BaseModel):
    """
    Individual transaction input model.

    Attributes:
        amount: Transaction amount (positive for expenses, negative for income)
        category: Transaction category (e.g., "food", "transport", "entertainment")
        date: Transaction date in ISO format (YYYY-MM-DD)
        description: Optional transaction description
    """

    amount: float = Field(..., description="Transaction amount", gt=0)
    category: str = Field(..., min_length=1, max_length=100, description="Transaction category")
    date: date = Field(..., description="Transaction date")
    description: Optional[str] = Field(default=None, max_length=500, description="Optional transaction description")

    @validator("category")
    def validate_category(cls, value: str) -> str:
        """Normalize category to lowercase and strip whitespace."""
        return value.strip().lower() if value else value


class BudgetAdvisorRequest(BaseModel):
    """
    Request model for budget advisor analysis.

    Attributes:
        transactions: List of transaction data to analyze
        monthly_budget: Optional monthly budget limit for comparison
        user_id: Optional user identifier for personalized recommendations
    """

    transactions: List[TransactionInput] = Field(..., min_items=1, description="List of transactions to analyze")
    monthly_budget: Optional[float] = Field(default=None, ge=0, description="Optional monthly budget limit")
    user_id: Optional[str] = Field(default=None, max_length=128, description="Optional user identifier")

    @validator("transactions")
    def validate_transactions_not_empty(cls, value: List[TransactionInput]) -> List[TransactionInput]:
        """Ensure at least one transaction is provided."""
        if not value:
            raise ValueError("At least one transaction is required for analysis.")
        return value


class SpendingTrend(BaseModel):
    """
    Spending trend analysis result.

    Attributes:
        category: Category name
        total_spent: Total amount spent in this category
        transaction_count: Number of transactions
        average_amount: Average transaction amount
        trend: Trend direction ("increasing", "decreasing", "stable")
        percentage_change: Percentage change from previous period (if applicable)
    """

    category: str
    total_spent: float
    transaction_count: int
    average_amount: float
    trend: Literal["increasing", "decreasing", "stable"]
    percentage_change: Optional[float] = None


class OverspendingAlert(BaseModel):
    """
    Overspending detection alert.

    Attributes:
        category: Category with overspending
        current_spending: Current spending amount
        budget_limit: Budget limit (if provided)
        excess_amount: Amount over budget
        severity: Alert severity level ("low", "medium", "high")
        recommendation: Actionable suggestion to address overspending
    """

    category: str
    current_spending: float
    budget_limit: Optional[float] = None
    excess_amount: Optional[float] = None
    severity: Literal["low", "medium", "high"]
    recommendation: str


class BudgetAdvisorAnalysis(BaseModel):
    """
    Complete budget analysis result.

    Attributes:
        total_spending: Total spending across all transactions
        total_income: Total income (if any negative amounts)
        net_balance: Net balance (income - expenses)
        average_daily_spending: Average daily spending amount
        top_categories: Top spending categories
        trends: Spending trends by category
        overspending_alerts: List of overspending alerts
        suggestions: Actionable recommendations
        analysis_period: Date range of analysis
    """

    total_spending: float
    total_income: float = 0.0
    net_balance: float
    average_daily_spending: float
    top_categories: List[str]
    trends: List[SpendingTrend]
    overspending_alerts: List[OverspendingAlert]
    suggestions: List[str]
    analysis_period: dict = Field(..., description="Date range: {'start': date, 'end': date}")


class BudgetAdvisorResponse(BaseModel):
    """
    Standard API response wrapper for budget advisor endpoint.

    Attributes:
        status: Response status ("success" or "error")
        data: Analysis data (present on success)
        message: Human-readable message
    """

    status: Literal["success", "error"]
    data: Optional[BudgetAdvisorAnalysis] = None
    message: str

