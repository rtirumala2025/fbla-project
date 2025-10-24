import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
import json
from datetime import datetime, timedelta

from ..app import app
from ..mcp.context_manager import context_manager, SessionContext, Message

client = TestClient(app)

@pytest.fixture(autouse=True)
asdef clean_context():
    """Clean up context before each test"""
    context_manager.sessions = {}
    yield
    context_manager.sessions = {}

@pytest.mark.asyncio
async def test_chat_with_ai_success():
    # Mock the AI service response
    mock_response = {
        "choices": [{
            "delta": {"content": "Hello! How can I help you today?"}
        }]
    }
    
    with patch('app.services.ai_service.ai_service.get_ai_response') as mock_ai:
        # Configure the mock to return our test response
        mock_ai.return_value = [mock_response]
        
        # Make the test request
        response = client.post(
            "/api/ai/chat",
            json={"message": "Hello", "model": "test-model"},
            headers={"Authorization": "Bearer test-token"}
        )
        
        # Check the response
        assert response.status_code == 200
        assert "Hello! How can I help you today?" in response.text
        
        # Verify the context was updated
        session = await context_manager.get_or_create_session("test-session")
        assert len(session.messages) == 2  # User message + AI response

@pytest.mark.asyncio
async def test_chat_with_ai_unauthorized():
    response = client.post(
        "/api/ai/chat",
        json={"message": "Hello"}
    )
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_get_context():
    # Create a test session with messages
    test_session = SessionContext(
        session_id="test-session",
        user_id="test-user",
        messages=[
            Message(role="user", content="Hello", timestamp=datetime.utcnow())
        ]
    )
    context_manager.sessions["test-session"] = test_session
    
    # Test getting the context
    response = client.get(
        "/api/ai/context/test-session",
        headers={"Authorization": "Bearer test-token"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "test-session"
    assert len(data["messages"]) == 1
    assert data["messages"][0]["content"] == "Hello"

@pytest.mark.asyncio
async def test_get_nonexistent_context():
    response = client.get(
        "/api/ai/context/nonexistent",
        headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 200  # Should create a new session
    data = response.json()
    assert data["session_id"] == "nonexistent"
