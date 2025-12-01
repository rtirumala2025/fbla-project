"""
Behavior Prediction Model - Pet Behavior Analysis and Forecasting

This module provides advanced behavior prediction capabilities for virtual pets,
analyzing interaction patterns to forecast future behaviors and mood states.

Features:
- Interaction pattern analysis from historical data
- Mood forecasting based on care patterns
- Activity prediction for upcoming periods
- Statistical trend analysis
- AI-powered pattern recognition with rule-based fallback
- Confidence scoring for all predictions

Algorithm Overview:
1. Analyzes interaction history to identify patterns and trends
2. Calculates statistical metrics (frequency, timing, correlations)
3. Uses AI to recognize complex behavioral patterns
4. Generates time-series predictions for mood and activity
5. Provides confidence scores based on data quality and pattern strength

Example Usage:
    model = BehaviorPredictionModel()
    result = await model.predict_behavior(
        pet_id="pet123",
        interaction_history=[...],
        forecast_days=7
    )
    # Returns predictions for mood and activity patterns
"""

from __future__ import annotations

import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class BehaviorPredictionModel:
    """
    Advanced behavior prediction model for virtual pet interactions.
    
    Analyzes historical interaction data to predict:
    - Future mood states based on care patterns
    - Activity patterns and needs
    - Optimal care timing
    - Behavioral trends
    
    The model combines statistical analysis with AI-powered pattern recognition
    to provide accurate, actionable predictions.
    """

    # Valid pet actions for analysis
    VALID_ACTIONS = ["feed", "play", "bathe", "rest", "shop"]

    # Mood states that can be predicted
    MOOD_STATES = ["ecstatic", "happy", "content", "anxious", "distressed"]

    def __init__(self, client: Optional[httpx.AsyncClient] = None) -> None:
        """
        Initialize the Behavior Prediction Model.
        
        Args:
            client: Optional HTTP client for API calls. If not provided,
                   a new client will be created per request.
        """
        self._client = client
        logger.info("BehaviorPredictionModel initialized")

    async def predict_behavior(
        self,
        pet_id: str,
        interaction_history: List[Dict[str, Any]],
        forecast_days: int = 7,
        current_stats: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Predict future pet behavior based on interaction history.
        
        Main prediction method that:
        1. Analyzes interaction patterns
        2. Identifies trends and correlations
        3. Generates mood forecasts
        4. Predicts activity patterns
        5. Calculates confidence scores
        
        Args:
            pet_id: Pet identifier
            interaction_history: List of interaction records, each containing:
                                - action: Action type (feed, play, etc.)
                                - timestamp: ISO format timestamp
                                - pet_stats_before: Optional stats before interaction
                                - pet_stats_after: Optional stats after interaction
            forecast_days: Number of days ahead to predict (default: 7)
            current_stats: Optional current pet statistics for context
        
        Returns:
            Dictionary containing:
            - mood_forecast: List of predicted mood states with dates
            - activity_prediction: List of predicted activity patterns
            - patterns_identified: List of identified behavioral patterns
            - confidence_score: Overall confidence (0.0-1.0)
            - trends: Statistical trend analysis
            - recommendations: Actionable recommendations
        
        Example:
            >>> result = await model.predict_behavior(
            ...     pet_id="pet123",
            ...     interaction_history=[
            ...         {"action": "feed", "timestamp": "2024-01-01T10:00:00Z"},
            ...         {"action": "play", "timestamp": "2024-01-01T14:00:00Z"}
            ...     ],
            ...     forecast_days=7
            ... )
        """
        if not interaction_history:
            logger.warning(f"No interaction history provided for pet {pet_id}")
            return self._generate_empty_predictions(forecast_days)

        # Analyze interaction patterns
        pattern_analysis = self._analyze_patterns(interaction_history)
        
        # Get AI-powered predictions if available
        settings = get_settings()
        ai_enabled = bool(
            getattr(settings, "openrouter_api_key", None) or 
            getattr(settings, "openai_api_key", None)
        )

        if ai_enabled:
            try:
                ai_predictions = await self._get_ai_predictions(
                    pet_id, pattern_analysis, current_stats, forecast_days, settings
                )
                logger.info(f"AI predictions generated for pet {pet_id}")
                
                # Combine AI predictions with statistical analysis
                return self._combine_predictions(ai_predictions, pattern_analysis, forecast_days)
            except Exception as e:
                logger.warning(f"AI prediction failed, using statistical analysis: {e}")

        # Use statistical/rule-based predictions
        return self._generate_statistical_predictions(pattern_analysis, current_stats, forecast_days)

    def _analyze_patterns(self, interaction_history: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Analyze interaction history to identify patterns and trends.
        
        Statistical analysis algorithm:
        1. Counts action frequencies
        2. Analyzes timing patterns (time of day, day of week)
        3. Calculates intervals between interactions
        4. Tracks stat changes from interactions
        5. Identifies correlation patterns
        
        Args:
            interaction_history: List of interaction records
        
        Returns:
            Dictionary with pattern analysis results:
            - action_counts: Frequency of each action type
            - time_patterns: Patterns by time of day
            - day_patterns: Patterns by day of week
            - average_intervals: Average time between interactions
            - stat_trends: Trends in pet statistics
            - most_active_periods: Times when pet is most active
        """
        if not interaction_history:
            return {
                "total_interactions": 0,
                "action_counts": {},
                "time_patterns": {},
                "day_patterns": {},
                "average_interval_hours": 24.0,
                "stat_trends": {},
            }

        action_counts: Dict[str, int] = defaultdict(int)
        time_patterns: Dict[str, int] = defaultdict(int)
        day_patterns: Dict[str, int] = defaultdict(int)
        timestamps: List[datetime] = []
        stat_changes: List[Dict[str, float]] = []

        # Process each interaction
        for interaction in interaction_history:
            action = interaction.get("action", "unknown")
            if action in self.VALID_ACTIONS:
                action_counts[action] += 1

            # Parse timestamp
            timestamp_str = interaction.get("timestamp", "")
            try:
                if timestamp_str.endswith("Z"):
                    timestamp = datetime.fromisoformat(timestamp_str.replace("Z", "+00:00"))
                else:
                    timestamp = datetime.fromisoformat(timestamp_str)
                
                timestamps.append(timestamp)
                
                # Analyze time patterns
                hour = timestamp.hour
                if 6 <= hour < 12:
                    time_patterns["morning"] += 1
                elif 12 <= hour < 18:
                    time_patterns["afternoon"] += 1
                elif 18 <= hour < 22:
                    time_patterns["evening"] += 1
                else:
                    time_patterns["night"] += 1
                
                # Day of week pattern
                day_name = timestamp.strftime("%A")
                day_patterns[day_name] += 1
            except (ValueError, AttributeError):
                logger.debug(f"Could not parse timestamp: {timestamp_str}")

            # Track stat changes
            stats_before = interaction.get("pet_stats_before", {})
            stats_after = interaction.get("pet_stats_after", {})
            if stats_before and stats_after:
                changes = {}
                for key in ["hunger", "happiness", "energy", "cleanliness", "health"]:
                    before_val = stats_before.get(key, 0)
                    after_val = stats_after.get(key, 0)
                    if isinstance(before_val, (int, float)) and isinstance(after_val, (int, float)):
                        changes[key] = after_val - before_val
                if changes:
                    stat_changes.append(changes)

        # Calculate average interval between interactions
        average_interval_hours = 24.0
        if len(timestamps) > 1:
            timestamps.sort()
            intervals = [
                (timestamps[i + 1] - timestamps[i]).total_seconds() / 3600
                for i in range(len(timestamps) - 1)
            ]
            if intervals:
                average_interval_hours = sum(intervals) / len(intervals)

        # Calculate stat trends
        stat_trends = {}
        if stat_changes:
            for key in ["hunger", "happiness", "energy", "cleanliness", "health"]:
                changes = [c.get(key, 0) for c in stat_changes if key in c]
                if changes:
                    stat_trends[key] = {
                        "average_change": sum(changes) / len(changes),
                        "trend": "increasing" if sum(changes) > 0 else "decreasing" if sum(changes) < 0 else "stable",
                    }

        # Find most active periods
        most_active_time = max(time_patterns.items(), key=lambda x: x[1])[0] if time_patterns else "afternoon"
        most_active_day = max(day_patterns.items(), key=lambda x: x[1])[0] if day_patterns else None

        return {
            "total_interactions": len(interaction_history),
            "action_counts": dict(action_counts),
            "time_patterns": dict(time_patterns),
            "day_patterns": dict(day_patterns),
            "average_interval_hours": average_interval_hours,
            "stat_trends": stat_trends,
            "most_active_time": most_active_time,
            "most_active_day": most_active_day,
            "most_common_action": max(action_counts.items(), key=lambda x: x[1])[0] if action_counts else None,
        }

    async def _get_ai_predictions(
        self,
        pet_id: str,
        pattern_analysis: Dict[str, Any],
        current_stats: Optional[Dict[str, Any]],
        forecast_days: int,
        settings: Any,
    ) -> Dict[str, Any]:
        """
        Get AI-powered behavior predictions using OpenAI/OpenRouter.
        
        Uses AI to identify complex patterns and generate nuanced predictions
        that go beyond statistical analysis.
        
        Args:
            pet_id: Pet identifier
            pattern_analysis: Results from statistical pattern analysis
            current_stats: Current pet statistics
            forecast_days: Number of days to forecast
            settings: Application settings with API keys
        
        Returns:
            Dictionary with AI-generated predictions
        """
        # Build comprehensive prompt
        prompt = f"""Analyze the following pet interaction patterns and predict future behavior.

Pattern Analysis:
- Total Interactions: {pattern_analysis['total_interactions']}
- Most Common Action: {pattern_analysis.get('most_common_action', 'N/A')}
- Action Distribution: {json.dumps(pattern_analysis.get('action_counts', {}))}
- Most Active Time: {pattern_analysis.get('most_active_time', 'N/A')}
- Most Active Day: {pattern_analysis.get('most_active_day', 'N/A')}
- Average Interval Between Interactions: {pattern_analysis.get('average_interval_hours', 24):.1f} hours
- Stat Trends: {json.dumps(pattern_analysis.get('stat_trends', {}))}

Current Pet Stats:
{json.dumps(current_stats or {}, indent=2)}

Based on this analysis, predict behavior for the next {forecast_days} days:

1. Mood Forecast: Provide 5-10 predicted mood states with dates and reasoning
2. Activity Prediction: Provide 5-10 predicted activity patterns with timing
3. Patterns: Identify 2-3 key behavioral patterns
4. Recommendations: Provide 2-3 actionable care recommendations

Return a JSON object:
{{
  "mood_forecast": ["mood prediction 1 with date/reasoning", ...],
  "activity_prediction": ["activity prediction 1 with timing", ...],
  "patterns_identified": ["pattern description 1", ...],
  "recommendations": ["recommendation 1", ...]
}}"""

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a pet behavior analyst. Analyze interaction patterns "
                    "and predict future pet behavior based on historical data and statistical trends. "
                    "Provide specific, actionable predictions with dates and reasoning."
                ),
            },
            {"role": "user", "content": prompt},
        ]

        # Determine API endpoint and key
        api_key = getattr(settings, "openrouter_api_key", None) or getattr(settings, "openai_api_key", None)
        api_url = getattr(settings, "openrouter_base_url", None) or getattr(settings, "openai_chat_api", None)
        model = getattr(settings, "openrouter_model", None) or getattr(settings, "openai_chat_model", "gpt-3.5-turbo")

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 800,
        }

        if "openrouter" in str(api_url).lower() or hasattr(settings, "openrouter_api_key"):
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        client = self._client or httpx.AsyncClient(timeout=30.0)
        close_client = self._client is None

        try:
            response = await client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()

            # Parse JSON response
            try:
                if "```json" in content:
                    start = content.find("```json") + 7
                    end = content.find("```", start)
                    content = content[start:end].strip()
                elif "```" in content:
                    start = content.find("```") + 3
                    end = content.find("```", start)
                    content = content[start:end].strip()

                parsed = json.loads(content)
                return {
                    "mood_forecast": parsed.get("mood_forecast", []),
                    "activity_prediction": parsed.get("activity_prediction", []),
                    "patterns_identified": parsed.get("patterns_identified", []),
                    "recommendations": parsed.get("recommendations", []),
                }
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse AI response: {e}")
                return {}
        finally:
            if close_client:
                await client.aclose()

    def _generate_statistical_predictions(
        self,
        pattern_analysis: Dict[str, Any],
        current_stats: Optional[Dict[str, Any]],
        forecast_days: int,
    ) -> Dict[str, Any]:
        """
        Generate predictions using statistical analysis and rule-based logic.
        
        Algorithm:
        1. Analyzes action frequencies to predict future actions
        2. Uses time patterns to predict optimal care timing
        3. Calculates mood based on care consistency
        4. Generates activity predictions from historical patterns
        
        Args:
            pattern_analysis: Results from pattern analysis
            current_stats: Current pet statistics
            forecast_days: Number of days to forecast
        
        Returns:
            Dictionary with statistical predictions
        """
        action_counts = pattern_analysis.get("action_counts", {})
        most_active_time = pattern_analysis.get("most_active_time", "afternoon")
        average_interval = pattern_analysis.get("average_interval_hours", 24.0)

        # Generate mood forecast based on patterns
        mood_forecast = []
        if action_counts.get("feed", 0) > 0:
            mood_forecast.append("happy (consistent feeding schedule expected)")
        if action_counts.get("play", 0) > 0:
            mood_forecast.append("energetic (playful periods anticipated)")
        if average_interval < 12:
            mood_forecast.append("content (regular care patterns)")
        else:
            mood_forecast.append("may need attention (irregular care pattern)")

        # Add default forecasts
        default_moods = ["happy (baseline)", "content (stable care)"]
        for mood in default_moods:
            if mood not in mood_forecast and len(mood_forecast) < 5:
                mood_forecast.append(mood)

        # Generate activity predictions
        activity_prediction = []
        if action_counts.get("feed", 0) > 0:
            activity_prediction.append(f"likely to need feeding in {most_active_time}")
        if action_counts.get("play", 0) > 0:
            activity_prediction.append("will be playful during active periods")
        if action_counts.get("bathe", 0) > 0:
            activity_prediction.append("may need cleaning/grooming soon")
        if action_counts.get("rest", 0) > 0:
            activity_prediction.append("will need rest after activities")

        # Add default predictions
        default_activities = [
            "regular interaction schedule recommended",
            "monitor stats daily for optimal care timing",
        ]
        for activity in default_activities:
            if activity not in activity_prediction and len(activity_prediction) < 5:
                activity_prediction.append(activity)

        # Identify patterns
        patterns = []
        if average_interval < 12:
            patterns.append(f"Regular care pattern (average {average_interval:.1f} hours between interactions)")
        if action_counts:
            most_common = max(action_counts.items(), key=lambda x: x[1])
            patterns.append(f"Most frequent action: {most_common[0]} ({most_common[1]} times)")

        # Generate recommendations
        recommendations = []
        if average_interval > 24:
            recommendations.append("Consider more frequent interactions to improve pet wellbeing")
        if current_stats:
            if current_stats.get("hunger", 70) < 40:
                recommendations.append("Pet may need more frequent feeding")
            if current_stats.get("energy", 70) < 40:
                recommendations.append("Pet may need more rest periods")

        return {
            "mood_forecast": mood_forecast[:10],
            "activity_prediction": activity_prediction[:10],
            "patterns_identified": patterns[:5],
            "recommendations": recommendations[:5] if recommendations else ["Maintain current care routine"],
            "confidence_score": self._calculate_confidence(pattern_analysis),
            "trends": pattern_analysis.get("stat_trends", {}),
        }

    def _combine_predictions(
        self,
        ai_predictions: Dict[str, Any],
        pattern_analysis: Dict[str, Any],
        forecast_days: int,
    ) -> Dict[str, Any]:
        """
        Combine AI predictions with statistical analysis for comprehensive results.
        
        Merges AI-generated insights with statistical patterns to provide
        a balanced, high-confidence prediction set.
        
        Args:
            ai_predictions: AI-generated predictions
            pattern_analysis: Statistical pattern analysis
            forecast_days: Number of days forecasted
        
        Returns:
            Combined prediction dictionary
        """
        result = {
            "mood_forecast": ai_predictions.get("mood_forecast", [])[:10],
            "activity_prediction": ai_predictions.get("activity_prediction", [])[:10],
            "patterns_identified": ai_predictions.get("patterns_identified", [])[:5],
            "recommendations": ai_predictions.get("recommendations", [])[:5],
            "confidence_score": 0.8,  # Higher confidence when AI is used
            "trends": pattern_analysis.get("stat_trends", {}),
        }

        # Ensure we have minimum predictions
        if not result["mood_forecast"]:
            result["mood_forecast"] = ["happy (predicted)", "content (expected mood)"]
        if not result["activity_prediction"]:
            result["activity_prediction"] = ["regular care schedule expected"]

        return result

    def _calculate_confidence(self, pattern_analysis: Dict[str, Any]) -> float:
        """
        Calculate confidence score based on data quality and pattern strength.
        
        Confidence factors:
        - More interactions = higher confidence
        - Regular patterns = higher confidence
        - Consistent timing = higher confidence
        
        Args:
            pattern_analysis: Pattern analysis results
        
        Returns:
            Confidence score between 0.0 and 1.0
        """
        total_interactions = pattern_analysis.get("total_interactions", 0)
        
        if total_interactions == 0:
            return 0.3
        
        # Base confidence from interaction count
        if total_interactions < 5:
            base_confidence = 0.4
        elif total_interactions < 20:
            base_confidence = 0.6
        else:
            base_confidence = 0.7
        
        # Boost confidence for regular patterns
        avg_interval = pattern_analysis.get("average_interval_hours", 24.0)
        if 8 <= avg_interval <= 16:  # Regular 1-2x per day
            base_confidence += 0.1
        elif 4 <= avg_interval <= 24:  # Reasonable pattern
            base_confidence += 0.05
        
        return min(base_confidence, 0.95)

    def _generate_empty_predictions(self, forecast_days: int) -> Dict[str, Any]:
        """
        Generate default predictions when no interaction history exists.
        
        Args:
            forecast_days: Number of days to forecast
        
        Returns:
            Default prediction dictionary
        """
        return {
            "mood_forecast": [
                "happy (default prediction)",
                "content (baseline mood expected)",
            ],
            "activity_prediction": [
                "regular feeding schedule recommended",
                "daily playtime suggested",
                "monitor pet stats regularly",
            ],
            "patterns_identified": ["Insufficient data - start interacting to build patterns"],
            "recommendations": [
                "Begin regular pet care routine",
                "Interact daily to establish patterns",
                "Monitor pet stats for optimal care timing",
            ],
            "confidence_score": 0.3,
            "trends": {},
        }
