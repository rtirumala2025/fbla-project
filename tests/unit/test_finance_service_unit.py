from __future__ import annotations

from dataclasses import dataclass
from types import SimpleNamespace
from uuid import uuid4
from contextlib import asynccontextmanager

import pytest

from app.schemas.finance import EarnRequest, FinanceSummary, GoalSummary, TransactionRecord, InventoryEntry, LeaderboardEntry
from app.services import finance_service


@dataclass
class DummyWallet:
    balance: int
    last_allowance_at: object = None
    lifetime_earned: int = 0
    lifetime_spent: int = 0
    donation_total: int = 0
    currency: str = "COIN"
    goals_snapshot: list[dict] | None = None
    daily_allowance_available: bool = True
    allowance_amount: int = finance_service.ALLOWANCE_AMOUNT
    notification_flag: bool = False
    lifetime_transactions: list[TransactionRecord] | None = None


def test_daily_allowance_available_respects_interval():
    wallet = DummyWallet(balance=100, last_allowance_at=None)
    assert finance_service._daily_allowance_available(wallet) is True

    wallet.last_allowance_at = finance_service.datetime.now(finance_service.timezone.utc)
    assert finance_service._daily_allowance_available(wallet) is False


def test_goal_notifications_for_completion_and_progress():
    goals = [
        GoalSummary(
            id=uuid4(),
            name="Complete Habitat",
            target_amount=500,
            current_amount=500,
            status="completed",
            deadline=None,
            completed_at=None,
            progress_percent=100.0,
        ),
        GoalSummary(
            id=uuid4(),
            name="Luxury Bed",
            target_amount=200,
            current_amount=185,
            status="active",
            deadline=None,
            completed_at=None,
            progress_percent=92.5,
        ),
    ]
    notifications = finance_service._goal_notifications(goals)
    assert any("completed" in note.lower() for note in notifications)
    assert any("keep it up" in note.lower() for note in notifications)


def test_generate_budget_warning_detects_low_balance_and_spending():
    wallet = SimpleNamespace(balance=15)
    transactions = [
        TransactionRecord(
            id=uuid4(),
            amount=40,
            transaction_type="expense",
            category="shop_purchase",
            description=None,
            created_at=finance_service.datetime.now(finance_service.timezone.utc),
            balance_after=10,
            related_goal_id=None,
            related_shop_item_id=None,
        )
    ]
    warning = finance_service._generate_budget_warning(wallet, transactions)
    assert "balance is getting low" in warning.lower()

    wallet.balance = 200
    transactions = [
        TransactionRecord(
            id=uuid4(),
            amount=80,
            transaction_type="expense",
            category="shop_purchase",
            description=None,
            created_at=finance_service.datetime.now(finance_service.timezone.utc),
            balance_after=120,
            related_goal_id=None,
            related_shop_item_id=None,
        )
        for _ in range(3)
    ]
    warning = finance_service._generate_budget_warning(wallet, transactions)
    assert "outpacing income" in warning.lower()


def test_recommendations_cover_common_cases():
    wallet = SimpleNamespace(balance=250)
    transactions = [
        TransactionRecord(
            id=uuid4(),
            amount=30,
            transaction_type="income",
            category="care_reward",
            description=None,
            created_at=finance_service.datetime.now(finance_service.timezone.utc),
            balance_after=250,
            related_goal_id=None,
            related_shop_item_id=None,
        ),
        TransactionRecord(
            id=uuid4(),
            amount=20,
            transaction_type="expense",
            category="vet",
            description=None,
            created_at=finance_service.datetime.now(finance_service.timezone.utc),
            balance_after=230,
            related_goal_id=None,
            related_shop_item_id=None,
        ),
    ]
    tips = finance_service._recommendations(wallet, transactions)
    assert any("premium care items" in tip for tip in tips)
    assert any("vet visit" in tip.lower() for tip in tips)


class _FakeSession:
    def __init__(self):
        self.flushed = False

    async def flush(self):
        self.flushed = True

    async def execute(self, *_args, **_kwargs):
        raise AssertionError("execute should be mocked for this test")

    async def refresh(self, _obj):
        return None

    @asynccontextmanager
    async def begin_nested(self):
        yield


