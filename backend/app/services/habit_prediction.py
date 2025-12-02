"""Service for AI-powered user habit prediction."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from typing import Any, Dict, List

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class HabitPredictionService:
    """Service for predicting user habits based on interaction patterns."""

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(timeout=30.0)

    async def predict_habits(
        self,
        user_id: str,
        interaction_history: List[Dict[str, Any]],
        pet_stats_history: List[Dict[str, Any]],
        forecast_days: int = 14,
    ) -> Dict[str, Any]:
        """
        Predict user habits based on interaction patterns and pet care history.

        Args:
            user_id: User identifier
            interaction_history: List of user interactions with pet
            pet_stats_history: Historical pet statistics
            forecast_days: Number of days to forecast habits (default: 14)

        Returns:
            Dictionary with predicted habits, patterns, and recommendations
        """
        settings = get_settings()

        if not settings.openai_api_key:
            logger.warning("OPENAI_API_KEY not configured. Returning fallback predictions.")
            return self._fallback_habit_prediction(interaction_history, forecast_days)

        # Prepare habit analysis data
        habit_data = self._prepare_habit_data(interaction_history, pet_stats_history)

        try:
            # Get AI predictions
            predictions = await self._get_ai_habit_predictions(settings, habit_data, user_id, forecast_days)
            return predictions
        except Exception as e:
            logger.error(f"Failed to get AI habit predictions: {e}")
            return self._fallback_habit_prediction(interaction_history, forecast_days)

    def _prepare_habit_data(
        self,
        interaction_history: List[Dict[str, Any]],
        pet_stats_history: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Prepare data for habit analysis."""
        if not interaction_history:
            return {
                "total_interactions": 0,
                "daily_patterns": {},
                "action_frequency": {},
                "care_consistency": 0.0,
            }

        # Analyze daily patterns
        daily_patterns: Dict[str, Dict[str, Any]] = {}
        action_frequency: Dict[str, int] = {}

        for interaction in interaction_history:
            timestamp = interaction.get("timestamp", "")
            action = interaction.get("action", "unknown")

            try:
                dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                day_of_week = dt.strftime("%A")
                hour = dt.hour

                # Track patterns by day of week
                if day_of_week not in daily_patterns:
                    daily_patterns[day_of_week] = {}
                day_pattern = daily_patterns[day_of_week]
                if not isinstance(day_pattern, dict):
                    day_pattern = {}
                    daily_patterns[day_of_week] = day_pattern
                day_pattern[action] = day_pattern.get(action, 0) + 1  # type: ignore[assignment]

                # Track action frequency
                action_frequency[action] = action_frequency.get(action, 0) + 1

                # Track time of day patterns
                time_period = "morning" if 6 <= hour < 12 else "afternoon" if 12 <= hour < 18 else "evening" if 18 <= hour < 22 else "night"
                if "time_periods" not in day_pattern:
                    day_pattern["time_periods"] = {}
                time_periods = day_pattern["time_periods"]
                if isinstance(time_periods, dict):
                    time_periods[time_period] = time_periods.get(time_period, 0) + 1  # type: ignore[assignment]
            except (ValueError, AttributeError):
                continue

        # Calculate care consistency (how regularly user interacts)
        if len(interaction_history) > 1:
            timestamps = []
            for interaction in interaction_history:
                try:
                    timestamp = interaction.get("timestamp", "")
                    dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
                    timestamps.append(dt)
                except (ValueError, AttributeError):
                    continue

            if len(timestamps) > 1:
                timestamps.sort()
                intervals = [(timestamps[i + 1] - timestamps[i]).total_seconds() / 3600 for i in range(len(timestamps) - 1)]
                avg_interval = sum(intervals) / len(intervals) if intervals else 24
                # Consistency score: lower interval = more consistent (max score 1.0 for daily interactions)
                consistency = min(1.0, 24.0 / max(avg_interval, 1.0))
            else:
                consistency = 0.5
        else:
            consistency = 0.3

        return {
            "total_interactions": len(interaction_history),
            "daily_patterns": daily_patterns,
            "action_frequency": action_frequency,
            "care_consistency": consistency,
            "most_active_day": max(daily_patterns.items(), key=lambda x: sum(x[1].values()) if isinstance(x[1], dict) else 0)[0] if daily_patterns else None,
            "most_common_action": max(action_frequency.items(), key=lambda x: x[1])[0] if action_frequency else None,
        }

    async def _get_ai_habit_predictions(
        self,
        settings: Any,
        habit_data: Dict[str, Any],
        user_id: str,
        forecast_days: int,
    ) -> Dict[str, Any]:
        """Call OpenAI API to predict user habits."""
        prompt = f"""Analyze the following user pet care patterns and predict future habits.

User Interaction Data:
- Total Interactions: {habit_data['total_interactions']}
- Care Consistency Score: {habit_data['care_consistency']:.2f} (0.0-1.0, higher = more consistent)
- Most Active Day: {habit_data.get('most_active_day', 'N/A')}
- Most Common Action: {habit_data.get('most_common_action', 'N/A')}
- Action Frequency: {json.dumps(habit_data['action_frequency'])}

Daily Patterns:
{json.dumps(habit_data['daily_patterns'], indent=2)}

Based on this data, predict the user's pet care habits for the next {forecast_days} days.

Return a JSON object with:
{{
  "predicted_habits": [
    {{
      "habit_type": "feeding" | "playing" | "cleaning" | "resting" | "general_care",
      "frequency": "daily" | "every_other_day" | "weekly" | "irregular",
      "likely_times": ["morning", "afternoon", "evening"],
      "confidence": 0.0-1.0,
      "description": "Brief description of predicted habit"
    }}
  ],
  "patterns_identified": [
    "pattern description 1",
    "pattern description 2"
  ],
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ],
  "forecast_summary": "Overall summary of predicted care patterns"
}}"""

        messages = [
            {
                "role": "system",
                "content": "You are a behavioral analyst specializing in pet care habits. Analyze interaction patterns to predict future user behavior and provide actionable recommendations.",
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

        # Parse JSON response
        try:
            predictions = json.loads(content)
            # Ensure all required fields exist
            return {
                "predicted_habits": predictions.get("predicted_habits", []),
                "patterns_identified": predictions.get("patterns_identified", []),
                "recommendations": predictions.get("recommendations", []),
                "forecast_summary": predictions.get("forecast_summary", "Based on current patterns, user shows consistent care habits."),
                "generated_at": datetime.utcnow().isoformat(),
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI habit prediction response: {e}")
            return self._fallback_habit_prediction([], forecast_days)

    def _fallback_habit_prediction(
        self,
        interaction_history: List[Dict[str, Any]],
        forecast_days: int,
    ) -> Dict[str, Any]:
        """Generate fallback habit predictions."""
        if not interaction_history:
            return {
                "predicted_habits": [
                    {
                        "habit_type": "general_care",
                        "frequency": "irregular",
                        "likely_times": ["morning", "evening"],
                        "confidence": 0.5,
                        "description": "Insufficient data to predict habits. Start interacting with your pet regularly to build patterns.",
                    }
                ],
                "patterns_identified": ["Insufficient interaction history"],
                "recommendations": [
                    "Interact with your pet daily to establish care routines",
                    "Set reminders for feeding and playtime",
                    "Track your interactions to identify patterns",
                ],
                "forecast_summary": "Limited interaction data available. Regular care will help establish predictable habits.",
                "generated_at": datetime.utcnow().isoformat(),
            }

        # Analyze basic patterns
        action_counts: Dict[str, int] = {}
        for interaction in interaction_history:
            action = interaction.get("action", "unknown")
            action_counts[action] = action_counts.get(action, 0) + 1

        most_common = max(action_counts.items(), key=lambda x: x[1])[0] if action_counts else "unknown"
        total = len(interaction_history)
        avg_per_day = total / max(forecast_days, 1)

        predicted_habits = []
        if action_counts.get("feed", 0) > 0:
            predicted_habits.append({
                "habit_type": "feeding",
                "frequency": "daily" if avg_per_day >= 0.8 else "every_other_day" if avg_per_day >= 0.4 else "irregular",
                "likely_times": ["morning", "evening"],
                "confidence": 0.7,
                "description": f"User shows feeding activity ({action_counts.get('feed', 0)} times in history)",
            })

        if action_counts.get("play", 0) > 0:
            predicted_habits.append({
                "habit_type": "playing",
                "frequency": "daily" if avg_per_day >= 0.8 else "every_other_day",
                "likely_times": ["afternoon", "evening"],
                "confidence": 0.65,
                "description": f"User engages in play activities ({action_counts.get('play', 0)} times)",
            })

        if not predicted_habits:
            predicted_habits.append({
                "habit_type": "general_care",
                "frequency": "irregular",
                "likely_times": ["morning"],
                "confidence": 0.5,
                "description": "Basic care patterns detected",
            })

        return {
            "predicted_habits": predicted_habits,
            "patterns_identified": [
                f"Most common action: {most_common}",
                f"Average interactions per day: {avg_per_day:.1f}",
            ],
            "recommendations": [
                "Maintain consistent daily interactions",
                "Establish regular feeding and play schedules",
                "Monitor pet stats to optimize care timing",
            ],
            "forecast_summary": f"Based on {total} interactions, user shows {most_common} as the primary care activity.",
            "generated_at": datetime.utcnow().isoformat(),
        }
