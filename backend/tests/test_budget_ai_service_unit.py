"""
Unit tests for Budget AI service
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.budget_ai_service import BudgetAIService


@pytest.mark.anyio
async def test_budget_ai_service_initialization():
    """Test Budget AI service initializes correctly"""
    service = BudgetAIService(pool=None)
    assert service._pool is None
    assert service._client is None


@pytest.mark.anyio
async def test_analyze_transactions():
    """Test analyzing transactions"""
    service = BudgetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    transactions = [
        {"amount": -50, "category": "food", "date": "2024-01-01"},
        {"amount": -30, "category": "entertainment", "date": "2024-01-02"},
        {"amount": -20, "category": "food", "date": "2024-01-03"},
    ]

    monthly_budget = 500

    analysis = await service.analyze_transactions(
        "user-1",
        transactions,
        monthly_budget
    )

    assert analysis is not None
    assert isinstance(analysis, dict)
    # Should include insights, recommendations, or spending patterns
    assert len(analysis) > 0


@pytest.mark.anyio
async def test_analyze_transactions_empty_list():
    """Test analyzing empty transaction list"""
    service = BudgetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    analysis = await service.analyze_transactions("user-1", [], None)

    assert analysis is not None
    assert isinstance(analysis, dict)


@pytest.mark.anyio
async def test_analyze_transactions_without_budget():
    """Test analyzing transactions without monthly budget"""
    service = BudgetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    transactions = [
        {"amount": -50, "category": "food", "date": "2024-01-01"},
    ]

    analysis = await service.analyze_transactions("user-1", transactions, None)

    assert analysis is not None
    assert isinstance(analysis, dict)


@pytest.mark.anyio
async def test_analyze_transactions_large_dataset():
    """Test analyzing large transaction dataset"""
    service = BudgetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    # Generate 100 transactions
    transactions = [
        {
            "amount": -10 * (i % 10 + 1),
            "category": ["food", "entertainment", "shopping"][i % 3],
            "date": f"2024-01-{(i % 28) + 1:02d}",
        }
        for i in range(100)
    ]

    analysis = await service.analyze_transactions("user-1", transactions, 1000)

    assert analysis is not None
    assert isinstance(analysis, dict)


@pytest.mark.anyio
async def test_analyze_transactions_negative_amounts():
    """Test handling negative transaction amounts"""
    service = BudgetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    transactions = [
        {"amount": -100, "category": "food", "date": "2024-01-01"},
        {"amount": -50, "category": "shopping", "date": "2024-01-02"},
    ]

    analysis = await service.analyze_transactions("user-1", transactions, 500)

    assert analysis is not None
    # Should handle negative amounts correctly
    assert isinstance(analysis, dict)


@pytest.mark.anyio
async def test_analyze_transactions_missing_fields():
    """Test handling transactions with missing optional fields"""
    service = BudgetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    transactions = [
        {"amount": -50},  # Missing category and date
        {"amount": -30, "category": "food"},  # Missing date
    ]

    # Should not crash
    analysis = await service.analyze_transactions("user-1", transactions, None)

    assert analysis is not None
    assert isinstance(analysis, dict)


@pytest.mark.anyio
async def test_health_check():
    """Test budget AI service health check"""
    service = BudgetAIService(pool=None)

    # Health check should return status
    # This may vary based on implementation
    health = await service.health_check()

    # Should return some status indicator
    assert health is not None


@pytest.mark.anyio
async def test_retry_logic():
    """Test service retries on API failures"""
    service = BudgetAIService(pool=None)
    service._context_mgr = None  # type: ignore[attr-defined]

    with patch('httpx.AsyncClient.post') as mock_post:
        # First call fails, second succeeds
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{
                "message": {
                    "content": '{"insights": "Test analysis"}'
                }
            }]
        }
        mock_response.raise_for_status = MagicMock()

        mock_post.side_effect = [
            Exception("Network error"),
            mock_response,
        ]

        transactions = [{"amount": -50, "category": "food"}]
        analysis = await service.analyze_transactions("user-1", transactions, 500)

        assert analysis is not None
        assert mock_post.call_count >= 2
