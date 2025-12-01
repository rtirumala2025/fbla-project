"""Tests for pet mood forecast service."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta

from app.services.pet_mood_forecast import PetMoodForecastService
from app.schemas.ai import PetMoodForecastRequest


@pytest.mark.asyncio
async def test_forecast_mood_with_openai():
    """Test mood forecast with OpenAI API."""
    service = PetMoodForecastService()
    
    current_stats = {
        "hunger": 80,
        "happiness": 75,
        "energy": 70,
        "cleanliness": 85,
        "health": 90,
        "mood": "happy",
    }
    
    interaction_history = [
        {"action": "feed", "timestamp": "2024-01-01T10:00:00Z"},
        {"action": "play", "timestamp": "2024-01-01T14:00:00Z"},
    ]
    
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "content": '{"forecast": [{"date": "2024-01-02", "predicted_mood": "happy", "confidence": 0.85, "reasoning": "Well-fed and active"}]}'
            }
        }]
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch.object(service._client, 'post', new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        
        with patch('app.services.pet_mood_forecast.get_settings') as mock_settings:
            mock_settings.return_value = MagicMock(
                openai_api_key="test-key",
                openai_chat_api="https://api.openai.com/v1/chat/completions",
                openai_chat_model="gpt-4o-mini"
            )
            
            forecast = await service.forecast_mood(
                pet_id="test-pet-id",
                current_stats=current_stats,
                interaction_history=interaction_history,
                forecast_days=7,
            )
            
            assert len(forecast) > 0
            assert forecast[0]["predicted_mood"] in ["ecstatic", "happy", "content", "sleepy", "anxious", "distressed", "sad", "moody"]
            assert 0.0 <= forecast[0]["confidence"] <= 1.0


@pytest.mark.asyncio
async def test_forecast_mood_fallback():
    """Test mood forecast fallback when OpenAI is unavailable."""
    service = PetMoodForecastService()
    
    current_stats = {
        "hunger": 70,
        "happiness": 70,
        "energy": 70,
        "cleanliness": 70,
        "health": 80,
        "mood": "happy",
    }
    
    with patch('app.services.pet_mood_forecast.get_settings') as mock_settings:
        mock_settings.return_value = MagicMock(openai_api_key="")
        
        forecast = await service.forecast_mood(
            pet_id="test-pet-id",
            current_stats=current_stats,
            interaction_history=[],
            forecast_days=7,
        )
        
        assert len(forecast) == 7
        assert all(entry["predicted_mood"] for entry in forecast)
        assert all(0.0 <= entry["confidence"] <= 1.0 for entry in forecast)
