"""Service for AI-powered budget advice and forecasting."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

import httpx

from app.core.config import get_settings
from app.schemas.ai import BudgetAdviceRequest, BudgetAdviceResponse, ForecastItem

logger = logging.getLogger(__name__)


class BudgetAIService:
    """Service for generating AI-powered budget advice and forecasts."""

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(timeout=30.0)

    async def get_budget_advice(
        self,
        request: BudgetAdviceRequest,
    ) -> BudgetAdviceResponse:
        """
        Generate personalized budget advice and spending forecast using OpenAI.

        Args:
            request: Budget advice request with user ID and transaction history

        Returns:
            BudgetAdviceResponse with AI-generated advice and forecast
        """
        settings = get_settings()

        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured. Returning fallback advice.")
            return self._fallback_advice(request)

        # Prepare transaction summary for AI
        transaction_summary = self._prepare_transaction_summary(request.transaction_history)

        # Generate forecast using simple trend analysis
        forecast = self._generate_forecast(request.transaction_history)

        # Call OpenAI for personalized advice
        try:
            advice = await self._get_ai_advice(settings, transaction_summary, request.user_id)
        except Exception as e:
            logger.error(f"Failed to get AI advice: {e}")
            advice = self._fallback_advice_text(transaction_summary)

        return BudgetAdviceResponse(advice=advice, forecast=forecast)

    def _prepare_transaction_summary(self, transactions: List[Any]) -> Dict[str, Any]:
        """Prepare a summary of transactions for AI analysis."""
        if not transactions:
            return {"total_transactions": 0, "total_spent": 0, "categories": {}}

        total_spent = sum(abs(t.amount) for t in transactions if t.amount < 0)
        total_income = sum(t.amount for t in transactions if t.amount > 0)

        categories: Dict[str, float] = {}
        for t in transactions:
            if t.amount < 0:  # Only expenses
                categories[t.category] = categories.get(t.category, 0) + abs(t.amount)

        return {
            "total_transactions": len(transactions),
            "total_spent": total_spent,
            "total_income": total_income,
            "net_balance": total_income - total_spent,
            "categories": categories,
            "top_categories": sorted(categories.items(), key=lambda x: x[1], reverse=True)[:5],
        }

    def _generate_forecast(self, transactions: List[Any]) -> List[ForecastItem]:
        """Generate monthly spending forecast based on transaction history."""
        if not transactions:
            return []

        # Group transactions by month
        monthly_spending: Dict[str, float] = {}
        for t in transactions:
            if t.amount < 0:  # Only expenses
                try:
                    date = datetime.fromisoformat(t.date.replace("Z", "+00:00"))
                    month_key = date.strftime("%Y-%m")
                    monthly_spending[month_key] = monthly_spending.get(month_key, 0) + abs(t.amount)
                except (ValueError, AttributeError):
                    continue

        if not monthly_spending:
            return []

        # Calculate average monthly spending
        avg_monthly = sum(monthly_spending.values()) / len(monthly_spending)

        # Generate forecast for next 6 months
        forecast: List[ForecastItem] = []
        current_date = datetime.now()
        for i in range(1, 7):
            forecast_month = (current_date + timedelta(days=30 * i)).strftime("%Y-%m")
            # Use average with slight trend adjustment
            predicted = avg_monthly * (1.02 ** i)  # 2% growth assumption
            forecast.append(ForecastItem(month=forecast_month, predicted_spend=predicted))

        return forecast

    async def _get_ai_advice(
        self,
        settings: Any,
        transaction_summary: Dict[str, Any],
        user_id: str,
    ) -> str:
        """Call OpenAI API to generate personalized budget advice with structured output and safety checks."""
        prompt = f"""You are a financial advisor helping a user manage their budget. Analyze their transaction history and provide personalized, actionable advice.

TRANSACTION SUMMARY:
- Total Transactions: {transaction_summary['total_transactions']}
- Total Spent: ${transaction_summary['total_spent']:.2f}
- Total Income: ${transaction_summary['total_income']:.2f}
- Net Balance: ${transaction_summary['net_balance']:.2f}
- Top Spending Categories: {', '.join([f"{cat}: ${amt:.2f}" for cat, amt in transaction_summary.get('top_categories', [])])}

RESPONSE REQUIREMENTS:
Provide concise, actionable budget advice (2-3 sentences) focusing on:
1. Spending patterns and areas for improvement
2. Practical tips to save money
3. Recommendations for better financial management

SAFETY GUIDELINES:
- Keep advice appropriate for educational purposes (this is a virtual pet financial literacy app)
- Focus on general budgeting principles, not specific investment or financial product recommendations
- Be encouraging and supportive, especially if spending exceeds income
- Avoid medical, legal, or tax advice
- Keep language age-appropriate

OUTPUT FORMAT:
Return only the advice text (2-3 sentences), friendly and encouraging, specific to their spending patterns."""

        messages = [
            {"role": "system", "content": "You are a helpful financial advisor providing budget advice."},
            {"role": "user", "content": prompt},
        ]

        payload = {
            "model": settings.openai_chat_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 300,
        }

        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }

        response = await self._client.post(
            settings.openai_chat_api,
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

        result = response.json()
        advice = result["choices"][0]["message"]["content"].strip()

        return advice

    def _fallback_advice(self, request: BudgetAdviceRequest) -> BudgetAdviceResponse:
        """Return fallback advice when OpenAI is not available."""
        summary = self._prepare_transaction_summary(request.transaction_history)
        advice = self._fallback_advice_text(summary)
        forecast = self._generate_forecast(request.transaction_history)
        return BudgetAdviceResponse(advice=advice, forecast=forecast)

    def _fallback_advice_text(self, summary: Dict[str, Any]) -> str:
        """Generate fallback advice text."""
        if summary["total_transactions"] == 0:
            return "Start tracking your expenses to get personalized budget advice. Record your transactions regularly to see spending patterns and identify areas where you can save."

        net_balance = summary.get("net_balance", 0)
        if net_balance < 0:
            return f"You're spending more than you earn. Focus on reducing expenses in your top categories: {', '.join([cat for cat, _ in summary.get('top_categories', [])[:3]])}. Consider creating a budget to track and limit spending in these areas."

        return f"Great job managing your finances! Your net balance is positive. Continue tracking your spending, especially in categories like {', '.join([cat for cat, _ in summary.get('top_categories', [])[:2]])}. Consider setting savings goals to build your financial future."
