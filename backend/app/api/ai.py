"""
Unified AI Services API - Consolidated AI Module Interface

This module provides a unified interface for all AI-powered services,
exposing them through a clean, consistent API that other parts of the
application can use.

All AI services are centralized here for easy access and consistent
error handling, logging, and configuration management.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.ai.behavior_prediction import BehaviorPredictionModel
from app.ai.budget_forecasting import BudgetForecastingEngine
from app.ai.name_validator import NameValidatorAI
from app.ai.nlp_command import NLPCommandEngine

logger = logging.getLogger(__name__)


class UnifiedAIService:
    """
    Unified service interface for all AI modules.
    
    Provides a single entry point for all AI-powered features:
    - NLP Command Processing
    - Behavior Prediction
    - Name Validation and Suggestions
    - Budget Forecasting
    
    This class manages service instances and provides consistent
    error handling, logging, and configuration.
    """

    def __init__(self) -> None:
        """Initialize all AI service instances."""
        self._nlp_engine: Optional[NLPCommandEngine] = None
        self._behavior_model: Optional[BehaviorPredictionModel] = None
        self._name_validator: Optional[NameValidatorAI] = None
        self._budget_engine: Optional[BudgetForecastingEngine] = None
        
        logger.info("UnifiedAIService initialized")

    @property
    def nlp_command(self) -> NLPCommandEngine:
        """
        Get NLP Command Engine instance.
        
        Returns:
            NLPCommandEngine instance (lazy-loaded)
        """
        if self._nlp_engine is None:
            self._nlp_engine = NLPCommandEngine()
            logger.debug("NLPCommandEngine instance created")
        return self._nlp_engine

    @property
    def behavior_prediction(self) -> BehaviorPredictionModel:
        """
        Get Behavior Prediction Model instance.
        
        Returns:
            BehaviorPredictionModel instance (lazy-loaded)
        """
        if self._behavior_model is None:
            self._behavior_model = BehaviorPredictionModel()
            logger.debug("BehaviorPredictionModel instance created")
        return self._behavior_model

    @property
    def name_validator(self) -> NameValidatorAI:
        """
        Get Name Validator AI instance.
        
        Returns:
            NameValidatorAI instance (lazy-loaded)
        """
        if self._name_validator is None:
            self._name_validator = NameValidatorAI()
            logger.debug("NameValidatorAI instance created")
        return self._name_validator

    @property
    def budget_forecasting(self) -> BudgetForecastingEngine:
        """
        Get Budget Forecasting Engine instance.
        
        Returns:
            BudgetForecastingEngine instance (lazy-loaded)
        """
        if self._budget_engine is None:
            self._budget_engine = BudgetForecastingEngine()
            logger.debug("BudgetForecastingEngine instance created")
        return self._budget_engine

    async def process_nlp_command(
        self,
        command: str,
        user_id: str,
        session_id: Optional[str] = None,
        pet_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process a natural language command.
        
        Wrapper around NLPCommandEngine.process_command with error handling.
        
        Args:
            command: User's natural language command
            user_id: User identifier
            session_id: Optional session ID for context
            pet_context: Optional pet state context
        
        Returns:
            Parsed command result dictionary
        
        Example:
            >>> result = await ai_service.process_nlp_command(
            ...     "feed my pet tuna",
            ...     user_id="user123"
            ... )
        """
        try:
            return await self.nlp_command.process_command(
                command=command,
                user_id=user_id,
                session_id=session_id,
                pet_context=pet_context,
            )
        except Exception as e:
            logger.error(f"Error processing NLP command: {e}", exc_info=True)
            return {
                "action": "unknown",
                "confidence": 0.0,
                "parameters": {},
                "intent": "Error processing command",
                "needs_clarification": True,
                "suggestions": ["Please try rephrasing your command"],
                "error": str(e),
                "fallback_used": True,
            }

    async def predict_behavior(
        self,
        pet_id: str,
        interaction_history: List[Dict[str, Any]],
        forecast_days: int = 7,
        current_stats: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Predict future pet behavior patterns.
        
        Wrapper around BehaviorPredictionModel.predict_behavior with error handling.
        
        Args:
            pet_id: Pet identifier
            interaction_history: List of interaction records
            forecast_days: Number of days to forecast
            current_stats: Optional current pet statistics
        
        Returns:
            Behavior prediction results
        
        Example:
            >>> result = await ai_service.predict_behavior(
            ...     pet_id="pet123",
            ...     interaction_history=[...],
            ...     forecast_days=7
            ... )
        """
        try:
            return await self.behavior_prediction.predict_behavior(
                pet_id=pet_id,
                interaction_history=interaction_history,
                forecast_days=forecast_days,
                current_stats=current_stats,
            )
        except Exception as e:
            logger.error(f"Error predicting behavior: {e}", exc_info=True)
            return {
                "mood_forecast": [],
                "activity_prediction": [],
                "patterns_identified": ["Error analyzing behavior patterns"],
                "recommendations": ["Unable to generate predictions"],
                "confidence_score": 0.0,
                "trends": {},
                "error": str(e),
            }

    async def validate_and_suggest_name(
        self,
        input_name: str,
        pet_species: Optional[str] = None,
        check_uniqueness: bool = False,
        existing_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Validate a pet name and generate creative suggestions.
        
        Wrapper around NameValidatorAI.validate_and_suggest with error handling.
        
        Args:
            input_name: Name to validate
            pet_species: Optional pet species for contextual suggestions
            check_uniqueness: Whether to check for duplicates
            existing_names: Optional list of existing names
        
        Returns:
            Validation result with suggestions
        
        Example:
            >>> result = await ai_service.validate_and_suggest_name(
            ...     "Fluffy",
            ...     pet_species="feline"
            ... )
        """
        try:
            return await self.name_validator.validate_and_suggest(
                input_name=input_name,
                pet_species=pet_species,
                check_uniqueness=check_uniqueness,
                existing_names=existing_names,
            )
        except Exception as e:
            logger.error(f"Error validating name: {e}", exc_info=True)
            return {
                "valid": False,
                "errors": [f"Validation error: {str(e)}"],
                "suggestions": [],
                "validation_details": {},
                "error": str(e),
            }

    async def generate_budget_forecast(
        self,
        transactions: List[Dict[str, Any]],
        forecast_months: int = 6,
        monthly_budget: Optional[float] = None,
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate comprehensive budget forecast with trends and recommendations.
        
        Wrapper around BudgetForecastingEngine.generate_forecast with error handling.
        
        Args:
            transactions: List of transaction records
            forecast_months: Number of months to forecast
            monthly_budget: Optional budget limit
            user_id: Optional user ID for personalization
        
        Returns:
            Comprehensive forecast results
        
        Example:
            >>> forecast = await ai_service.generate_budget_forecast(
            ...     transactions=[...],
            ...     forecast_months=6,
            ...     monthly_budget=500.0
            ... )
        """
        try:
            return await self.budget_forecasting.generate_forecast(
                transactions=transactions,
                forecast_months=forecast_months,
                monthly_budget=monthly_budget,
                user_id=user_id,
            )
        except Exception as e:
            logger.error(f"Error generating budget forecast: {e}", exc_info=True)
            return {
                "monthly_forecast": [],
                "category_forecast": {},
                "trends": [{"type": "error", "description": f"Forecast error: {str(e)}"}],
                "recommendations": ["Unable to generate forecast"],
                "confidence_score": 0.0,
                "budget_alerts": [],
                "error": str(e),
            }


# Global instance for easy access
_unified_ai_service: Optional[UnifiedAIService] = None


def get_unified_ai_service() -> UnifiedAIService:
    """
    Get the global UnifiedAIService instance (singleton pattern).
    
    Returns:
        UnifiedAIService instance
    """
    global _unified_ai_service
    if _unified_ai_service is None:
        _unified_ai_service = UnifiedAIService()
    return _unified_ai_service
