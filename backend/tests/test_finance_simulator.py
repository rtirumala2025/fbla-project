"""Tests for finance simulator service."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock

from app.services.finance_simulator import FinanceSimulatorService


@pytest.mark.asyncio
async def test_generate_scenario_with_openai():
    """Test scenario generation with OpenAI API."""
    service = FinanceSimulatorService()
    
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "content": '{"scenario_id": "test-001", "title": "Test Scenario", "description": "Test description", "scenario_type": "loan", "initial_situation": {"income": 2000, "expenses": 1500, "savings": 1000, "debt": 0}, "options": [], "learning_objectives": ["Learn about loans"], "concepts_covered": ["APR"]}'
            }
        }]
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch.object(service._client, 'post', new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        
        with patch('app.services.finance_simulator.get_settings') as mock_settings:
            mock_settings.return_value = MagicMock(
                openai_api_key="test-key",
                openai_chat_api="https://api.openai.com/v1/chat/completions",
                openai_chat_model="gpt-4o-mini"
            )
            
            scenario = await service.generate_scenario(
                scenario_type="loan",
                user_context=None,
            )
            
            assert "scenario_id" in scenario
            assert "title" in scenario
            assert "description" in scenario
            assert scenario["scenario_type"] == "loan"


@pytest.mark.asyncio
async def test_generate_scenario_fallback():
    """Test scenario generation fallback when OpenAI is unavailable."""
    service = FinanceSimulatorService()
    
    with patch('app.services.finance_simulator.get_settings') as mock_settings:
        mock_settings.return_value = MagicMock(openai_api_key="")
        
        scenario = await service.generate_scenario(
            scenario_type="loan",
            user_context=None,
        )
        
        assert "scenario_id" in scenario
        assert "title" in scenario
        assert scenario["scenario_type"] == "loan"


@pytest.mark.asyncio
async def test_evaluate_decision():
    """Test decision evaluation."""
    service = FinanceSimulatorService()
    
    scenario_context = {
        "scenario_id": "test-001",
        "title": "Test",
        "options": [{"option_id": "opt1", "label": "Option 1"}],
    }
    
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "choices": [{
            "message": {
                "content": '{"evaluation_score": 0.8, "immediate_impact": {"financial_change": "Test", "new_balance": "$1000"}, "long_term_consequences": ["Good"], "lessons_learned": ["Learn"], "feedback": "Good", "alternative_perspectives": ["Alternative"], "recommendations": ["Recommend"], "overall_assessment": "Good"}'
            }
        }]
    }
    mock_response.raise_for_status = MagicMock()
    
    with patch.object(service._client, 'post', new_callable=AsyncMock) as mock_post:
        mock_post.return_value = mock_response
        
        with patch('app.services.finance_simulator.get_settings') as mock_settings:
            mock_settings.return_value = MagicMock(
                openai_api_key="test-key",
                openai_chat_api="https://api.openai.com/v1/chat/completions",
                openai_chat_model="gpt-4o-mini"
            )
            
            evaluation = await service.evaluate_decision(
                scenario_id="test-001",
                user_decision={"selected_option_id": "opt1"},
                scenario_context=scenario_context,
            )
            
            assert "evaluation_score" in evaluation
            assert 0.0 <= evaluation["evaluation_score"] <= 1.0
