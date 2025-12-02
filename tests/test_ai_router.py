"""
Comprehensive tests for AI router endpoints.
Tests all AI endpoints with success and failure paths.
"""

from __future__ import annotations

import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet, PetStats, SpeciesEnum
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_ai_chat_endpoint_success(client: AsyncClient, db_session: AsyncSession):
    """Test AI chat endpoint with valid request."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    # Create a pet for context
    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=75,
        hygiene=80,
        energy=65,
        health=85,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.ai.get_ai_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.chat.return_value = {
            "message": "Hello! How can I help you today?",
            "mood": "happy",
            "notifications": [],
            "pet_state": {},
            "health_forecast": {},
        }
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/ai/chat",
            json={
                "message": "Hello",
                "session_id": "test-session",
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "Hello! How can I help you today?"


@pytest.mark.asyncio
async def test_ai_chat_endpoint_no_pet(client: AsyncClient, db_session: AsyncSession):
    """Test AI chat endpoint when user has no pet."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.ai.get_ai_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.chat.return_value = {
            "message": "Hello! How can I help you today?",
            "mood": "neutral",
            "notifications": [],
            "pet_state": {},
            "health_forecast": {},
        }
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/ai/chat",
            json={"message": "Hello"},
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        # Should work without pet context


@pytest.mark.asyncio
async def test_ai_chat_endpoint_unauthorized(client: AsyncClient):
    """Test AI chat endpoint without authentication."""
    response = await client.post(
        "/api/ai/chat",
        json={"message": "Hello"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_budget_advice_endpoint_success(client: AsyncClient, db_session: AsyncSession):
    """Test budget advice endpoint with valid transactions."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.ai.get_unified_ai_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.generate_budget_forecast.return_value = {
            "recommendations": [
                "Consider reducing spending on entertainment",
                "Track your expenses more carefully",
            ],
            "monthly_forecast": [
                {"month": "2024-02", "predicted_spend": 500.0},
                {"month": "2024-03", "predicted_spend": 550.0},
            ],
        }
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/ai/budget_advice",
            json={
                "user_id": str(user.id),
                "transaction_history": [
                    {
                        "amount": -50.0,
                        "category": "food",
                        "date": "2024-01-15",
                    },
                    {
                        "amount": -30.0,
                        "category": "entertainment",
                        "date": "2024-01-16",
                    },
                ],
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "advice" in data
        assert "forecast" in data
        assert len(data["forecast"]) == 2


@pytest.mark.asyncio
async def test_budget_advice_endpoint_unauthorized_access(client: AsyncClient, db_session: AsyncSession):
    """Test budget advice endpoint with unauthorized user_id."""
    user1 = User(
        id=uuid.uuid4(),
        email="user1@example.com",
        hashed_password=hash_password("password123"),
    )
    user2 = User(
        id=uuid.uuid4(),
        email="user2@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user1)
    db_session.add(user2)
    await db_session.commit()

    response = await client.post(
        "/api/ai/budget_advice",
        json={
            "user_id": str(user2.id),  # Trying to access user2's data as user1
            "transaction_history": [
                {
                    "amount": -50.0,
                    "category": "food",
                    "date": "2024-01-15",
                },
            ],
        },
        headers=auth_headers(user1.id),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_pet_name_suggestions_endpoint(client: AsyncClient):
    """Test pet name suggestions endpoint."""
    with patch("app.routers.ai.get_unified_ai_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.validate_and_suggest_name.return_value = {
            "valid": True,
            "suggestions": ["Luna", "Max", "Bella", "Charlie", "Daisy"],
        }
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/ai/pet_name_suggestions",
            json={"input_name": "Luna"},
        )

        assert response.status_code == 200
        data = response.json()
        assert "valid" in data
        assert "suggestions" in data
        assert len(data["suggestions"]) == 5


@pytest.mark.asyncio
async def test_pet_name_suggestions_invalid_name(client: AsyncClient):
    """Test pet name suggestions with invalid name."""
    with patch("app.routers.ai.get_unified_ai_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.validate_and_suggest_name.return_value = {
            "valid": False,
            "suggestions": ["Luna", "Max", "Bella", "Charlie", "Daisy"],
        }
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/ai/pet_name_suggestions",
            json={"input_name": "X" * 30},  # Too long
        )

        assert response.status_code == 200
        data = response.json()
        assert data["valid"] is False


@pytest.mark.asyncio
async def test_pet_behavior_endpoint_success(client: AsyncClient, db_session: AsyncSession):
    """Test pet behavior analysis endpoint."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=75,
        hygiene=80,
        energy=65,
        health=85,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.ai.get_unified_ai_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.predict_behavior.return_value = {
            "mood_forecast": [
                {"day": 1, "mood": "happy", "confidence": 0.8},
                {"day": 2, "mood": "content", "confidence": 0.75},
            ],
            "activity_prediction": [
                {"day": 1, "activity": "play", "probability": 0.7},
            ],
        }
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/ai/pet_behavior",
            json={
                "pet_id": str(pet.id),
                "interaction_history": [
                    {
                        "action": "feed",
                        "timestamp": "2024-01-15T10:00:00Z",
                        "pet_stats_before": {"hunger": 50},
                        "pet_stats_after": {"hunger": 80},
                    },
                ],
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "mood_forecast" in data
        assert "activity_prediction" in data


@pytest.mark.asyncio
async def test_pet_behavior_endpoint_no_pet(client: AsyncClient, db_session: AsyncSession):
    """Test pet behavior endpoint when user has no pet."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/ai/pet_behavior",
        json={
            "pet_id": str(uuid.uuid4()),
            "interaction_history": [],
        },
        headers=auth_headers(user.id),
    )

    assert response.status_code == 404


@pytest.mark.asyncio
async def test_nlp_command_endpoint_success(client: AsyncClient, db_session: AsyncSession):
    """Test NLP command processing endpoint."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=75,
        hygiene=80,
        energy=65,
        health=85,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.ai.get_unified_ai_service") as mock_get_service:
        mock_service = AsyncMock()
        mock_service.process_nlp_command.return_value = {
            "action": "feed",
            "confidence": 0.9,
            "intent": "care",
            "suggestions": [],
        }
        mock_get_service.return_value = mock_service

        response = await client.post(
            "/api/ai/nlp_command",
            json={
                "command": "feed my pet",
                "user_id": str(user.id),
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "action" in data
        assert data["action"] == "feed"


@pytest.mark.asyncio
async def test_nlp_command_endpoint_missing_command(client: AsyncClient, db_session: AsyncSession):
    """Test NLP command endpoint with missing command."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/ai/nlp_command",
        json={},
        headers=auth_headers(user.id),
    )

    assert response.status_code == 400


@pytest.mark.asyncio
async def test_nlp_command_endpoint_unauthorized_user(client: AsyncClient, db_session: AsyncSession):
    """Test NLP command endpoint with unauthorized user_id."""
    user1 = User(
        id=uuid.uuid4(),
        email="user1@example.com",
        hashed_password=hash_password("password123"),
    )
    user2 = User(
        id=uuid.uuid4(),
        email="user2@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user1)
    db_session.add(user2)
    await db_session.commit()

    response = await client.post(
        "/api/ai/nlp_command",
        json={
            "command": "feed my pet",
            "user_id": str(user2.id),  # Trying to access user2's data as user1
        },
        headers=auth_headers(user1.id),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_pet_mood_forecast_endpoint_success(client: AsyncClient, db_session: AsyncSession):
    """Test pet mood forecast endpoint."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=75,
        hygiene=80,
        energy=65,
        health=85,
    )
    db_session.add(pet)
    await db_session.commit()

    with patch("app.routers.ai.PetMoodForecastService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.forecast_mood.return_value = [
            {"day": 1, "mood": "happy", "confidence": 0.8},
            {"day": 2, "mood": "content", "confidence": 0.75},
        ]
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/ai/pet_mood_forecast",
            json={
                "pet_id": str(pet.id),
                "current_stats": {
                    "hunger": 70,
                    "happiness": 75,
                    "energy": 65,
                    "cleanliness": 80,
                    "health": 85,
                },
                "interaction_history": [],
                "forecast_days": 7,
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "forecast" in data


@pytest.mark.asyncio
async def test_pet_mood_forecast_endpoint_unauthorized_pet(client: AsyncClient, db_session: AsyncSession):
    """Test pet mood forecast with unauthorized pet_id."""
    user1 = User(
        id=uuid.uuid4(),
        email="user1@example.com",
        hashed_password=hash_password("password123"),
    )
    user2 = User(
        id=uuid.uuid4(),
        email="user2@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user1)
    db_session.add(user2)
    await db_session.flush()

    pet = Pet(
        id=uuid.uuid4(),
        user_id=user2.id,  # Pet belongs to user2
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=70,
        happiness=75,
        hygiene=80,
        energy=65,
        health=85,
    )
    db_session.add(pet)
    await db_session.commit()

    response = await client.post(
        "/api/ai/pet_mood_forecast",
        json={
            "pet_id": str(pet.id),
            "current_stats": {},
            "interaction_history": [],
            "forecast_days": 7,
        },
        headers=auth_headers(user1.id),  # user1 trying to access user2's pet
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_habit_prediction_endpoint_success(client: AsyncClient, db_session: AsyncSession):
    """Test habit prediction endpoint."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.ai.HabitPredictionService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.predict_habits.return_value = {
            "predicted_habits": [
                {"habit": "feed_pet", "probability": 0.8, "time": "morning"},
            ],
            "recommendations": ["Feed your pet at consistent times"],
        }
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/ai/habit_prediction",
            json={
                "user_id": str(user.id),
                "interaction_history": [],
                "pet_stats_history": [],
                "forecast_days": 7,
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "predicted_habits" in data or "recommendations" in data


@pytest.mark.asyncio
async def test_habit_prediction_endpoint_unauthorized(client: AsyncClient, db_session: AsyncSession):
    """Test habit prediction with unauthorized user_id."""
    user1 = User(
        id=uuid.uuid4(),
        email="user1@example.com",
        hashed_password=hash_password("password123"),
    )
    user2 = User(
        id=uuid.uuid4(),
        email="user2@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user1)
    db_session.add(user2)
    await db_session.commit()

    response = await client.post(
        "/api/ai/habit_prediction",
        json={
            "user_id": str(user2.id),  # Trying to access user2's data as user1
            "interaction_history": [],
            "pet_stats_history": [],
            "forecast_days": 7,
        },
        headers=auth_headers(user1.id),
    )

    assert response.status_code == 403


@pytest.mark.asyncio
async def test_finance_simulator_scenario_endpoint(client: AsyncClient, db_session: AsyncSession):
    """Test finance simulator scenario generation."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.ai.FinanceSimulatorService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.generate_scenario.return_value = {
            "scenario_id": "test-scenario-1",
            "title": "Budget Decision",
            "description": "You have $1000. How would you allocate it?",
            "options": [
                {"id": "opt1", "text": "Save all", "outcome": "Safe but no growth"},
            ],
        }
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/ai/finance_simulator/scenario",
            json={
                "scenario_type": "budget",
                "user_context": {},
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "scenario_id" in data or "title" in data


@pytest.mark.asyncio
async def test_finance_simulator_evaluate_endpoint(client: AsyncClient, db_session: AsyncSession):
    """Test finance simulator decision evaluation."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.ai.FinanceSimulatorService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.evaluate_decision.return_value = {
            "score": 8.5,
            "feedback": "Good decision!",
            "learning_outcomes": ["Budgeting basics"],
            "recommendations": ["Consider saving more"],
        }
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/ai/finance_simulator/evaluate",
            json={
                "scenario_id": "test-scenario-1",
                "selected_option_id": "opt1",
                "scenario_context": {},
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "score" in data or "feedback" in data