@pytest.mark.asyncio
async def test_get_finance_summary_aggregates_components(monkeypatch: pytest.MonkeyPatch):
    wallet = DummyWallet(balance=120, lifetime_earned=200, lifetime_spent=80)

    async def fake_get_wallet(_session, _user_id):
        return wallet

    async def fake_transactions(*_args, **_kwargs):
        return [
            TransactionRecord(
                id=uuid4(),
                amount=25,
                transaction_type="income",
                category="care_reward",
                description="Daily reward",
                created_at=finance_service.datetime.now(finance_service.timezone.utc),
                balance_after=wallet.balance,
                related_goal_id=None,
                related_shop_item_id=None,
            )
        ]

    async def fake_inventory(*_args, **_kwargs):
        return [
            InventoryEntry(
                item_id="toy",
                item_name="Squeaky Toy",
                category="toy",
                quantity=1,
            )
        ]

    async def fake_goals(*_args, **_kwargs):
        return []

    async def fake_totals(*_args, **_kwargs):
        return (40, 10)

    async def fake_leaderboard(*_args, **_kwargs):
        return [
            LeaderboardEntry(
                user_id=uuid4(),
                balance=wallet.balance,
                care_score=10,
                rank=1,
            )
        ]

    monkeypatch.setattr(finance_service, "_get_wallet", fake_get_wallet)
    monkeypatch.setattr(finance_service, "_serialize_transactions", fake_transactions)
    monkeypatch.setattr(finance_service, "_serialize_inventory", fake_inventory)
    monkeypatch.setattr(finance_service, "_serialize_goals", fake_goals)
    monkeypatch.setattr(finance_service, "_calculate_daily_totals", fake_totals)
    monkeypatch.setattr(finance_service, "_generate_budget_warning", lambda *_args, **_kwargs: None)
    monkeypatch.setattr(finance_service, "_recommendations", lambda *_args, **_kwargs: ["tip"])
    monkeypatch.setattr(finance_service, "_daily_allowance_available", lambda *_args, **_kwargs: True)
    monkeypatch.setattr(finance_service, "_goal_notifications", lambda *_args, **_kwargs: ["notif"])
    monkeypatch.setattr(finance_service, "_leaderboard", fake_leaderboard)

    summary = await finance_service.get_finance_summary(_FakeSession(), uuid4())
    assert isinstance(summary, FinanceSummary)
    assert summary.balance == 120
    assert summary.transactions[0].category == "care_reward"
    assert summary.notifications[-1].startswith("Daily allowance")


@pytest.mark.asyncio
async def test_earn_coins_updates_wallet(monkeypatch: pytest.MonkeyPatch):
    wallet = DummyWallet(balance=0, lifetime_earned=0)

    async def fake_get_wallet(_session, _user_id):
        return wallet

    async def fake_record(*_args, **_kwargs):
        return None

    async def fake_summary(_session, _user_id):
        return FinanceSummary(
            currency="COIN",
            balance=wallet.balance,
            donation_total=wallet.donation_total,
            lifetime_earned=wallet.lifetime_earned,
            lifetime_spent=wallet.lifetime_spent,
            income_today=wallet.lifetime_earned,
            expenses_today=wallet.lifetime_spent,
            budget_warning=None,
            recommendations=[],
            notifications=[],
            daily_allowance_available=True,
            allowance_amount=finance_service.ALLOWANCE_AMOUNT,
            goals=[],
            transactions=[],
            inventory=[],
            leaderboard=[],
        )

    monkeypatch.setattr(finance_service, "_get_wallet", fake_get_wallet)
    monkeypatch.setattr(finance_service, "_record_transaction", fake_record)
    monkeypatch.setattr(finance_service, "get_finance_summary", fake_summary)

    session = _FakeSession()
    payload = EarnRequest(amount=50, reason="Daily reward", care_score=10)
    summary = await finance_service.earn_coins(session, uuid4(), payload)

    assert wallet.balance == 50
    assert wallet.lifetime_earned == 50
    assert summary.balance == 50


