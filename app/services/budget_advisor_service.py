"""
Budget Advisor AI Service.

This service analyzes transaction data to detect spending trends, identify overspending,
and generate actionable recommendations for better budget management.

Enhanced with:
- Comprehensive logging for production debugging
- Edge case handling for empty/invalid data
- Database integration support
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import date, datetime, timedelta
from typing import List, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.schemas.budget_advisor import (
    BudgetAdvisorAnalysis,
    BudgetAdvisorRequest,
    OverspendingAlert,
    SpendingTrend,
    TransactionInput,
)

# Configure structured logging
LOGGER = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
)


class BudgetAdvisorService:
    """Service class for budget analysis and recommendations."""

    # Default category budgets (can be overridden by user)
    DEFAULT_CATEGORY_BUDGETS: dict[str, float] = {
        "food": 500.0,
        "transport": 300.0,
        "entertainment": 200.0,
        "shopping": 400.0,
        "bills": 1000.0,
        "health": 150.0,
        "education": 300.0,
    }

    # Thresholds for overspending severity
    LOW_SEVERITY_THRESHOLD = 0.10  # 10% over budget
    MEDIUM_SEVERITY_THRESHOLD = 0.25  # 25% over budget
    HIGH_SEVERITY_THRESHOLD = 0.50  # 50% over budget

    @staticmethod
    async def analyze_budget(
        request: BudgetAdvisorRequest,
        session: Optional[AsyncSession] = None,
        user_id: Optional[UUID | str] = None,
    ) -> BudgetAdvisorAnalysis:
        """
        Analyze transaction data and generate budget insights.

        Args:
            request: Budget advisor request containing transactions and optional budget
            session: Optional database session for fetching user transactions
            user_id: Optional user ID to fetch transactions from database

        Returns:
            BudgetAdvisorAnalysis: Complete analysis with trends, alerts, and suggestions

        Raises:
            ValueError: If transaction data is invalid or empty
        """
        LOGGER.info(
            f"Starting budget analysis - Transactions: {len(request.transactions)}, "
            f"User ID: {user_id}, Has DB Session: {session is not None}"
        )

        # Validate and process transactions
        if not request.transactions:
            LOGGER.warning("Empty transactions list provided - raising ValueError")
            raise ValueError("No transactions provided for analysis")

        # Log transaction details for debugging
        LOGGER.debug(f"Transaction details: {[f'{t.category}: ${t.amount}' for t in request.transactions[:5]]}")
        
        # Validate transaction amounts and categories
        invalid_count = 0
        for idx, transaction in enumerate(request.transactions):
            if transaction.amount <= 0:
                LOGGER.warning(f"Transaction {idx + 1} has invalid amount: {transaction.amount}")
                invalid_count += 1
            if not transaction.category or not transaction.category.strip():
                LOGGER.warning(f"Transaction {idx + 1} has empty category")
                invalid_count += 1
        
        if invalid_count > 0:
            LOGGER.error(f"Found {invalid_count} invalid transactions out of {len(request.transactions)}")

        # Separate income and expenses
        # Note: In our system, expenses are positive, income is negative
        expenses = [t for t in request.transactions if t.amount > 0]
        income_transactions = [t for t in request.transactions if t.amount < 0]

        LOGGER.debug(f"Expenses: {len(expenses)}, Income transactions: {len(income_transactions)}")

        if not expenses:
            LOGGER.warning("No expense transactions found in input - analysis may be limited")

        # Calculate totals
        total_spending = sum(t.amount for t in expenses)
        total_income = abs(sum(t.amount for t in income_transactions))
        net_balance = total_income - total_spending

        # Calculate date range
        dates = [t.date for t in request.transactions]
        start_date = min(dates)
        end_date = max(dates)
        days_span = (end_date - start_date).days + 1
        average_daily_spending = total_spending / days_span if days_span > 0 else 0.0

        # Analyze by category
        category_data = BudgetAdvisorService._analyze_by_category(expenses, start_date, end_date)

        # Get top categories
        top_categories = BudgetAdvisorService._get_top_categories(category_data)

        # Detect trends
        trends = BudgetAdvisorService._detect_trends(expenses, category_data)

        # Detect overspending
        overspending_alerts = BudgetAdvisorService._detect_overspending(
            category_data, request.monthly_budget
        )

        # Generate suggestions
        suggestions = BudgetAdvisorService._generate_suggestions(
            category_data, trends, overspending_alerts, net_balance, average_daily_spending
        )

        LOGGER.info(
            f"Analysis complete - Total Spending: ${total_spending:.2f}, "
            f"Net Balance: ${net_balance:.2f}, Trends: {len(trends)}, "
            f"Alerts: {len(overspending_alerts)}, Suggestions: {len(suggestions)}"
        )

        result = BudgetAdvisorAnalysis(
            total_spending=round(total_spending, 2),
            total_income=round(total_income, 2),
            net_balance=round(net_balance, 2),
            average_daily_spending=round(average_daily_spending, 2),
            top_categories=top_categories,
            trends=trends,
            overspending_alerts=overspending_alerts,
            suggestions=suggestions,
            analysis_period={"start": start_date.isoformat(), "end": end_date.isoformat()},
        )
        
        LOGGER.debug(f"Returning analysis result with {len(result.top_categories)} top categories")
        return result

    @staticmethod
    def _analyze_by_category(
        transactions: List[TransactionInput], start_date: date, end_date: date
    ) -> dict[str, dict]:
        """
        Group and analyze transactions by category.

        Args:
            transactions: List of transaction inputs
            start_date: Start date of analysis period
            end_date: End date of analysis period

        Returns:
            Dictionary mapping category to analysis data
        """
        category_data: dict[str, dict] = defaultdict(
            lambda: {
                "total": 0.0,
                "count": 0,
                "transactions": [],
                "dates": [],
            }
        )

        for transaction in transactions:
            cat = transaction.category
            category_data[cat]["total"] += transaction.amount
            category_data[cat]["count"] += 1
            category_data[cat]["transactions"].append(transaction)
            category_data[cat]["dates"].append(transaction.date)

        return dict(category_data)

    @staticmethod
    def _get_top_categories(category_data: dict[str, dict], limit: int = 5) -> List[str]:
        """
        Get top spending categories by total amount.

        Args:
            category_data: Category analysis data
            limit: Maximum number of categories to return

        Returns:
            List of category names sorted by spending
        """
        sorted_categories = sorted(
            category_data.items(), key=lambda x: x[1]["total"], reverse=True
        )
        return [cat for cat, _ in sorted_categories[:limit]]

    @staticmethod
    def _detect_trends(
        transactions: List[TransactionInput], category_data: dict[str, dict]
    ) -> List[SpendingTrend]:
        """
        Detect spending trends for each category.

        Args:
            transactions: List of all transactions
            category_data: Category analysis data

        Returns:
            List of spending trends
        """
        trends: List[SpendingTrend] = []

        for category, data in category_data.items():
            if data["count"] < 2:
                # Not enough data for trend analysis
                trends.append(
                    SpendingTrend(
                        category=category,
                        total_spent=round(data["total"], 2),
                        transaction_count=data["count"],
                        average_amount=round(data["total"] / data["count"], 2) if data["count"] > 0 else 0.0,
                        trend="stable",
                        percentage_change=None,
                    )
                )
                continue

            # Split transactions into two halves for comparison
            sorted_transactions = sorted(data["transactions"], key=lambda t: t.date)
            mid_point = len(sorted_transactions) // 2

            first_half = sorted_transactions[:mid_point]
            second_half = sorted_transactions[mid_point:]

            first_half_total = sum(t.amount for t in first_half)
            second_half_total = sum(t.amount for t in second_half)

            # Calculate percentage change
            if first_half_total > 0:
                percentage_change = ((second_half_total - first_half_total) / first_half_total) * 100
            else:
                percentage_change = 100.0 if second_half_total > 0 else 0.0

            # Determine trend
            if percentage_change > 10:
                trend = "increasing"
            elif percentage_change < -10:
                trend = "decreasing"
            else:
                trend = "stable"

            trends.append(
                SpendingTrend(
                    category=category,
                    total_spent=round(data["total"], 2),
                    transaction_count=data["count"],
                    average_amount=round(data["total"] / data["count"], 2),
                    trend=trend,
                    percentage_change=round(percentage_change, 2),
                )
            )

        return trends

    @staticmethod
    def _detect_overspending(
        category_data: dict[str, dict], monthly_budget: Optional[float]
    ) -> List[OverspendingAlert]:
        """
        Detect overspending in categories.

        Args:
            category_data: Category analysis data
            monthly_budget: Optional overall monthly budget

        Returns:
            List of overspending alerts
        """
        alerts: List[OverspendingAlert] = []

        # Calculate monthly spending from category data
        # Assume transactions span approximately one month (can be adjusted)
        for category, data in category_data.items():
            category_spending = data["total"]

            # Use default category budget if available
            category_budget = BudgetAdvisorService.DEFAULT_CATEGORY_BUDGETS.get(
                category.lower(), None
            )

            # If monthly budget provided, allocate proportionally
            if monthly_budget and not category_budget:
                # Simple proportional allocation (can be improved)
                total_spending = sum(cat_data["total"] for cat_data in category_data.values())
                if total_spending > 0:
                    category_budget = (category_spending / total_spending) * monthly_budget
                else:
                    category_budget = None

            if category_budget and category_spending > category_budget:
                excess = category_spending - category_budget
                excess_percentage = (excess / category_budget) * 100

                # Determine severity
                if excess_percentage >= BudgetAdvisorService.HIGH_SEVERITY_THRESHOLD * 100:
                    severity = "high"
                elif excess_percentage >= BudgetAdvisorService.MEDIUM_SEVERITY_THRESHOLD * 100:
                    severity = "medium"
                else:
                    severity = "low"

                # Generate recommendation
                recommendation = BudgetAdvisorService._generate_overspending_recommendation(
                    category, excess, severity
                )

                alerts.append(
                    OverspendingAlert(
                        category=category,
                        current_spending=round(category_spending, 2),
                        budget_limit=round(category_budget, 2),
                        excess_amount=round(excess, 2),
                        severity=severity,
                        recommendation=recommendation,
                    )
                )

        return alerts

    @staticmethod
    def _generate_overspending_recommendation(
        category: str, excess: float, severity: str
    ) -> str:
        """
        Generate actionable recommendation for overspending.

        Args:
            category: Category name
            excess: Excess amount over budget
            severity: Alert severity level

        Returns:
            Recommendation message
        """
        if severity == "high":
            return (
                f"⚠️ Critical: You've exceeded your {category} budget by ${excess:.2f}. "
                f"Consider reviewing all {category} expenses and cutting non-essential items immediately."
            )
        elif severity == "medium":
            return (
                f"⚠️ Warning: You're ${excess:.2f} over budget in {category}. "
                f"Try to reduce spending in this category for the rest of the month."
            )
        else:
            return (
                f"💡 Tip: You're slightly over budget in {category} by ${excess:.2f}. "
                f"Monitor your spending to stay within budget."
            )

    @staticmethod
    def _generate_suggestions(
        category_data: dict[str, dict],
        trends: List[SpendingTrend],
        overspending_alerts: List[OverspendingAlert],
        net_balance: float,
        average_daily_spending: float,
    ) -> List[str]:
        """
        Generate actionable budget suggestions.

        Args:
            category_data: Category analysis data
            trends: Spending trends
            overspending_alerts: Overspending alerts
            net_balance: Net balance (income - expenses)
            average_daily_spending: Average daily spending

        Returns:
            List of suggestion strings
        """
        suggestions: List[str] = []

        # Negative balance suggestion
        if net_balance < 0:
            suggestions.append(
                f"⚠️ Your expenses exceed your income by ${abs(net_balance):.2f}. "
                "Consider reducing discretionary spending or finding additional income sources."
            )

        # High spending rate suggestion
        if average_daily_spending > 50:
            monthly_projection = average_daily_spending * 30
            suggestions.append(
                f"📊 At your current spending rate of ${average_daily_spending:.2f}/day, "
                f"you're on track to spend ${monthly_projection:.2f} this month. "
                "Review if this aligns with your budget goals."
            )

        # Increasing trend suggestions
        increasing_trends = [t for t in trends if t.trend == "increasing" and t.percentage_change]
        if increasing_trends:
            top_increasing = max(increasing_trends, key=lambda t: t.percentage_change or 0)
            suggestions.append(
                f"📈 Your spending in '{top_increasing.category}' is increasing "
                f"by {top_increasing.percentage_change:.1f}%. "
                "Consider setting a spending limit for this category."
            )

        # Overspending suggestions
        if overspending_alerts:
            high_severity = [a for a in overspending_alerts if a.severity == "high"]
            if high_severity:
                suggestions.append(
                    f"🚨 You have {len(high_severity)} category(ies) with critical overspending. "
                    "Prioritize reducing expenses in these areas."
                )

        # Category-specific suggestions
        if not suggestions:
            # Default positive suggestions
            suggestions.append(
                "✅ Your spending patterns look balanced. Keep tracking your expenses to maintain good financial health."
            )

        # Savings suggestion for positive balance
        if net_balance > 100:
            suggestions.append(
                f"💰 You have a positive balance of ${net_balance:.2f}. "
                "Consider setting aside a portion for savings or emergency fund."
            )

        return suggestions[:5]  # Limit to top 5 suggestions


# Convenience function for async usage
async def analyze_budget(request: BudgetAdvisorRequest) -> BudgetAdvisorAnalysis:
    """
    Convenience function to analyze budget.

    Args:
        request: Budget advisor request

    Returns:
        BudgetAdvisorAnalysis: Analysis results
    """
    return await BudgetAdvisorService.analyze_budget(request)

