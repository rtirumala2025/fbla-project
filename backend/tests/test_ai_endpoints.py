"""Unit tests for AI endpoints."""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_user():
    """Mock authenticated user."""
    return MagicMock(id="test-user-id")


@pytest.fixture
def mock_pet():
    """Mock pet object."""
    pet = MagicMock()
    pet.id = "test-pet-id"
    pet.name = "TestPet"
    pet.stats = MagicMock()
    pet.stats.hunger = 70
    pet.stats.happiness = 80
    pet.stats.energy = 60
    pet.stats.hygiene = 75
    pet.stats.health = 85
    return pet


class TestBudgetAdviceEndpoint:
    """Tests for /ai/budget_advice endpoint."""

    @patch("app.routers.ai.BudgetAIService")
    @patch("app.routers.ai.get_current_user")
    def test_budget_advice_success(self, mock_get_user, mock_service_class, client, mock_user):
        """Test successful budget advice request."""
        mock_get_user.return_value = mock_user
        mock_service = MagicMock()
        mock_service.get_budget_advice = AsyncMock(
            return_value={
                "advice": "Test advice",
                "forecast": [
                    {"month": "2024-01", "predicted_spend": 1000.0},
                    {"month": "2024-02", "predicted_spend": 1100.0},
                ],
            }
        )
        mock_service_class.return_value = mock_service

        response = client.post(
            "/api/ai/budget_advice",
            json={
                "user_id": "test-user-id",
                "transaction_history": [
                    {"amount": -50.0, "category": "food", "date": "2024-01-01"},
                ],
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "advice" in data
        assert "forecast" in data
        assert len(data["forecast"]) == 2

    @patch("app.routers.ai.get_current_user")
    def test_budget_advice_unauthorized_user(self, mock_get_user, client, mock_user):
        """Test budget advice with unauthorized user."""
        mock_get_user.return_value = mock_user

        response = client.post(
            "/api/ai/budget_advice",
            json={
                "user_id": "different-user-id",
                "transaction_history": [],
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 403


class TestPetNameSuggestionsEndpoint:
    """Tests for /ai/pet_name_suggestions endpoint."""

    @patch("app.routers.ai.PetNameAIService")
    def test_pet_name_suggestions_success(self, mock_service_class, client):
        """Test successful pet name validation."""
        mock_service = MagicMock()
        mock_service.validate_and_suggest = AsyncMock(
            return_value={
                "valid": True,
                "suggestions": ["Buddy", "Max", "Luna"],
            }
        )
        mock_service_class.return_value = mock_service

        response = client.post(
            "/api/ai/pet_name_suggestions",
            json={"input_name": "TestPet"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is True
        assert len(data["suggestions"]) == 3

    @patch("app.routers.ai.PetNameAIService")
    def test_pet_name_suggestions_invalid(self, mock_service_class, client):
        """Test invalid pet name."""
        mock_service = MagicMock()
        mock_service.validate_and_suggest = AsyncMock(
            return_value={
                "valid": False,
                "suggestions": ["Buddy", "Max"],
            }
        )
        mock_service_class.return_value = mock_service

        response = client.post(
            "/api/ai/pet_name_suggestions",
            json={"input_name": "InvalidName123!@#"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False


class TestPetBehaviorEndpoint:
    """Tests for /ai/pet_behavior endpoint."""

    @patch("app.routers.ai.PetBehaviorAIService")
    @patch("app.routers.ai.get_pet_service")
    @patch("app.routers.ai.get_current_user")
    def test_pet_behavior_success(
        self, mock_get_user, mock_get_pet_service, mock_service_class, client, mock_user, mock_pet
    ):
        """Test successful pet behavior analysis."""
        mock_get_user.return_value = mock_user
        mock_pet_service = MagicMock()
        mock_pet_service.get_pet = AsyncMock(return_value=mock_pet)
        mock_get_pet_service.return_value = mock_pet_service

        mock_service = MagicMock()
        mock_service.analyze_behavior = AsyncMock(
            return_value={
                "mood_forecast": ["happy on Monday", "energetic on Tuesday"],
                "activity_prediction": ["likely to need feeding", "will be playful"],
            }
        )
        mock_service_class.return_value = mock_service

        response = client.post(
            "/api/ai/pet_behavior",
            json={
                "pet_id": "test-pet-id",
                "interaction_history": [
                    {
                        "action": "feed",
                        "timestamp": "2024-01-01T10:00:00Z",
                        "pet_stats_after": {"hunger": 90},
                    },
                ],
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "mood_forecast" in data
        assert "activity_prediction" in data


class TestNLPCommandEndpoint:
    """Tests for /ai/nlp_command endpoint."""

    @patch("app.routers.ai.NLPCommandService")
    @patch("app.routers.ai.get_pet_service")
    @patch("app.routers.ai.get_current_user")
    def test_nlp_command_success(
        self, mock_get_user, mock_get_pet_service, mock_service_class, client, mock_user, mock_pet
    ):
        """Test successful NLP command processing."""
        mock_get_user.return_value = mock_user
        mock_pet_service = MagicMock()
        mock_pet_service.get_pet = AsyncMock(return_value=mock_pet)
        mock_get_pet_service.return_value = mock_pet_service

        mock_service = MagicMock()
        mock_service.process_command = AsyncMock(
            return_value={
                "action": "feed",
                "confidence": 0.9,
                "parameters": {},
                "intent": "User wants to feed pet",
                "needs_clarification": False,
                "suggestions": [],
            }
        )
        mock_service_class.return_value = mock_service

        response = client.post(
            "/api/ai/nlp_command",
            json={
                "command": "feed my pet",
                "user_id": "test-user-id",
            },
            headers={"Authorization": "Bearer test-token"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "feed"
        assert data["confidence"] == 0.9
