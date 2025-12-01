"""Service for AI-powered pet behavior analysis and prediction."""
from __future__ import annotations

import json
import logging
from typing import Any, Dict, List

import httpx

from app.core.config import get_settings
from app.schemas.ai import InteractionHistoryItem, PetBehaviorRequest, PetBehaviorResponse

logger = logging.getLogger(__name__)


class PetBehaviorAIService:
    """Service for analyzing pet behavior and predicting future patterns."""

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(timeout=30.0)

    async def analyze_behavior(
        self,
        request: PetBehaviorRequest,
    ) -> PetBehaviorResponse:
        """
        Analyze pet interaction history and predict future behavior.

        Args:
            request: Pet behavior request with pet ID and interaction history

        Returns:
            PetBehaviorResponse with mood forecast and activity predictions
        """
        settings = get_settings()

        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured. Returning fallback predictions.")
            return self._fallback_behavior_analysis(request)

        # Prepare interaction summary for AI
        interaction_summary = self._prepare_interaction_summary(request.interaction_history)

        try:
            # Get AI predictions
            predictions = await self._get_ai_predictions(settings, interaction_summary, request.pet_id)

            mood_forecast = predictions.get("mood_forecast", [])
            activity_prediction = predictions.get("activity_prediction", [])

            # Ensure we have at least some predictions
            if not mood_forecast:
                mood_forecast = self._generate_fallback_mood_forecast(request.interaction_history)
            if not activity_prediction:
                activity_prediction = self._generate_fallback_activity_prediction(request.interaction_history)

        except Exception as e:
            logger.error(f"Failed to get AI predictions: {e}")
            mood_forecast = self._generate_fallback_mood_forecast(request.interaction_history)
            activity_prediction = self._generate_fallback_activity_prediction(request.interaction_history)

        return PetBehaviorResponse(
            mood_forecast=mood_forecast[:10],  # Limit to 10 predictions
            activity_prediction=activity_prediction[:10],
        )

    def _prepare_interaction_summary(self, interactions: List[InteractionHistoryItem]) -> Dict[str, Any]:
        """Prepare a summary of interactions for AI analysis."""
        if not interactions:
            return {"total_interactions": 0, "action_counts": {}, "recent_actions": []}

        action_counts: Dict[str, int] = {}
        for interaction in interactions:
            action_counts[interaction.action] = action_counts.get(interaction.action, 0) + 1

        # Get recent actions (last 10)
        recent_actions = [interaction.action for interaction in interactions[-10:]]

        # Analyze stats trends if available
        stats_trends = {}
        if interactions and interactions[-1].pet_stats_after:
            latest_stats = interactions[-1].pet_stats_after
            stats_trends = {
                "hunger": latest_stats.get("hunger", 70),
                "happiness": latest_stats.get("happiness", 70),
                "energy": latest_stats.get("energy", 70),
                "cleanliness": latest_stats.get("cleanliness", 70),
                "health": latest_stats.get("health", 80),
            }

        return {
            "total_interactions": len(interactions),
            "action_counts": action_counts,
            "recent_actions": recent_actions,
            "most_common_action": max(action_counts.items(), key=lambda x: x[1])[0] if action_counts else None,
            "stats_trends": stats_trends,
        }

    async def _get_ai_predictions(
        self,
        settings: Any,
        interaction_summary: Dict[str, Any],
        pet_id: str,
    ) -> Dict[str, List[str]]:
        """Call OpenAI API to predict pet behavior."""
        prompt = f"""Analyze the following pet interaction history and predict future behavior patterns.

Interaction Summary:
- Total Interactions: {interaction_summary['total_interactions']}
- Most Common Action: {interaction_summary.get('most_common_action', 'N/A')}
- Action Distribution: {json.dumps(interaction_summary['action_counts'])}
- Recent Actions: {', '.join(interaction_summary['recent_actions'][-5:])}
- Current Stats: {json.dumps(interaction_summary.get('stats_trends', {}))}

Based on this data, predict:
1. Mood Forecast: List 5-10 predicted mood states for the upcoming week (e.g., "happy on Monday", "energetic on Tuesday")
2. Activity Prediction: List 5-10 predicted activity patterns (e.g., "likely to need feeding in morning", "will be playful in afternoon")

Return your response as a JSON object with two arrays:
{{
  "mood_forecast": ["mood prediction 1", "mood prediction 2", ...],
  "activity_prediction": ["activity prediction 1", "activity prediction 2", ...]
}}"""

        messages = [
            {
                "role": "system",
                "content": "You are a pet behavior analyst. Analyze interaction patterns and predict future pet behavior based on historical data.",
            },
            {"role": "user", "content": prompt},
        ]

        payload = {
            "model": settings.openai_chat_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 500,
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

        # Parse JSON response
        try:
            predictions = json.loads(content)
            return {
                "mood_forecast": predictions.get("mood_forecast", []),
                "activity_prediction": predictions.get("activity_prediction", []),
            }
        except json.JSONDecodeError:
            logger.error("Failed to parse AI response as JSON")
            return {"mood_forecast": [], "activity_prediction": []}

    def _generate_fallback_mood_forecast(self, interactions: List[InteractionHistoryItem]) -> List[str]:
        """Generate fallback mood forecast based on interaction patterns."""
        if not interactions:
            return ["happy (default state)", "content (baseline mood)"]

        # Analyze recent interactions
        recent_actions = [i.action for i in interactions[-5:]]
        action_counts: Dict[str, int] = {}
        for action in recent_actions:
            action_counts[action] = action_counts.get(action, 0) + 1

        forecasts = []
        if action_counts.get("feed", 0) > 2:
            forecasts.append("happy (well-fed)")
        if action_counts.get("play", 0) > 2:
            forecasts.append("energetic (active play)")
        if action_counts.get("bathe", 0) > 0:
            forecasts.append("content (clean and comfortable)")
        if action_counts.get("rest", 0) > 1:
            forecasts.append("sleepy (needs rest)")

        # Add default forecasts if we don't have enough
        default_forecasts = ["happy (baseline)", "content (stable mood)", "energetic (active period)"]
        for forecast in default_forecasts:
            if forecast not in forecasts:
                forecasts.append(forecast)
            if len(forecasts) >= 5:
                break

        return forecasts[:10]

    def _generate_fallback_activity_prediction(self, interactions: List[InteractionHistoryItem]) -> List[str]:
        """Generate fallback activity predictions based on interaction patterns."""
        if not interactions:
            return ["regular feeding schedule", "daily playtime recommended"]

        # Analyze patterns
        action_counts: Dict[str, int] = {}
        for interaction in interactions:
            action_counts[interaction.action] = action_counts.get(interaction.action, 0) + 1

        predictions = []

        # Predict based on most common actions
        if action_counts.get("feed", 0) > 0:
            predictions.append("likely to need feeding in the morning")
        if action_counts.get("play", 0) > 0:
            predictions.append("will be playful in the afternoon")
        if action_counts.get("bathe", 0) > 0:
            predictions.append("may need cleaning soon")
        if action_counts.get("rest", 0) > 0:
            predictions.append("will need rest after activities")

        # Add default predictions
        default_predictions = [
            "regular interaction schedule recommended",
            "monitor hunger levels daily",
            "maintain consistent care routine",
        ]
        for prediction in default_predictions:
            if prediction not in predictions:
                predictions.append(prediction)
            if len(predictions) >= 5:
                break

        return predictions[:10]

    def _fallback_behavior_analysis(self, request: PetBehaviorRequest) -> PetBehaviorResponse:
        """Return fallback behavior analysis when OpenAI is not available."""
        mood_forecast = self._generate_fallback_mood_forecast(request.interaction_history)
        activity_prediction = self._generate_fallback_activity_prediction(request.interaction_history)
        return PetBehaviorResponse(mood_forecast=mood_forecast, activity_prediction=activity_prediction)
