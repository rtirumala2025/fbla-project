"""
AI Systems Module - Consolidated AI Services

This module contains all AI-powered systems for the virtual pet platform:
- NLP Command Engine: Context-aware natural language command processing
- Behavior Prediction Model: Pet behavior pattern analysis and forecasting
- Name Validator & Suggestions: AI-powered name validation with creative suggestions
- Budget Forecasting Engine: Financial prediction and trend analysis

All AI services are designed with:
- Comprehensive docstrings explaining algorithms
- Fallback mechanisms for offline/API-unavailable scenarios
- Error handling and logging
- Context-aware processing where applicable
"""

from app.ai.nlp_command import NLPCommandEngine
from app.ai.behavior_prediction import BehaviorPredictionModel
from app.ai.name_validator import NameValidatorAI
from app.ai.budget_forecasting import BudgetForecastingEngine

__all__ = [
    "NLPCommandEngine",
    "BehaviorPredictionModel",
    "NameValidatorAI",
    "BudgetForecastingEngine",
]
