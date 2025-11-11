"""
Analytics endpoint tests.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import AnalyticsDailySnapshot, AnalyticsNotification
from app.core.jwt import create_access_token
from app.models.finance import Transaction, Wallet
from app.models.user import User, hash_password
from app.services.analytics_service import generate_daily_snapshot


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


async def seed_finance(db_session: AsyncSession, user_id: uuid.UUID):
    wallet = Wallet(user_id=user_id, balance=0)
    db_session.add(wallet)
    await db_session.flush()

    now = datetime.now(tz=timezone.utc)
    for offset in range(3):
        amount = 50 + offset * 10
        tx = Transaction(
            wallet_id=wallet.id,
            user_id=user_id,
            amount=amount,
            transaction_type="income",
            category="care_reward",
            description="Daily care reward",
            created_at=now - timedelta(days=offset),
        )
        db_session.add(tx)
    await db_session.flush()
    return wallet


@pytest.mark.asyncio
async def test_analytics_snapshot(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"analytics-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)
    await seed_finance(db_session, user.id)

    snapshot_response = await client.get("/api/analytics/snapshot", headers=headers)
    assert snapshot_response.status_code == 200
    data = snapshot_response.json()
    assert data["end_of_day"]["coins_earned"] >= 0
    assert "daily_summary" in data
    assert data["daily_summary"]["period"] == "daily"
    assert data["weekly_summary"]["period"] == "weekly"
    assert data["monthly_summary"]["period"] == "monthly"
    assert isinstance(data["notifications"], list)
    assert isinstance(data["ai_insights"], list)
    assert data["weekly_trend"]["label"] == "weekly_net_coins"

    weekly_response = await client.get("/api/analytics/daily", headers=headers)
    assert weekly_response.status_code == 200
    weekly = weekly_response.json()
    assert len(weekly["reports"]) <= 7

    start = date.today() - timedelta(days=2)
    end = date.today()
    export_response = await client.get(
        f"/api/analytics/export?start={start.isoformat()}&end={end.isoformat()}",
        headers=headers,
    )
    assert export_response.status_code == 200
    assert "Content-Disposition" in export_response.headers
    assert "date,coins_earned" in export_response.text

    await db_session.execute(delete(Transaction).where(Transaction.user_id == user.id))
    await db_session.execute(delete(Wallet).where(Wallet.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


@pytest.mark.asyncio
async def test_snapshot_generates_notifications(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"analytics-notify-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    # Seed previous day snapshot with high health and coins to trigger drop notification
    yesterday = date.today() - timedelta(days=1)
    previous_snapshot = AnalyticsDailySnapshot(
        user_id=user.id,
        snapshot_date=yesterday,
        coins_earned=400,
        coins_spent=50,
        net_coins=350,
        happiness_gain=20,
        health_change=10,
        games_played=4,
        pet_actions=3,
        avg_happiness=85,
        avg_health=90,
        avg_energy=80,
        avg_cleanliness=78,
        ai_summary="Strong performance yesterday.",
    )
    db_session.add(previous_snapshot)
    await db_session.commit()

    headers = auth_headers(user.id)
    await generate_daily_snapshot(db_session, user.id, date.today())
    await db_session.commit()

    snapshot_response = await client.get("/api/analytics/snapshot", headers=headers)
    assert snapshot_response.status_code == 200
    payload = snapshot_response.json()
    assert payload["notifications"], "Expected notifications for significant stat change."
    health_notes = [note for note in payload["notifications"] if note["stat"] == "avg_health"]
    assert health_notes, "Expected a health notification due to drop from previous snapshot."
    assert health_notes[0]["severity"] in {"critical", "warning"}

    await db_session.execute(delete(AnalyticsNotification).where(AnalyticsNotification.user_id == user.id))
    await db_session.execute(delete(AnalyticsDailySnapshot).where(AnalyticsDailySnapshot.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()

