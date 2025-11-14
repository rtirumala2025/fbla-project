"""
Comprehensive Integration Tests for All AI Endpoints.

This test suite covers:
- End-to-end flow from frontend to database
- Valid inputs, invalid inputs, missing data, and edge cases
- Response validation and JSON structure conformance
- CI/CD ready with test report generation
"""

from __future__ import annotations

import json
import logging
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
from uuid import uuid4

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet, SpeciesEnum
from app.models.user import User, hash_password

# Configure test logging
logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger(__name__)

# Test report storage
TEST_REPORT: List[Dict[str, Any]] = []


def _log_test_result(
    endpoint: str,
    test_name: str,
    passed: bool,
    status_code: Optional[int] = None,
    response_data: Optional[Dict[str, Any]] = None,
    error: Optional[str] = None,
    request_data: Optional[Dict[str, Any]] = None,
) -> None:
    """Log test results for reporting."""
    result = {
        "endpoint": endpoint,
        "test_name": test_name,
        "passed": passed,
        "status_code": status_code,
        "request_data": request_data,
        "response_data": response_data,
        "error": error,
        "timestamp": datetime.now().isoformat(),
    }
    TEST_REPORT.append(result)
    
    status = "✅ PASS" if passed else "❌ FAIL"
    LOGGER.info(f"{status} | {endpoint} | {test_name}")
    if error:
        LOGGER.error(f"  Error: {error}")
    if status_code:
        LOGGER.info(f"  Status: {status_code}")
    if response_data:
        LOGGER.debug(f"  Response: {json.dumps(response_data, indent=2, default=str)}")


def auth_headers(user_id: uuid4) -> dict[str, str]:
    """Generate authentication headers for test user."""
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


async def create_test_user_and_pet(
    db_session: AsyncSession,
    pet_stats: Optional[Dict[str, int]] = None,
) -> tuple[User, Pet]:
    """Helper to create a test user and pet."""
    user = User(
        email=f"ai-test-{uuid4()}@example.com",
        password_hash=hash_password("TestPassword123!"),
    )
    db_session.add(user)
    await db_session.flush()

    stats = pet_stats or {
        "hunger": 70,
        "happiness": 75,
        "cleanliness": 80,
        "energy": 70,
        "health": 85,
    }

    pet = Pet(
        user_id=user.id,
        name="TestPet",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2023, 1, 1),
        hunger=stats["hunger"],
        happiness=stats["happiness"],
        cleanliness=stats["cleanliness"],
        energy=stats["energy"],
        health=stats["health"],
        diary=[],
    )
    db_session.add(pet)
    await db_session.flush()

    return user, pet


