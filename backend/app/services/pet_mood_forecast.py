"""Service for AI-powered pet mood forecasting."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class PetMoodForecastService:
    """Service for generating AI-powered pet mood forecasts."""

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(timeout=30.0)

    async def forecast_mood(
        self,
        pet_id: str,
        current_stats: Dict[str, Any],
        interaction_history: List[Dict[str, Any]],
        forecast_days: int = 7,
    ) -> List[Dict[str, Any]]:
        """
        Generate mood forecast for a pet based on current stats and interaction history.

        Args:
            pet_id: Pet identifier
            current_stats: Current pet statistics (hunger, happiness, energy, etc.)
            interaction_history: List of recent interactions
            forecast_days: Number of days to forecast (default: 7)

        Returns:
            List of mood forecast entries with date, predicted_mood, confidence, and reasoning
        """
        settings = get_settings()

        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured. Returning fallback forecast.")
            return self._fallback_forecast(current_stats, forecast_days)

        # Prepare data for AI analysis
        analysis_data = self._prepare_analysis_data(current_stats, interaction_history)

        try:
            # Get AI forecast
            forecast = await self._get_ai_forecast(settings, analysis_data, pet_id, forecast_days)
            return forecast
        except Exception as e:
            logger.error(f"Failed to get AI forecast: {e}")
            return self._fallback_forecast(current_stats, forecast_days)

    def _prepare_analysis_data(
        self,
        current_stats: Dict[str, Any],
        interaction_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Prepare data for AI analysis."""
        # Analyze interaction patterns
        recent_interactions = interaction_history[-10:] if len(interaction_history) > 10 else interaction_history
        interaction_patterns: Dict[str, int] = {}
        for interaction in recent_interactions:
            action = interaction.get("action", "unknown")
            interaction_patterns[action] = interaction_patterns.get(action, 0) + 1

        # Calculate trends
        stats_trends = {}
        if len(interaction_history) >= 2:
            # Compare recent stats if available
            latest = interaction_history[-1].get("pet_stats_after", {})
            previous = interaction_history[-2].get("pet_stats_after", {})
            for stat in ["hunger", "happiness", "energy", "cleanliness", "health"]:
                if stat in latest and stat in previous:
                    stats_trends[stat] = latest[stat] - previous[stat]

        return {
            "current_stats": current_stats,
            "interaction_patterns": interaction_patterns,
            "recent_interactions_count": len(recent_interactions),
            "stats_trends": stats_trends,
            "most_common_action": max(interaction_patterns.items(), key=lambda x: x[1])[0] if interaction_patterns else None,
        }

    async def _get_ai_forecast(
        self,
        settings: Any,
        analysis_data: Dict[str, Any],
        pet_id: str,
        forecast_days: int,
    ) -> List[Dict[str, Any]]:
        """Call OpenAI API to generate mood forecast."""
        prompt = f"""Analyze the following pet data and generate a {forecast_days}-day mood forecast.

Current Pet Stats:
- Hunger: {analysis_data['current_stats'].get('hunger', 70)}/100
- Happiness: {analysis_data['current_stats'].get('happiness', 70)}/100
- Energy: {analysis_data['current_stats'].get('energy', 70)}/100
- Cleanliness: {analysis_data['current_stats'].get('cleanliness', 70)}/100
- Health: {analysis_data['current_stats'].get('health', 80)}/100
- Current Mood: {analysis_data['current_stats'].get('mood', 'happy')}

Recent Interaction Patterns:
- Most Common Action: {analysis_data.get('most_common_action', 'N/A')}
- Action Distribution: {json.dumps(analysis_data['interaction_patterns'])}
- Recent Interactions: {analysis_data['recent_interactions_count']}

Stats Trends (recent changes):
{json.dumps(analysis_data['stats_trends'])}

Based on this data, predict the pet's mood for each of the next {forecast_days} days.
Consider:
1. Current stat levels and trends
2. Interaction patterns and care frequency
3. Natural pet behavior cycles
4. Potential needs (feeding, play, rest, cleaning)

Return a JSON array of forecast entries, each with:
- date: YYYY-MM-DD format
- predicted_mood: one of (ecstatic, happy, content, sleepy, anxious, distressed, sad, moody)
- confidence: 0.0 to 1.0
- reasoning: brief explanation (1-2 sentences)

Example format:
[
  {{"date": "2024-01-15", "predicted_mood": "happy", "confidence": 0.85, "reasoning": "Well-fed and active, likely to remain happy"}},
  {{"date": "2024-01-16", "predicted_mood": "content", "confidence": 0.75, "reasoning": "Stable care routine, maintaining good mood"}}
]"""

        messages = [
            {
                "role": "system",
                "content": "You are a pet behavior expert. Analyze pet statistics and interaction patterns to predict future mood states with high accuracy.",
            },
            {"role": "user", "content": prompt},
        ]

        payload = {
            "model": settings.openai_chat_model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000,
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
            # Handle both array and object with array
            parsed = json.loads(content)
            if isinstance(parsed, dict):
                forecast = parsed.get("forecast", parsed.get("forecasts", []))
            else:
                forecast = parsed

            # Validate and format forecast entries
            formatted_forecast = []
            base_date = datetime.now().date()
            forecast_list = forecast if isinstance(forecast, list) else [forecast] if forecast else []
            
            for i, entry in enumerate(forecast_list[:forecast_days]):
                if isinstance(entry, dict):
                    forecast_date = base_date + timedelta(days=i + 1)
                    formatted_forecast.append({
                        "date": entry.get("date", forecast_date.isoformat()),
                        "predicted_mood": entry.get("predicted_mood", "happy"),
                        "confidence": min(max(float(entry.get("confidence", 0.7)), 0.0), 1.0),
                        "reasoning": entry.get("reasoning", "Based on current patterns"),
                    })
            
            # If we don't have enough entries, fill with fallback
            while len(formatted_forecast) < forecast_days:
                forecast_date = base_date + timedelta(days=len(formatted_forecast) + 1)
                formatted_forecast.append({
                    "date": forecast_date.isoformat(),
                    "predicted_mood": "happy",
                    "confidence": 0.6,
                    "reasoning": "Based on current patterns",
                })
            
            return formatted_forecast
        except (json.JSONDecodeError, KeyError, ValueError) as e:
            logger.error(f"Failed to parse AI forecast response: {e}")
            return self._fallback_forecast(analysis_data["current_stats"], forecast_days)

    def _fallback_forecast(
        self,
        current_stats: Dict[str, Any],
        forecast_days: int,
    ) -> List[Dict[str, Any]]:
        """Generate fallback forecast based on current stats."""
        forecast = []
        base_date = datetime.now().date()
        current_mood = current_stats.get("mood", "happy")
        avg_stat = (
            current_stats.get("hunger", 70)
            + current_stats.get("happiness", 70)
            + current_stats.get("energy", 70)
            + current_stats.get("cleanliness", 70)
            + current_stats.get("health", 80)
        ) / 5

        # Determine base mood from average stats
        if avg_stat >= 85:
            base_predicted_mood = "ecstatic"
            confidence = 0.8
        elif avg_stat >= 75:
            base_predicted_mood = "happy"
            confidence = 0.75
        elif avg_stat >= 65:
            base_predicted_mood = "content"
            confidence = 0.7
        elif avg_stat >= 50:
            base_predicted_mood = current_mood
            confidence = 0.65
        else:
            base_predicted_mood = "anxious" if avg_stat >= 40 else "distressed"
            confidence = 0.6

        for i in range(forecast_days):
            forecast_date = base_date + timedelta(days=i + 1)
            # Slight variation in mood prediction
            mood_variation = ["happy", "content", base_predicted_mood]
            predicted_mood = mood_variation[i % len(mood_variation)]

            forecast.append({
                "date": forecast_date.isoformat(),
                "predicted_mood": predicted_mood,
                "confidence": max(0.5, confidence - (i * 0.05)),  # Decreasing confidence over time
                "reasoning": f"Based on current average stats ({avg_stat:.0f}/100), pet is likely to be {predicted_mood}",
            })

        return forecast
