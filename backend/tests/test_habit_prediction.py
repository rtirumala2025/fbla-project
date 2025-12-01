"""Tests for habit prediction service."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.habit_prediction import HabitPredictionService


@pytest.mark.asyncio
async def test_predict_habits_with_openai():
    """Test habit prediction with OpenAI API."""
    service = HabitPredictionService()
    
    interaction_history = [
        {"action": "feed", "timestamp": "2024-01-01T08:00:00Z"},
        {"action": "play", "timestamp": "2024-01-01T14:00:00Z"},
        {"action": "feed", "timestamp": "2024-01-02T08:00:00Z"},
    ]
    
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "content": '{"predicted_habits": [{"habit_type": "feeding", "frequency": "daily", "likely_times": ["morning"], "confidence": 0.8, "description": "Regular feeding pattern"}], "patterns_identified": ["Morning feeding routine"], "recommendations": ["Maintain consistent schedule"], "forecast_summary": "Consistent care patterns"}'
            }
        }]
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch.object(service._client, 'post', new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        
        with patch('app.services.habit_prediction.get_settings') as mock_settings:
            mock_settings.return_value = MagicMock(
                openai_api_key="test-key",
                openai_chat_api="https://api.openai.com/v1/chat/completions",
                openai_chat_model="gpt-4o-mini"
            )
            
            predictions = await service.predict_habits(
                user_id="test-user-id",
                interaction_history=interaction_history,
                pet_stats_history=[],
                forecast_days=14,
            )
            
            assert "predicted_habits" in predictions
            assert "patterns_identified" in predictions
            assert "recommendations" in predictions
            assert "forecast_summary" in predictions


@pytest.mark.asyncio
async def test_predict_habits_fallback():
    """Test habit prediction fallback when OpenAI is unavailable."""
    service = HabitPredictionService()
    
    interaction_history = [
        {"action": "feed", "timestamp": "2024-01-01T08:00:00Z"},
    ]
    
    with patch('app.services.habit_prediction.get_settings') as mock_settings:
        mock_settings.return_value = MagicMock(openai_api_key="")
        
        predictions = await service.predict_habits(
            user_id="test-user-id",
            interaction_history=interaction_history,
            pet_stats_history=[],
            forecast_days=14,
        )
        
        assert "predicted_habits" in predictions
        assert len(predictions["predicted_habits"]) > 0