async def cleanup_test_data(
    db_session: AsyncSession,
    user: User,
    pet: Optional[Pet] = None,
) -> None:
    """Clean up test data."""
    if pet:
        await db_session.execute(delete(Pet).where(Pet.id == pet.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


# ============================================================================
# AI CHAT ENDPOINT TESTS
# ============================================================================


class TestAIChatEndpoint:
    """Tests for /api/ai/chat endpoint."""

    ENDPOINT = "/api/ai/chat"

    @pytest.mark.asyncio
    async def test_chat_valid_message(self, client: AsyncClient, db_session: AsyncSession):
        """Test valid chat message."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "message": "How is my pet doing today?",
            "session_id": str(uuid4()),
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            # Validate response structure
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "session_id" in response_data, "Missing session_id in response"
            assert "message" in response_data, "Missing message in response"
            assert isinstance(response_data["message"], str), "Message must be a string"
            assert len(response_data["message"]) > 0, "Message cannot be empty"

            # Optional fields validation
            if "mood" in response_data:
                assert response_data["mood"] in {
                    "ecstatic",
                    "happy",
                    "content",
                    "anxious",
                    "distressed",
                }, f"Invalid mood value: {response_data['mood']}"

            if "notifications" in response_data:
                assert isinstance(response_data["notifications"], list), "Notifications must be a list"

            if "pet_state" in response_data:
                assert isinstance(response_data["pet_state"], dict), "pet_state must be a dict"

            if "health_forecast" in response_data:
                assert isinstance(response_data["health_forecast"], dict), "health_forecast must be a dict"

            _log_test_result(
                self.ENDPOINT,
                "test_chat_valid_message",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_chat_valid_message",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_chat_empty_message(self, client: AsyncClient, db_session: AsyncSession):
        """Test chat with empty message."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {"message": "", "session_id": str(uuid4())}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            # Should return 422 for validation error
            assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_chat_empty_message",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_chat_empty_message",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_chat_missing_message(self, client: AsyncClient, db_session: AsyncSession):
        """Test chat with missing message field."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {"session_id": str(uuid4())}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_chat_missing_message",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_chat_missing_message",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_chat_long_message(self, client: AsyncClient, db_session: AsyncSession):
        """Test chat with very long message (edge case)."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        # Message exceeding max length (1500 chars)
        long_message = "A" * 2000
        request_data = {"message": long_message, "session_id": str(uuid4())}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            # Should return 422 for validation error
            assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_chat_long_message",
                True,
                response.status_code,
                None,
                request_data={"message": f"[{len(long_message)} chars]", "session_id": request_data["session_id"]},
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_chat_long_message",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_chat_no_session_id(self, client: AsyncClient, db_session: AsyncSession):
        """Test chat without session_id (should auto-generate)."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {"message": "Hello, Scout!"}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "session_id" in response_data, "Missing session_id in response"
            assert len(response_data["session_id"]) > 0, "session_id should be auto-generated"

            _log_test_result(
                self.ENDPOINT,
                "test_chat_no_session_id",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_chat_no_session_id",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_chat_unauthenticated(self, client: AsyncClient, db_session: AsyncSession):
        """Test chat without authentication."""
        request_data = {"message": "Hello", "session_id": str(uuid4())}

        try:
            response = await client.post(self.ENDPOINT, json=request_data)

            assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_chat_unauthenticated",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_chat_unauthenticated",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise

    @pytest.mark.asyncio
    async def test_chat_without_pet(self, client: AsyncClient, db_session: AsyncSession):
        """Test chat when user has no pet."""
        user = User(
            email=f"ai-test-{uuid4()}@example.com",
            password_hash=hash_password("TestPassword123!"),
        )
        db_session.add(user)
        await db_session.flush()
        headers = auth_headers(user.id)

        request_data = {"message": "How is my pet?", "session_id": str(uuid4())}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            # Should still work but return message about no pet
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "message" in response_data, "Missing message in response"

            _log_test_result(
                self.ENDPOINT,
                "test_chat_without_pet",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_chat_without_pet",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user)


# ============================================================================
# BUDGET ADVISOR ENDPOINT TESTS
# ============================================================================


class TestBudgetAdvisorEndpoint:
    """Tests for /api/budget-advisor/analyze endpoint."""

    ENDPOINT = "/api/budget-advisor/analyze"

    @pytest.mark.asyncio
    async def test_analyze_valid_transactions(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis with valid transactions."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "transactions": [
                {"amount": 50.0, "category": "food", "date": "2024-01-15", "description": "Groceries"},
                {"amount": 30.0, "category": "transport", "date": "2024-01-16", "description": "Gas"},
                {"amount": 25.0, "category": "entertainment", "date": "2024-01-17", "description": "Movie"},
            ],
            "monthly_budget": 1000.0,
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert response_data["status"] == "success", "Status should be success"
            assert "data" in response_data, "Missing data in response"
            assert response_data["data"] is not None, "Data should not be None"

            data = response_data["data"]
            assert "total_spending" in data, "Missing total_spending"
            assert "total_income" in data, "Missing total_income"
            assert "net_balance" in data, "Missing net_balance"
            assert "average_daily_spending" in data, "Missing average_daily_spending"
            assert "top_categories" in data, "Missing top_categories"
            assert isinstance(data["top_categories"], list), "top_categories must be a list"
            assert "trends" in data, "Missing trends"
            assert isinstance(data["trends"], list), "trends must be a list"
            assert "overspending_alerts" in data, "Missing overspending_alerts"
            assert isinstance(data["overspending_alerts"], list), "overspending_alerts must be a list"
            assert "suggestions" in data, "Missing suggestions"
            assert isinstance(data["suggestions"], list), "suggestions must be a list"
            assert "analysis_period" in data, "Missing analysis_period"

            # Validate trend structure
            for trend in data["trends"]:
                assert "category" in trend, "Trend missing category"
                assert "total_spent" in trend, "Trend missing total_spent"
                assert "trend" in trend, "Trend missing trend"
                assert trend["trend"] in {"increasing", "decreasing", "stable"}, f"Invalid trend value: {trend['trend']}"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_valid_transactions",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_valid_transactions",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analyze_empty_transactions(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis with empty transactions list."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {"transactions": [], "monthly_budget": 1000.0}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_empty_transactions",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_empty_transactions",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analyze_missing_transactions(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis with missing transactions field."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {"monthly_budget": 1000.0}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_missing_transactions",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_missing_transactions",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analyze_invalid_amount(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis with invalid amount (zero or negative)."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "transactions": [
                {"amount": -10.0, "category": "food", "date": "2024-01-15"},
            ],
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_invalid_amount",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_invalid_amount",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analyze_missing_category(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis with missing category."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "transactions": [
                {"amount": 50.0, "date": "2024-01-15"},
            ],
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_missing_category",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_missing_category",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analyze_invalid_date(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis with invalid date format."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "transactions": [
                {"amount": 50.0, "category": "food", "date": "invalid-date"},
            ],
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_invalid_date",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_invalid_date",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analyze_large_dataset(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis with large dataset (edge case)."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        # Create 100 transactions
        transactions = []
        base_date = date(2024, 1, 1)
        categories = ["food", "transport", "entertainment", "shopping", "bills"]

        for i in range(100):
            transactions.append({
                "amount": float(10 + (i % 50)),
                "category": categories[i % len(categories)],
                "date": (base_date + timedelta(days=i)).isoformat(),
            })

        request_data = {"transactions": transactions, "monthly_budget": 5000.0}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert response_data["status"] == "success", "Status should be success"
            assert response_data["data"] is not None, "Data should not be None"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_large_dataset",
                True,
                response.status_code,
                response_data,
                request_data={"transactions": f"[{len(transactions)} items]", "monthly_budget": request_data["monthly_budget"]},
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_large_dataset",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analyze_without_budget(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis without monthly budget."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "transactions": [
                {"amount": 50.0, "category": "food", "date": "2024-01-15"},
            ],
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert response_data["status"] == "success", "Status should be success"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_without_budget",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_without_budget",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_analyze_unauthenticated(self, client: AsyncClient, db_session: AsyncSession):
        """Test budget analysis without authentication."""
        request_data = {
            "transactions": [
                {"amount": 50.0, "category": "food", "date": "2024-01-15"},
            ],
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data)

            assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_analyze_unauthenticated",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_analyze_unauthenticated",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise


# ============================================================================
# BUDGET ADVISOR HEALTH CHECK TESTS
# ============================================================================


class TestBudgetAdvisorHealth:
    """Tests for /api/budget-advisor/health endpoint."""

    ENDPOINT = "/api/budget-advisor/health"

    @pytest.mark.asyncio
    async def test_health_check(self, client: AsyncClient):
        """Test budget advisor health check."""
        try:
            response = await client.get(self.ENDPOINT)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "status" in response_data, "Missing status in response"
            assert response_data["status"] == "healthy", "Status should be healthy"
            assert "service" in response_data, "Missing service in response"
            assert response_data["service"] == "budget-advisor", "Service should be budget-advisor"

            _log_test_result(
                self.ENDPOINT,
                "test_health_check",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_health_check",
                False,
                None,
                None,
                str(e),
            )
            raise


# ============================================================================
# COACH ENDPOINT TESTS
# ============================================================================


class TestCoachEndpoint:
    """Tests for /api/coach endpoint."""

    ENDPOINT = "/api/coach"

    @pytest.mark.asyncio
    async def test_get_coach_advice(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting coach advice."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get(self.ENDPOINT, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "mood" in response_data, "Missing mood in response"
            assert "difficulty_hint" in response_data, "Missing difficulty_hint in response"
            assert "summary" in response_data, "Missing summary in response"
            assert isinstance(response_data["summary"], str), "summary must be a string"
            assert "suggestions" in response_data, "Missing suggestions in response"
            assert isinstance(response_data["suggestions"], list), "suggestions must be a list"
            assert "generated_at" in response_data, "Missing generated_at in response"
            assert "source" in response_data, "Missing source in response"
            assert response_data["source"] in {"heuristic", "llm"}, f"Invalid source: {response_data['source']}"

            # Validate suggestion structure
            for suggestion in response_data["suggestions"]:
                assert "category" in suggestion, "Suggestion missing category"
                assert "recommendation" in suggestion, "Suggestion missing recommendation"
                assert suggestion["category"] in {
                    "care",
                    "activity",
                    "quest",
                    "difficulty",
                    "motivation",
                }, f"Invalid category: {suggestion['category']}"

            _log_test_result(
                self.ENDPOINT,
                "test_get_coach_advice",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_get_coach_advice",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_coach_unauthenticated(self, client: AsyncClient):
        """Test coach endpoint without authentication."""
        try:
            response = await client.get(self.ENDPOINT)

            assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_coach_unauthenticated",
                True,
                response.status_code,
                None,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_coach_unauthenticated",
                False,
                None,
                None,
                str(e),
            )
            raise


# ============================================================================
# PET AI ENDPOINTS TESTS
# ============================================================================


class TestPetAIInsights:
    """Tests for /api/pets/ai/insights endpoint."""

    ENDPOINT = "/api/pets/ai/insights"

    @pytest.mark.asyncio
    async def test_get_ai_insights(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting pet AI insights."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get(self.ENDPOINT, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "mood" in response_data, "Missing mood in response"
            assert isinstance(response_data["mood"], str), "mood must be a string"

            _log_test_result(
                self.ENDPOINT,
                "test_get_ai_insights",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_get_ai_insights",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_ai_insights_no_pet(self, client: AsyncClient, db_session: AsyncSession):
        """Test AI insights when user has no pet."""
        user = User(
            email=f"ai-test-{uuid4()}@example.com",
            password_hash=hash_password("TestPassword123!"),
        )
        db_session.add(user)
        await db_session.flush()
        headers = auth_headers(user.id)

        try:
            response = await client.get(self.ENDPOINT, headers=headers)

            assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_ai_insights_no_pet",
                True,
                response.status_code,
                None,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_ai_insights_no_pet",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user)


class TestPetAINotifications:
    """Tests for /api/pets/ai/notifications endpoint."""

    ENDPOINT = "/api/pets/ai/notifications"

    @pytest.mark.asyncio
    async def test_get_ai_notifications(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting pet AI notifications."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get(self.ENDPOINT, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert isinstance(response_data, list), "Response must be a list"

            # Validate notification structure if any exist
            for notification in response_data:
                assert "message" in notification, "Notification missing message"
                assert isinstance(notification["message"], str), "message must be a string"

            _log_test_result(
                self.ENDPOINT,
                "test_get_ai_notifications",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_get_ai_notifications",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_ai_notifications_no_pet(self, client: AsyncClient, db_session: AsyncSession):
        """Test AI notifications when user has no pet."""
        user = User(
            email=f"ai-test-{uuid4()}@example.com",
            password_hash=hash_password("TestPassword123!"),
        )
        db_session.add(user)
        await db_session.flush()
        headers = auth_headers(user.id)

        try:
            response = await client.get(self.ENDPOINT, headers=headers)

            assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_ai_notifications_no_pet",
                True,
                response.status_code,
                None,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_ai_notifications_no_pet",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user)


class TestPetAIHelp:
    """Tests for /api/pets/ai/help endpoint."""

    ENDPOINT = "/api/pets/ai/help"

    @pytest.mark.asyncio
    async def test_get_ai_help(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting pet AI help."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        try:
            response = await client.get(self.ENDPOINT, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "suggestions" in response_data, "Missing suggestions in response"
            assert isinstance(response_data["suggestions"], list), "suggestions must be a list"

            _log_test_result(
                self.ENDPOINT,
                "test_get_ai_help",
                True,
                response.status_code,
                response_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_get_ai_help",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_ai_help_no_pet(self, client: AsyncClient, db_session: AsyncSession):
        """Test AI help when user has no pet."""
        user = User(
            email=f"ai-test-{uuid4()}@example.com",
            password_hash=hash_password("TestPassword123!"),
        )
        db_session.add(user)
        await db_session.flush()
        headers = auth_headers(user.id)

        try:
            response = await client.get(self.ENDPOINT, headers=headers)

            assert response.status_code == 404, f"Expected 404, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_ai_help_no_pet",
                True,
                response.status_code,
                None,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_ai_help_no_pet",
                False,
                None,
                None,
                str(e),
            )
            raise
        finally:
            await cleanup_test_data(db_session, user)


class TestPetAICommand:
    """Tests for /api/pets/ai/command endpoint."""

    ENDPOINT = "/api/pets/ai/command"

    @pytest.mark.asyncio
    async def test_parse_command_valid(self, client: AsyncClient, db_session: AsyncSession):
        """Test parsing valid natural language command."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {"command_text": "feed my pet"}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "action" in response_data, "Missing action in response"
            assert "parameters" in response_data, "Missing parameters in response"
            assert isinstance(response_data["parameters"], dict), "parameters must be a dict"
            assert "confidence" in response_data, "Missing confidence in response"
            assert 0 <= response_data["confidence"] <= 1, "confidence must be between 0 and 1"
            assert "note" in response_data, "Missing note in response"

            _log_test_result(
                self.ENDPOINT,
                "test_parse_command_valid",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_parse_command_valid",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_parse_command_empty(self, client: AsyncClient, db_session: AsyncSession):
        """Test parsing empty command."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {"command_text": ""}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_parse_command_empty",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_parse_command_empty",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_parse_command_missing(self, client: AsyncClient, db_session: AsyncSession):
        """Test parsing command with missing field."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {}

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            assert response.status_code == 422, f"Expected 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_parse_command_missing",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_parse_command_missing",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_parse_command_unauthenticated(self, client: AsyncClient):
        """Test parsing command without authentication."""
        request_data = {"command_text": "feed my pet"}

        try:
            response = await client.post(self.ENDPOINT, json=request_data)

            assert response.status_code == 401, f"Expected 401, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_parse_command_unauthenticated",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_parse_command_unauthenticated",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise


# ============================================================================
# PET INTERACT ENDPOINT TESTS
# ============================================================================


class TestPetInteract:
    """Tests for /api/pets/interact endpoint (AI-powered)."""

    ENDPOINT = "/api/pets/interact"

    @pytest.mark.asyncio
    async def test_interact_feed(self, client: AsyncClient, db_session: AsyncSession):
        """Test pet interaction with feed action."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "action": "feed",
            "session_id": str(uuid4()),
            "message": "feed my pet",
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "session_id" in response_data, "Missing session_id in response"
            assert "message" in response_data, "Missing message in response"

            _log_test_result(
                self.ENDPOINT,
                "test_interact_feed",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_interact_feed",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_interact_invalid_action(self, client: AsyncClient, db_session: AsyncSession):
        """Test pet interaction with invalid action."""
        user, pet = await create_test_user_and_pet(db_session)
        headers = auth_headers(user.id)

        request_data = {
            "action": "invalid_action",
            "session_id": str(uuid4()),
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)

            # Should return 422 or 400 depending on validation
            assert response.status_code in {400, 422}, f"Expected 400 or 422, got {response.status_code}: {response.text}"

            _log_test_result(
                self.ENDPOINT,
                "test_interact_invalid_action",
                True,
                response.status_code,
                None,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_interact_invalid_action",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user, pet)

    @pytest.mark.asyncio
    async def test_interact_no_pet(self, client: AsyncClient, db_session: AsyncSession):
        """Test pet interaction when user has no pet."""
        user = User(
            email=f"ai-test-{uuid4()}@example.com",
            password_hash=hash_password("TestPassword123!"),
        )
        db_session.add(user)
        await db_session.flush()
        headers = auth_headers(user.id)

        request_data = {
            "action": "feed",
            "session_id": str(uuid4()),
        }

        try:
            response = await client.post(self.ENDPOINT, json=request_data, headers=headers)
            response_data = response.json()

            # Should still work but return message about no pet
            assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
            assert "message" in response_data, "Missing message in response"

            _log_test_result(
                self.ENDPOINT,
                "test_interact_no_pet",
                True,
                response.status_code,
                response_data,
                request_data=request_data,
            )
        except Exception as e:
            _log_test_result(
                self.ENDPOINT,
                "test_interact_no_pet",
                False,
                None,
                None,
                str(e),
                request_data,
            )
            raise
        finally:
            await cleanup_test_data(db_session, user)


# ============================================================================
# TEST REPORT GENERATION
# ============================================================================


def pytest_sessionfinish(session, exitstatus):
    """Generate test report after all tests complete."""
    report_path = Path("test_ai_endpoints_report.json")
    
    # Calculate summary
    total = len(TEST_REPORT)
    passed = sum(1 for r in TEST_REPORT if r["passed"])
    failed = total - passed
    
    # Group by endpoint
    endpoint_summary: Dict[str, Dict[str, int]] = {}
    for result in TEST_REPORT:
        endpoint = result["endpoint"]
        if endpoint not in endpoint_summary:
            endpoint_summary[endpoint] = {"total": 0, "passed": 0, "failed": 0}
        endpoint_summary[endpoint]["total"] += 1
        if result["passed"]:
            endpoint_summary[endpoint]["passed"] += 1
        else:
            endpoint_summary[endpoint]["failed"] += 1
    
    report = {
        "summary": {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "success_rate": f"{(passed / total * 100):.1f}%" if total > 0 else "0%",
        },
        "endpoint_summary": endpoint_summary,
        "test_results": TEST_REPORT,
        "generated_at": datetime.now().isoformat(),
    }
    
    # Write JSON report
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2, default=str)
    
    # Write human-readable markdown report
    md_report_path = Path("test_ai_endpoints_report.md")
    with open(md_report_path, "w") as f:
        f.write("# AI Endpoints Integration Test Report\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## Summary\n\n")
        f.write(f"- **Total Tests:** {total}\n")
        f.write(f"- **Passed:** {passed} ✅\n")
        f.write(f"- **Failed:** {failed} ❌\n")
        f.write(f"- **Success Rate:** {report['summary']['success_rate']}\n\n")
        
        f.write("## Endpoint Summary\n\n")
        f.write("| Endpoint | Total | Passed | Failed |\n")
        f.write("|----------|-------|--------|--------|\n")
        for endpoint, stats in endpoint_summary.items():
            status_icon = "✅" if stats["failed"] == 0 else "⚠️"
            f.write(f"| {endpoint} {status_icon} | {stats['total']} | {stats['passed']} | {stats['failed']} |\n")
        
        f.write("\n## Test Results\n\n")
        for result in TEST_REPORT:
            status_icon = "✅" if result["passed"] else "❌"
            f.write(f"### {status_icon} {result['test_name']}\n\n")
            f.write(f"- **Endpoint:** `{result['endpoint']}`\n")
            f.write(f"- **Status:** {'PASS' if result['passed'] else 'FAIL'}\n")
            if result["status_code"]:
                f.write(f"- **HTTP Status:** {result['status_code']}\n")
            if result["error"]:
                f.write(f"- **Error:** {result['error']}\n")
            f.write(f"- **Timestamp:** {result['timestamp']}\n\n")
    
    LOGGER.info(f"Test report written to {report_path}")
    LOGGER.info(f"Markdown report written to {md_report_path}")
    LOGGER.info(f"Summary: {passed}/{total} tests passed ({report['summary']['success_rate']})")

