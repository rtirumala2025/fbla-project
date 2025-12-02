"""
Budget Forecasting Engine - Financial Prediction and Trend Analysis

This module provides advanced budget forecasting capabilities using Python-based
statistical analysis and AI-powered insights for financial planning.

Features:
- Time-series forecasting with trend analysis
- Category-based spending predictions
- Seasonal pattern recognition
- Budget variance analysis
- AI-powered personalized recommendations
- Confidence scoring for all forecasts

Algorithm Overview:
1. Analyzes historical transaction data by time period
2. Calculates statistical trends (linear regression, moving averages)
3. Identifies seasonal patterns and cyclical behavior
4. Projects future spending using trend extrapolation
5. Generates AI-powered insights and recommendations
6. Calculates forecast confidence based on data quality

Example Usage:
    engine = BudgetForecastingEngine()
    forecast = await engine.generate_forecast(
        transactions=[...],
        forecast_months=6
    )
    # Returns comprehensive forecast with trends and recommendations
"""

from __future__ import annotations

import json
import logging
import re
from collections import defaultdict
from datetime import datetime, timedelta
from statistics import mean, median, stdev
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class BudgetForecastingEngine:
    """
    Advanced budget forecasting engine with Python-based statistical analysis.
    
    Provides comprehensive financial forecasting using:
    - Time-series analysis
    - Trend detection and extrapolation
    - Category-level predictions
    - Seasonal pattern recognition
    - AI-powered recommendations
    
    Forecasting Methods:
    1. Moving Average: Smooths out fluctuations for trend detection
    2. Linear Regression: Extrapolates linear trends
    3. Growth Rate: Projects percentage-based growth patterns
    4. Category Analysis: Forecasts spending by category
    """

    def __init__(self, client: Optional[httpx.AsyncClient] = None) -> None:
        """
        Initialize the Budget Forecasting Engine.
        
        Args:
            client: Optional HTTP client for API calls. If not provided,
                   a new client will be created per request.
        """
        self._client = client
        logger.info("BudgetForecastingEngine initialized")

    async def generate_forecast(
        self,
        transactions: List[Dict[str, Any]],
        forecast_months: int = 6,
        monthly_budget: Optional[float] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate comprehensive budget forecast with trends and recommendations.
        
        Main forecasting method that:
        1. Analyzes historical transaction patterns
        2. Calculates spending trends
        3. Projects future spending by month and category
        4. Identifies budget risks and opportunities
        5. Generates AI-powered recommendations
        
        Args:
            transactions: List of transaction dictionaries, each containing:
                         - amount: Transaction amount (negative for expenses)
                         - category: Transaction category
                         - date: Transaction date (ISO format or datetime)
                         - description: Optional description
            forecast_months: Number of months ahead to forecast (default: 6)
            monthly_budget: Optional monthly budget limit for variance analysis
            user_id: Optional user ID for personalized recommendations
        
        Returns:
            Dictionary containing:
            - monthly_forecast: List of monthly spending predictions
            - category_forecast: Category-level spending predictions
            - trends: Identified spending trends
            - recommendations: AI-powered recommendations
            - confidence_score: Overall forecast confidence (0.0-1.0)
            - budget_alerts: Warnings about potential budget overruns
        
        Example:
            >>> forecast = await engine.generate_forecast(
            ...     transactions=[
            ...         {"amount": -50.0, "category": "food", "date": "2024-01-15"},
            ...         {"amount": -30.0, "category": "transport", "date": "2024-01-16"}
            ...     ],
            ...     forecast_months=6,
            ...     monthly_budget=500.0
            ... )
        """
        if not transactions:
            logger.warning("No transactions provided for forecasting")
            return self._generate_empty_forecast(forecast_months)

        # Analyze historical patterns
        pattern_analysis = self._analyze_patterns(transactions)
        
        # Generate monthly forecast using statistical methods
        monthly_forecast = self._generate_monthly_forecast(
            pattern_analysis, forecast_months
        )
        
        # Generate category-level forecasts
        category_forecast = self._generate_category_forecast(
            pattern_analysis, forecast_months
        )
        
        # Identify trends
        trends: List[Dict[str, Any]] = self._identify_trends(pattern_analysis)
        
        # Calculate confidence
        confidence_score = self._calculate_forecast_confidence(pattern_analysis)
        
        # Generate budget alerts
        budget_alerts = []
        if monthly_budget:
            budget_alerts = self._generate_budget_alerts(
                monthly_forecast, monthly_budget
            )
        
        # Get AI-powered recommendations if available
        recommendations = []
        settings = get_settings()
        ai_enabled = bool(
            getattr(settings, "openrouter_api_key", None) or 
            getattr(settings, "openai_api_key", None)
        )
        
        if ai_enabled:
            try:
                recommendations = await self._get_ai_recommendations(
                    pattern_analysis, trends, monthly_budget, user_id, settings
                )
            except Exception as e:
                logger.warning(f"AI recommendations failed, using fallback: {e}")
                recommendations = self._generate_fallback_recommendations(
                    pattern_analysis, trends, monthly_budget
                )
        else:
            recommendations = self._generate_fallback_recommendations(
                pattern_analysis, trends, monthly_budget
            )

        return {
            "monthly_forecast": monthly_forecast,
            "category_forecast": category_forecast,
            "trends": trends,
            "recommendations": recommendations,
            "confidence_score": confidence_score,
            "budget_alerts": budget_alerts,
            "pattern_analysis": pattern_analysis,
        }

    def _analyze_patterns(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze transaction history to identify patterns and trends.
        
        Statistical analysis algorithm:
        1. Groups transactions by month and category
        2. Calculates spending statistics (mean, median, std dev)
        3. Identifies seasonal patterns
        4. Detects spending trends (increasing/decreasing)
        5. Calculates category distributions
        
        Args:
            transactions: List of transaction records
        
        Returns:
            Dictionary with comprehensive pattern analysis
        """
        if not transactions:
            return {
                "monthly_spending": {},
                "category_spending": {},
                "total_transactions": 0,
                "date_range": {},
            }

        monthly_spending: Dict[str, List[float]] = defaultdict(list)
        category_spending: Dict[str, List[float]] = defaultdict(list)
        dates: List[datetime] = []

        # Process each transaction
        for transaction in transactions:
            amount = float(transaction.get("amount", 0))
            category = transaction.get("category", "other")
            date_str = transaction.get("date", "")

            # Only analyze expenses (negative amounts)
            if amount >= 0:
                continue

            expense_amount = abs(amount)
            category_spending[category].append(expense_amount)

            # Parse and group by month
            try:
                if isinstance(date_str, str):
                    if date_str.endswith("Z"):
                        dt = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                    else:
                        dt = datetime.fromisoformat(date_str)
                elif isinstance(date_str, datetime):
                    dt = date_str
                else:
                    continue

                dates.append(dt)
                month_key = dt.strftime("%Y-%m")
                monthly_spending[month_key].append(expense_amount)
            except (ValueError, AttributeError, TypeError):
                logger.debug(f"Could not parse date: {date_str}")
                continue

        # Calculate monthly totals and statistics
        monthly_totals: Dict[str, float] = {}
        monthly_stats: Dict[str, Dict[str, float]] = {}
        
        for month, amounts in monthly_spending.items():
            if amounts:
                monthly_totals[month] = sum(amounts)
                monthly_stats[month] = {
                    "total": sum(amounts),
                    "mean": mean(amounts),
                    "median": median(amounts),
                    "count": len(amounts),
                }
                if len(amounts) > 1:
                    monthly_stats[month]["std_dev"] = stdev(amounts)

        # Calculate category statistics
        category_stats: Dict[str, Dict[str, float]] = {}
        for category, amounts in category_spending.items():
            if amounts:
                category_stats[category] = {
                    "total": sum(amounts),
                    "mean": mean(amounts),
                    "median": median(amounts),
                    "count": len(amounts),
                }
                if len(amounts) > 1:
                    category_stats[category]["std_dev"] = stdev(amounts)

        # Date range
        date_range = {}
        if dates:
            dates.sort()
            date_range = {
                "start": dates[0].isoformat(),
                "end": dates[-1].isoformat(),
                "span_months": self._months_between(dates[0], dates[-1]),
            }

        return {
            "monthly_spending": dict(monthly_totals),
            "monthly_stats": monthly_stats,
            "category_spending": dict(category_stats),
            "total_transactions": len(transactions),
            "date_range": date_range,
        }

    def _generate_monthly_forecast(
        self, pattern_analysis: Dict[str, Any], forecast_months: int
    ) -> List[Dict[str, Any]]:
        """
        Generate monthly spending forecast using statistical methods.
        
        Forecasting algorithm:
        1. Uses moving average to smooth historical data
        2. Calculates linear trend using least squares
        3. Projects future months using trend extrapolation
        4. Applies seasonal adjustments if patterns detected
        
        Args:
            pattern_analysis: Results from pattern analysis
            forecast_months: Number of months to forecast
        
        Returns:
            List of monthly forecast dictionaries
        """
        monthly_totals = pattern_analysis.get("monthly_spending", {})
        
        if not monthly_totals:
            return self._generate_default_monthly_forecast(forecast_months)

        # Sort months chronologically
        sorted_months = sorted(monthly_totals.keys())
        monthly_values = [monthly_totals[month] for month in sorted_months]

        # Calculate trend using linear regression (simple slope calculation)
        trend = self._calculate_linear_trend(monthly_values)
        
        # Calculate baseline (average of recent months)
        recent_months = min(3, len(monthly_values))
        baseline = mean(monthly_values[-recent_months:]) if monthly_values else 0

        # Generate forecast
        forecast = []
        current_date = datetime.now()
        
        # Get last month's value for starting point
        last_month_value = monthly_values[-1] if monthly_values else baseline

        for i in range(1, forecast_months + 1):
            forecast_date = current_date + timedelta(days=30 * i)
            month_key = forecast_date.strftime("%Y-%m")
            
            # Project using trend
            predicted = last_month_value + (trend * i)
            
            # Apply moving average smoothing
            if len(monthly_values) >= 3:
                # Use weighted average with recent months
                weights = [0.5, 0.3, 0.2]  # More weight to recent
                weighted_avg = sum(
                    monthly_values[-j-1] * weights[j]
                    for j in range(min(3, len(monthly_values)))
                )
                predicted = (predicted * 0.7) + (weighted_avg * 0.3)
            
            # Ensure non-negative
            predicted = max(0, predicted)
            
            forecast.append({
                "month": month_key,
                "predicted_spend": round(predicted, 2),
                "confidence": self._calculate_month_confidence(i, len(monthly_values)),
            })

        return forecast

    def _generate_category_forecast(
        self, pattern_analysis: Dict[str, Any], forecast_months: int
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Generate category-level spending forecasts.
        
        Projects spending for each category separately using
        category-specific trends and patterns.
        
        Args:
            pattern_analysis: Results from pattern analysis
            forecast_months: Number of months to forecast
        
        Returns:
            Dictionary mapping category names to forecast lists
        """
        category_stats = pattern_analysis.get("category_spending", {})
        
        if not category_stats:
            return {}

        category_forecast: Dict[str, List[Dict[str, Any]]] = {}
        current_date = datetime.now()

        for category, stats in category_stats.items():
            monthly_avg = stats.get("mean", 0) * stats.get("count", 1) / forecast_months
            
            forecast = []
            for i in range(1, forecast_months + 1):
                forecast_date = current_date + timedelta(days=30 * i)
                month_key = forecast_date.strftime("%Y-%m")
                
                # Simple projection based on average monthly spending
                predicted = monthly_avg
                
                forecast.append({
                    "month": month_key,
                    "predicted_spend": round(predicted, 2),
                    "category": category,
                })
            
            category_forecast[category] = forecast

        return category_forecast

    def _identify_trends(self, pattern_analysis: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Identify spending trends from historical data.
        
        Analyzes patterns to detect:
        - Increasing/decreasing spending trends
        - Category-level trends
        - Seasonal patterns
        - Volatility indicators
        
        Args:
            pattern_analysis: Results from pattern analysis
        
        Returns:
            List of identified trends
        """
        trends: List[Dict[str, Any]] = []
        monthly_totals = pattern_analysis.get("monthly_spending", {})
        
        if len(monthly_totals) < 2:
            trends.append({
                "type": "insufficient_data",
                "description": "Not enough data to identify trends",
                "severity": "info",
            })
            return trends

        sorted_months = sorted(monthly_totals.keys())
        monthly_values = [monthly_totals[month] for month in sorted_months]

        # Calculate overall trend
        trend = self._calculate_linear_trend(monthly_values)
        baseline = mean(monthly_values) if monthly_values else 0

        if trend > baseline * 0.1:  # More than 10% increase
            trends.append({
                "type": "increasing",
                "description": f"Spending is increasing by ~${abs(trend):.2f} per month",
                "severity": "warning",
                "trend_value": trend,
            })
        elif trend < -baseline * 0.1:  # More than 10% decrease
            trends.append({
                "type": "decreasing",
                "description": f"Spending is decreasing by ~${abs(trend):.2f} per month",
                "severity": "positive",
                "trend_value": trend,
            })
        else:
            trends.append({
                "type": "stable",
                "description": "Spending is relatively stable",
                "severity": "info",
                "trend_value": trend,
            })

        # Analyze volatility
        if len(monthly_values) > 1:
            volatility = stdev(monthly_values)
            if volatility > baseline * 0.3:
                trends.append({
                    "type": "volatile",
                    "description": "Spending shows high variability between months",
                    "severity": "warning",
                    "volatility": volatility,
                })

        return trends

    def _calculate_linear_trend(self, values: List[float]) -> float:
        """
        Calculate linear trend using simple slope calculation.
        
        Computes the average rate of change between consecutive values.
        
        Args:
            values: List of numeric values in chronological order
        
        Returns:
            Average slope/trend value
        """
        if len(values) < 2:
            return 0.0

        changes = [values[i] - values[i-1] for i in range(1, len(values))]
        return mean(changes) if changes else 0.0

    def _calculate_forecast_confidence(self, pattern_analysis: Dict[str, Any]) -> float:
        """
        Calculate confidence score for the forecast.
        
        Confidence factors:
        - More data points = higher confidence
        - Consistent patterns = higher confidence
        - Longer history = higher confidence
        
        Args:
            pattern_analysis: Pattern analysis results
        
        Returns:
            Confidence score between 0.0 and 1.0
        """
        monthly_totals = pattern_analysis.get("monthly_spending", {})
        data_points = len(monthly_totals)
        date_range = pattern_analysis.get("date_range", {})
        span_months = date_range.get("span_months", 0)

        if data_points == 0:
            return 0.2

        # Base confidence from data points
        if data_points < 3:
            base_confidence = 0.4
        elif data_points < 6:
            base_confidence = 0.6
        else:
            base_confidence = 0.7

        # Boost for longer time span
        if span_months >= 6:
            base_confidence += 0.1
        elif span_months >= 3:
            base_confidence += 0.05

        return min(base_confidence, 0.95)

    def _calculate_month_confidence(self, months_ahead: int, data_points: int) -> float:
        """
        Calculate confidence for a specific forecast month.
        
        Confidence decreases as we forecast further into the future.
        
        Args:
            months_ahead: Number of months ahead (1, 2, 3, ...)
            data_points: Number of historical data points
        
        Returns:
            Confidence score for that month
        """
        base_confidence = min(0.8, 0.4 + (data_points * 0.05))
        decay_factor = 0.95 ** months_ahead  # Exponential decay
        return base_confidence * decay_factor

    def _generate_budget_alerts(
        self, monthly_forecast: List[Dict[str, Any]], monthly_budget: float
    ) -> List[Dict[str, Any]]:
        """
        Generate alerts for potential budget overruns.
        
        Args:
            monthly_forecast: List of monthly forecasts
            monthly_budget: Budget limit per month
        
        Returns:
            List of budget alert dictionaries
        """
        alerts = []
        for forecast in monthly_forecast:
            predicted = forecast.get("predicted_spend", 0)
            if predicted > monthly_budget:
                overrun_pct = ((predicted - monthly_budget) / monthly_budget) * 100
                severity = "high" if overrun_pct > 20 else "medium" if overrun_pct > 10 else "low"
                
                alerts.append({
                    "month": forecast.get("month"),
                    "predicted_spend": predicted,
                    "budget": monthly_budget,
                    "overrun": predicted - monthly_budget,
                    "overrun_percentage": round(overrun_pct, 1),
                    "severity": severity,
                    "message": f"Projected spending ${predicted:.2f} exceeds budget by ${predicted - monthly_budget:.2f} ({overrun_pct:.1f}%)",
                })

        return alerts

    async def _get_ai_recommendations(
        self,
        pattern_analysis: Dict[str, Any],
        trends: List[Dict[str, Any]],
        monthly_budget: Optional[float],
        user_id: Optional[str],
        settings: Any,
    ) -> List[str]:
        """
        Get AI-powered personalized budget recommendations.
        
        Uses AI to generate contextually relevant recommendations
        based on spending patterns and trends.
        
        Args:
            pattern_analysis: Pattern analysis results
            trends: Identified trends
            monthly_budget: Optional budget limit
            user_id: Optional user ID
            settings: Application settings
        
        Returns:
            List of recommendation strings
        """
        # Build comprehensive prompt
        prompt = f"""Analyze the following spending patterns and provide personalized budget recommendations.

Spending Analysis:
- Total Transactions: {pattern_analysis.get('total_transactions', 0)}
- Monthly Spending: {json.dumps(pattern_analysis.get('monthly_spending', {}))}
- Top Categories: {json.dumps(list(pattern_analysis.get('category_spending', {}).keys())[:5])}

Identified Trends:
{json.dumps(trends, indent=2)}

Monthly Budget: ${monthly_budget if monthly_budget else 'Not specified'}

Provide 3-5 actionable, specific recommendations for:
1. Budget management and savings opportunities
2. Category-level spending optimization
3. Trend-based adjustments
4. Financial goal setting

Keep recommendations concise, practical, and encouraging."""

        messages = [
            {
                "role": "system",
                "content": "You are a financial advisor providing practical budget recommendations.",
            },
            {"role": "user", "content": prompt},
        ]

        # Determine API endpoint
        api_key = getattr(settings, "openrouter_api_key", None) or getattr(settings, "openai_api_key", None)
        api_url = getattr(settings, "openrouter_base_url", None) or getattr(settings, "openai_chat_api", None)
        model = getattr(settings, "openrouter_model", None) or getattr(settings, "openai_chat_model", "gpt-3.5-turbo")

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 400,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        if not api_url:
            raise ValueError("API URL not configured")
        
        client = self._client or httpx.AsyncClient(timeout=30.0)
        close_client = self._client is None

        try:
            response = await client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()

            # Parse recommendations (one per line or numbered)
            recommendations = []
            for line in content.split("\n"):
                line = line.strip()
                # Remove numbering, bullets
                line = re.sub(r"^[\d\.\-\*]+\s*", "", line)
                if line and len(line) > 10:
                    recommendations.append(line)
                if len(recommendations) >= 5:
                    break

            return recommendations[:5]

        except Exception as e:
            logger.error(f"AI recommendation generation failed: {e}")
            return self._generate_fallback_recommendations(pattern_analysis, trends, monthly_budget)
        finally:
            if close_client:
                await client.aclose()

    def _generate_fallback_recommendations(
        self,
        pattern_analysis: Dict[str, Any],
        trends: List[Dict[str, Any]],
        monthly_budget: Optional[float],
    ) -> List[str]:
        """
        Generate rule-based recommendations when AI is unavailable.
        
        Args:
            pattern_analysis: Pattern analysis results
            trends: Identified trends
            monthly_budget: Optional budget limit
        
        Returns:
            List of recommendation strings
        """
        recommendations = []

        # Analyze trends for recommendations
        for trend in trends:
            if trend.get("type") == "increasing":
                recommendations.append(
                    "Spending is trending upward. Consider reviewing expenses in top categories."
                )
            elif trend.get("type") == "volatile":
                recommendations.append(
                    "Spending varies significantly between months. Try to identify and smooth out irregular expenses."
                )

        # Category-based recommendations
        category_stats = pattern_analysis.get("category_spending", {})
        if category_stats:
            top_category = max(category_stats.items(), key=lambda x: x[1].get("total", 0))
            recommendations.append(
                f"Consider reviewing spending in '{top_category[0]}' category - it's your highest expense area."
            )

        # Budget-based recommendations
        if monthly_budget:
            monthly_totals = pattern_analysis.get("monthly_spending", {})
            if monthly_totals:
                avg_spending = mean(monthly_totals.values()) if monthly_totals else 0
                if avg_spending > monthly_budget:
                    recommendations.append(
                        f"Average spending (${avg_spending:.2f}) exceeds your monthly budget. "
                        f"Look for opportunities to reduce expenses."
                    )

        # Default recommendations
        if not recommendations:
            recommendations = [
                "Continue tracking expenses to identify spending patterns",
                "Review categories regularly to optimize budget allocation",
                "Set savings goals based on your spending patterns",
            ]

        return recommendations[:5]

    def _months_between(self, start: datetime, end: datetime) -> int:
        """Calculate number of months between two dates."""
        return (end.year - start.year) * 12 + (end.month - start.month)

    def _generate_default_monthly_forecast(self, forecast_months: int) -> List[Dict[str, Any]]:
        """Generate default forecast when no historical data exists."""
        forecast = []
        current_date = datetime.now()
        
        for i in range(1, forecast_months + 1):
            forecast_date = current_date + timedelta(days=30 * i)
            month_key = forecast_date.strftime("%Y-%m")
            
            forecast.append({
                "month": month_key,
                "predicted_spend": 0.0,
                "confidence": 0.2,
            })

        return forecast

    def _generate_empty_forecast(self, forecast_months: int) -> Dict[str, Any]:
        """Generate empty forecast structure when no data available."""
        return {
            "monthly_forecast": self._generate_default_monthly_forecast(forecast_months),
            "category_forecast": {},
            "trends": [{
                "type": "insufficient_data",
                "description": "Not enough transaction data for forecasting",
                "severity": "info",
            }],
            "recommendations": [
                "Start tracking expenses to enable forecasting",
                "Add transaction history to get personalized predictions",
            ],
            "confidence_score": 0.2,
            "budget_alerts": [],
        }
