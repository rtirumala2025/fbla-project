"""Service for AI-powered financial literacy simulator."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class FinanceSimulatorService:
    """Service for interactive financial literacy scenarios and simulations."""

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(timeout=30.0)

    async def generate_scenario(
        self,
        scenario_type: str,
        user_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Generate an interactive financial scenario.

        Args:
            scenario_type: Type of scenario (loan, investment, budgeting, savings)
            user_context: Optional user financial context for personalization

        Returns:
            Dictionary with scenario details, questions, and expected outcomes
        """
        settings = get_settings()

        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured. Returning fallback scenario.")
            return self._fallback_scenario(scenario_type)

        try:
            scenario = await self._get_ai_scenario(settings, scenario_type, user_context)
            return scenario
        except Exception as e:
            logger.error(f"Failed to generate AI scenario: {e}")
            return self._fallback_scenario(scenario_type)

    async def evaluate_decision(
        self,
        scenario_id: str,
        user_decision: Dict[str, Any],
        scenario_context: Dict[str, Any],
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
        settings = get_settings()

        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured. Returning fallback evaluation.")
            return self._fallback_evaluation(user_decision, scenario_context)

        try:
            evaluation = await self._get_ai_evaluation(settings, scenario_id, user_decision, scenario_context)
            return evaluation
        except Exception as e:
            logger.error(f"Failed to evaluate decision: {e}")
            return self._fallback_evaluation(user_decision, scenario_context)

    async def _get_ai_scenario(
        self,
        settings: Any,
        scenario_type: str,
        user_context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Call OpenAI API to generate a financial scenario."""
        scenario_types = {
            "loan": "student loan, car loan, or personal loan decision",
            "investment": "stock investment, savings account, or retirement planning",
            "budgeting": "monthly budget planning and expense management",
            "savings": "emergency fund, goal-based savings, or compound interest",
        }

        scenario_description = scenario_types.get(scenario_type, "general financial decision")

        context_info = ""
        if user_context:
            context_info = f"""
User Financial Context:
- Age: {user_context.get('age', 'N/A')}
- Income: ${user_context.get('income', 0):,.0f}/month
- Current Savings: ${user_context.get('savings', 0):,.0f}
- Monthly Expenses: ${user_context.get('expenses', 0):,.0f}
- Financial Goals: {user_context.get('goals', 'N/A')}
"""

        prompt = f"""Create an interactive financial literacy scenario for a {scenario_description} scenario.

{context_info}

Generate a realistic, educational scenario that:
1. Presents a clear financial situation or decision point
2. Provides multiple choice options (3-4 options)
3. Includes realistic financial figures and consequences
4. Teaches important financial concepts
5. Is appropriate for young adults/students

Return a JSON object with:
{{
  "scenario_id": "unique-scenario-id",
  "title": "Scenario title",
  "description": "Detailed scenario description (2-3 paragraphs)",
  "scenario_type": "{scenario_type}",
  "initial_situation": {{
    "income": 0,
    "expenses": 0,
    "savings": 0,
    "debt": 0
  }},
  "options": [
    {{
      "option_id": "option_1",
      "label": "Option label",
      "description": "What this option entails",
      "financial_impact": {{
        "income_change": 0,
        "expense_change": 0,
        "savings_change": 0,
        "debt_change": 0
      }},
      "risk_level": "low" | "medium" | "high",
      "time_horizon": "short" | "medium" | "long"
    }}
  ],
  "learning_objectives": [
    "Learning objective 1",
    "Learning objective 2"
  ],
  "concepts_covered": [
    "financial concept 1",
    "financial concept 2"
  ]
}}"""

        messages = [
            {
                "role": "system",
                "content": "You are a financial education expert. Create engaging, realistic scenarios that teach important financial literacy concepts to young adults.",
            },
            {"role": "user", "content": prompt},
        ]

        payload = {
            "model": settings.openai_chat_model,
            "messages": messages,
            "temperature": 0.8,
            "max_tokens": 1200,
            "response_format": {"type": "json_object"},
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
        content = result["choices"][0]["message"]["content"].strip()

        try:
            scenario = json.loads(content)
            scenario["generated_at"] = datetime.utcnow().isoformat()
            return scenario
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI scenario response: {e}")
            return self._fallback_scenario(scenario_type)

    async def _get_ai_evaluation(
        self,
        settings: Any,
        scenario_id: str,
        user_decision: Dict[str, Any],
        scenario_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Call OpenAI API to evaluate a user's decision."""
        selected_option = user_decision.get("selected_option_id")
        options = scenario_context.get("options", [])

        selected_option_data = next((opt for opt in options if opt.get("option_id") == selected_option), None)

        prompt = f"""Evaluate a user's financial decision in the following scenario.

Scenario: {scenario_context.get('title', 'Financial Decision')}
Description: {scenario_context.get('description', '')}

User's Selected Option: {selected_option_data.get('label', selected_option) if selected_option_data else selected_option}
Option Details: {json.dumps(selected_option_data, indent=2) if selected_option_data else 'N/A'}

Evaluate this decision and provide:
1. Immediate financial impact
2. Long-term consequences
3. What the user learned
4. Alternative perspectives
5. Overall assessment

Return a JSON object with:
{{
  "evaluation_score": 0.0-1.0,
  "immediate_impact": {{
    "financial_change": "description",
    "new_balance": "calculated result"
  }},
  "long_term_consequences": [
    "consequence 1",
    "consequence 2"
  ],
  "lessons_learned": [
    "lesson 1",
    "lesson 2"
  ],
  "feedback": "Detailed feedback (2-3 sentences)",
  "alternative_perspectives": [
    "perspective 1",
    "perspective 2"
  ],
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ],
  "overall_assessment": "Overall assessment of the decision"
}}"""

        messages = [
            {
                "role": "system",
                "content": "You are a financial advisor providing constructive feedback on financial decisions. Help users learn from their choices.",
            },
            {"role": "user", "content": prompt},
        ]

        payload = {
            "model": settings.openai_chat_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 800,
            "response_format": {"type": "json_object"},
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
        content = result["choices"][0]["message"]["content"].strip()

        try:
            evaluation = json.loads(content)
            evaluation["evaluated_at"] = datetime.utcnow().isoformat()
            evaluation["scenario_id"] = scenario_id
            return evaluation
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI evaluation response: {e}")
            return self._fallback_evaluation(user_decision, scenario_context)

    def _fallback_scenario(self, scenario_type: str) -> Dict[str, Any]:
        """Generate fallback scenario when AI is unavailable."""
        scenarios = {
            "loan": {
                "scenario_id": "loan_fallback_001",
                "title": "Student Loan Decision",
                "description": "You're considering taking out a $20,000 student loan for college. You need to decide between different loan options and repayment plans.",
                "scenario_type": "loan",
                "initial_situation": {"income": 0, "expenses": 0, "savings": 5000, "debt": 0},
                "options": [
                    {
                        "option_id": "option_1",
                        "label": "Fixed Rate Loan (5% APR)",
                        "description": "Take a fixed-rate loan with predictable monthly payments",
                        "financial_impact": {"debt_change": 20000, "expense_change": 200},
                        "risk_level": "low",
                        "time_horizon": "long",
                    },
                    {
                        "option_id": "option_2",
                        "label": "Variable Rate Loan (3% APR initially)",
                        "description": "Take a variable-rate loan with lower initial payments but uncertain future rates",
                        "financial_impact": {"debt_change": 20000, "expense_change": 150},
                        "risk_level": "medium",
                        "time_horizon": "long",
                    },
                    {
                        "option_id": "option_3",
                        "label": "Work Part-Time Instead",
                        "description": "Avoid the loan by working part-time during college",
                        "financial_impact": {"income_change": 800, "expense_change": 0},
                        "risk_level": "low",
                        "time_horizon": "short",
                    },
                ],
                "learning_objectives": ["Understand loan types and interest rates", "Evaluate debt vs. income trade-offs"],
                "concepts_covered": ["APR", "Fixed vs Variable Rates", "Debt Management"],
            },
            "investment": {
                "scenario_id": "investment_fallback_001",
                "title": "First Investment Decision",
                "description": "You have $1,000 to invest. Choose how to grow your money over the next 5 years.",
                "scenario_type": "investment",
                "initial_situation": {"income": 2000, "expenses": 1500, "savings": 1000, "debt": 0},
                "options": [
                    {
                        "option_id": "option_1",
                        "label": "High-Yield Savings Account (2% APY)",
                        "description": "Safe, guaranteed returns with low risk",
                        "financial_impact": {"savings_change": 1000},
                        "risk_level": "low",
                        "time_horizon": "medium",
                    },
                    {
                        "option_id": "option_2",
                        "label": "Stock Market Index Fund (7% average return)",
                        "description": "Moderate risk with potential for higher returns",
                        "financial_impact": {"savings_change": 1000},
                        "risk_level": "medium",
                        "time_horizon": "long",
                    },
                    {
                        "option_id": "option_3",
                        "label": "Individual Stocks (High Risk/High Reward)",
                        "description": "Invest in individual company stocks",
                        "financial_impact": {"savings_change": 1000},
                        "risk_level": "high",
                        "time_horizon": "long",
                    },
                ],
                "learning_objectives": ["Understand risk vs. return", "Learn about different investment vehicles"],
                "concepts_covered": ["Diversification", "Risk Tolerance", "Compound Interest"],
            },
        }

        default_scenario = {
            "scenario_id": f"{scenario_type}_fallback_001",
            "title": f"{scenario_type.title()} Scenario",
            "description": f"A financial {scenario_type} scenario for learning.",
            "scenario_type": scenario_type,
            "initial_situation": {"income": 2000, "expenses": 1500, "savings": 1000, "debt": 0},
            "options": [],
            "learning_objectives": ["Learn financial concepts"],
            "concepts_covered": [scenario_type],
        }

        return scenarios.get(scenario_type, default_scenario)

    def _fallback_evaluation(
        self,
        user_decision: Dict[str, Any],
        scenario_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """Generate fallback evaluation when AI is unavailable."""
        return {
            "evaluation_score": 0.7,
            "immediate_impact": {
                "financial_change": "Decision will impact your financial situation",
                "new_balance": "Calculated based on selected option",
            },
            "long_term_consequences": [
                "Your decision will affect your financial future",
                "Consider the long-term implications",
            ],
            "lessons_learned": [
                "Financial decisions have consequences",
                "Consider multiple options before deciding",
            ],
            "feedback": "Good decision-making process. Consider all factors before making financial choices.",
            "alternative_perspectives": [
                "Other options may have different benefits",
                "Consider your personal financial goals",
            ],
            "recommendations": [
                "Continue learning about financial literacy",
                "Practice making informed financial decisions",
            ],
            "overall_assessment": "Your decision shows thoughtful consideration of the options.",
            "evaluated_at": datetime.utcnow().isoformat(),
            "scenario_id": scenario_context.get("scenario_id", "unknown"),
        }
