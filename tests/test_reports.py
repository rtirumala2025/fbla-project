"""
Tests for advanced reporting and analytics endpoints.
"""

from __future__ import annotations

import base64
from datetime import date, datetime, timedelta, timezone
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.finance import Transaction, Wallet
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


async def seed_test_data(db_session: AsyncSession, user_id: uuid.UUID):
    """Seed test data for reports."""
    wallet = Wallet(user_id=user_id, balance=100)
    db_session.add(wallet)
    await db_session.flush()

    now = datetime.now(tz=timezone.utc)
    # Add some transactions
    for i in range(10):
        tx = Transaction(
            wallet_id=wallet.id,
            user_id=user_id,
            amount=10.0 + i * 2,
            transaction_type="expense" if i % 2 == 0 else "income",
            category="test_category",
            description=f"Test transaction {i}",
            created_at=now - timedelta(days=i),
        )
        db_session.add(tx)
    await db_session.flush()
    return wallet


@pytest.mark.asyncio
async def test_get_available_metrics(client: AsyncClient, db_session: AsyncSession):
    """Test getting available metrics."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    response = await client.get(
        "/api/reports/metrics",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "key" in data[0]
    assert "label" in data[0]


@pytest.mark.asyncio
async def test_forecast_cost(client: AsyncClient, db_session: AsyncSession):
    """Test cost forecasting endpoint."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    await seed_test_data(db_session, user.id)

    response = await client.post(
        "/api/reports/forecast_cost?forecast_days=30",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    data = response.json()
    assert "forecast_period_start" in data
    assert "forecast_period_end" in data
    assert "current_average_daily_cost" in data
    assert "predicted_average_daily_cost" in data
    assert "total_predicted_cost" in data
    assert "forecast_points" in data
    assert "insights" in data
    assert len(data["forecast_points"]) == 30


@pytest.mark.asyncio
async def test_forecast_cost_invalid_days(client: AsyncClient, db_session: AsyncSession):
    """Test forecast with invalid days parameter."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    # Test with too many days
    response = await client.post(
        "/api/reports/forecast_cost?forecast_days=500",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 400

    # Test with zero days
    response = await client.post(
        "/api/reports/forecast_cost?forecast_days=0",
        headers=auth_headers(user.id),
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_export_pdf(client: AsyncClient, db_session: AsyncSession):
    """Test PDF export endpoint."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    await seed_test_data(db_session, user.id)

    start_date = (date.today() - timedelta(days=7)).isoformat()
    end_date = date.today().isoformat()

    response = await client.post(
        "/api/reports/export_pdf",
        json={
            "start_date": start_date,
            "end_date": end_date,
            "selected_metrics": [],
            "include_charts": True,
            "include_forecast": False,
        },
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    data = response.json()
    assert "filename" in data
    assert "content" in data
    assert data["filename"].endswith(".pdf")
    
    # Verify it's valid base64
    try:
        pdf_bytes = base64.b64decode(data["content"])
        assert len(pdf_bytes) > 0
        # PDF files start with %PDF
        assert pdf_bytes[:4] == b"%PDF"
    except Exception:
        pytest.fail("PDF content is not valid base64 or PDF format")


@pytest.mark.asyncio
async def test_export_pdf_invalid_date_range(client: AsyncClient, db_session: AsyncSession):
    """Test PDF export with invalid date range."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    start_date = date.today().isoformat()
    end_date = (date.today() - timedelta(days=7)).isoformat()  # End before start

    response = await client.post(
        "/api/reports/export_pdf",
        json={
            "start_date": start_date,
            "end_date": end_date,
            "selected_metrics": [],
            "include_charts": True,
            "include_forecast": False,
        },
        headers=auth_headers(user.id),
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_export_pdf_too_large_range(client: AsyncClient, db_session: AsyncSession):
    """Test PDF export with date range exceeding limit."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    start_date = (date.today() - timedelta(days=400)).isoformat()
    end_date = date.today().isoformat()

    response = await client.post(
        "/api/reports/export_pdf",
        json={
            "start_date": start_date,
            "end_date": end_date,
            "selected_metrics": [],
            "include_charts": True,
            "include_forecast": False,
        },
        headers=auth_headers(user.id),
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_filtered_report(client: AsyncClient, db_session: AsyncSession):
    """Test filtered report endpoint."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    start_date = (date.today() - timedelta(days=7)).isoformat()
    end_date = date.today().isoformat()

    response = await client.post(
        "/api/reports/filtered",
        json={
            "start_date": start_date,
            "end_date": end_date,
            "selected_metrics": ["coins_earned", "coins_spent"],
        },
        headers=auth_headers(user.id),
    )
    assert response.status_code == 200
    data = response.json()
    assert "start_date" in data
    assert "end_date" in data
    assert "selected_metrics" in data
    assert "data" in data


@pytest.mark.asyncio
async def test_get_filtered_report_invalid_dates(client: AsyncClient, db_session: AsyncSession):
    """Test filtered report with invalid dates."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        hashed_password=hash_password("password123"),
    )
    db_session.add(user)
    await db_session.commit()

    start_date = date.today().isoformat()
    end_date = (date.today() - timedelta(days=7)).isoformat()  # End before start

    response = await client.post(
        "/api/reports/filtered",
        json={
            "start_date": start_date,
            "end_date": end_date,
            "selected_metrics": [],
        },
        headers=auth_headers(user.id),
    )
    assert response.status_code == 400
