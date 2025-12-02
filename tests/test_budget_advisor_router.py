"""
Comprehensive tests for Budget Advisor router endpoints.
Tests analyze endpoint with various transaction scenarios and edge cases.
"""

from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_budget_advisor_analyze_success(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor analyze endpoint with valid transactions."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.budget_advisor.BudgetAIService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.get_budget_advice.return_value = type(
            "BudgetAdviceResponse",
            (),
            {
                "advice": "Consider reducing spending on entertainment. Track expenses more carefully.",
                "forecast": [
                    type("ForecastItem", (), {"month": "2024-02", "predicted_spend": 500.0})(),
                    type("ForecastItem", (), {"month": "2024-03", "predicted_spend": 550.0})(),
                ],
            },
        )()

        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/budget-advisor/analyze",
            json={
                "transactions": [
                    {
                        "amount": -50.0,
                        "category": "food",
                        "date": "2024-01-15",
                        "description": "Grocery shopping",
                    },
                    {
                        "amount": -30.0,
                        "category": "entertainment",
                        "date": "2024-01-16",
                        "description": "Movie tickets",
                    },
                    {
                        "amount": 1000.0,
                        "category": "income",
                        "date": "2024-01-01",
                        "description": "Salary",
                    },
                ],
                "monthly_budget": 500.0,
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_spending" in data
        assert "total_income" in data
        assert "net_balance" in data
        assert "trends" in data
        assert "suggestions" in data
        assert data["total_spending"] == 80.0
        assert data["total_income"] == 1000.0
        assert data["net_balance"] == 920.0


@pytest.mark.asyncio
async def test_budget_advisor_analyze_empty_transactions(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor with empty transactions list."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/budget-advisor/analyze",
        json={
            "transactions": [],
        },
        headers=auth_headers(user.id),
    )

    assert response.status_code == 400
    assert "No transactions" in response.json()["detail"]


@pytest.mark.asyncio
async def test_budget_advisor_analyze_missing_transactions(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor with missing transactions field."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.post(
        "/api/budget-advisor/analyze",
        json={},
        headers=auth_headers(user.id),
    )

    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_budget_advisor_analyze_large_dataset(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor with large transaction dataset."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    # Generate 100+ transactions
    transactions = []
    for i in range(150):
        transactions.append({
            "amount": -10.0 - (i % 10),
            "category": f"category_{i % 5}",
            "date": f"2024-01-{(i % 28) + 1:02d}",
            "description": f"Transaction {i}",
        })

    with patch("app.routers.budget_advisor.BudgetAIService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.get_budget_advice.return_value = type(
            "BudgetAdviceResponse",
            (),
            {
                "advice": "Large dataset analysis complete.",
                "forecast": [],
            },
        )()
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/budget-advisor/analyze",
            json={
                "transactions": transactions,
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "total_spending" in data
        assert data["total_spending"] > 0


@pytest.mark.asyncio
async def test_budget_advisor_analyze_with_budget_limit(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor with monthly budget limit and overspending."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.budget_advisor.BudgetAIService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.get_budget_advice.return_value = type(
            "BudgetAdviceResponse",
            (),
            {
                "advice": "You've exceeded your budget.",
                "forecast": [],
            },
        )()
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/budget-advisor/analyze",
            json={
                "transactions": [
                    {
                        "amount": -600.0,
                        "category": "food",
                        "date": "2024-01-15",
                    },
                ],
                "monthly_budget": 500.0,  # Budget exceeded
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "overspending_alerts" in data
        assert len(data["overspending_alerts"]) > 0
        assert data["overspending_alerts"][0]["excess_amount"] == 100.0


@pytest.mark.asyncio
async def test_budget_advisor_analyze_top_categories(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor correctly identifies top spending categories."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.budget_advisor.BudgetAIService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.get_budget_advice.return_value = type(
            "BudgetAdviceResponse",
            (),
            {
                "advice": "Top categories identified.",
                "forecast": [],
            },
        )()
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/budget-advisor/analyze",
            json={
                "transactions": [
                    {"amount": -100.0, "category": "food", "date": "2024-01-15"},
                    {"amount": -50.0, "category": "food", "date": "2024-01-16"},
                    {"amount": -30.0, "category": "entertainment", "date": "2024-01-17"},
                    {"amount": -20.0, "category": "transport", "date": "2024-01-18"},
                ],
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "top_categories" in data
        assert len(data["top_categories"]) > 0
        # Food should be top category (150 total)
        assert "food" in data["top_categories"]


@pytest.mark.asyncio
async def test_budget_advisor_analyze_spending_trends(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor generates spending trends."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.budget_advisor.BudgetAIService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.get_budget_advice.return_value = type(
            "BudgetAdviceResponse",
            (),
            {
                "advice": "Trends analyzed.",
                "forecast": [],
            },
        )()
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/budget-advisor/analyze",
            json={
                "transactions": [
                    {"amount": -50.0, "category": "food", "date": "2024-01-15"},
                    {"amount": -30.0, "category": "entertainment", "date": "2024-01-16"},
                ],
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "trends" in data
        assert isinstance(data["trends"], list)
        if len(data["trends"]) > 0:
            trend = data["trends"][0]
            assert "category" in trend
            assert "total_spent" in trend
            assert "transaction_count" in trend


@pytest.mark.asyncio
async def test_budget_advisor_analyze_unauthorized(client: AsyncClient):
    """Test budget advisor endpoint without authentication."""
    response = await client.post(
        "/api/budget-advisor/analyze",
        json={
            "transactions": [
                {"amount": -50.0, "category": "food", "date": "2024-01-15"},
            ],
        },
    )

    assert response.status_code == 401


@pytest.mark.asyncio
async def test_budget_advisor_analyze_invalid_amounts(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor with invalid transaction amounts."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.budget_advisor.BudgetAIService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.get_budget_advice.return_value = type(
            "BudgetAdviceResponse",
            (),
            {
                "advice": "Analysis complete.",
                "forecast": [],
            },
        )()
        mock_service_class.return_value = mock_service

        # Test with string amount (should be converted)
        response = await client.post(
            "/api/budget-advisor/analyze",
            json={
                "transactions": [
                    {
                        "amount": "50.0",  # String instead of number
                        "category": "food",
                        "date": "2024-01-15",
                    },
                ],
            },
            headers=auth_headers(user.id),
        )

        # Should handle conversion gracefully
        assert response.status_code in [200, 422]


@pytest.mark.asyncio
async def test_budget_advisor_analyze_missing_categories(client: AsyncClient, db_session: AsyncSession):
    """Test budget advisor with missing category fields."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    with patch("app.routers.budget_advisor.BudgetAIService") as mock_service_class:
        mock_service = AsyncMock()
        mock_service.get_budget_advice.return_value = type(
            "BudgetAdviceResponse",
            (),
            {
                "advice": "Analysis complete.",
                "forecast": [],
            },
        )()
        mock_service_class.return_value = mock_service

        response = await client.post(
            "/api/budget-advisor/analyze",
            json={
                "transactions": [
                    {
                        "amount": -50.0,
                        "date": "2024-01-15",
                        # Missing category - should default to "uncategorized"
                    },
                ],
            },
            headers=auth_headers(user.id),
        )

        assert response.status_code == 200
        data = response.json()
        assert "trends" in data
