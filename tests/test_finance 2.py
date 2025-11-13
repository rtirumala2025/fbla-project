"""
Integration tests for finance endpoints.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.finance import Goal, InventoryItem, ShopItem, Transaction, Wallet
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_finance_earn_and_summary(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"finance-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)
    response = await client.get("/api/finance", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["summary"]["balance"] == 0

    earn_payload = {"amount": 150, "reason": "Daily care reward", "care_score": 15}
    earn_response = await client.post("/api/finance/earn", json=earn_payload, headers=headers)
    assert earn_response.status_code == 201
    earn_data = earn_response.json()["summary"]
    assert earn_data["balance"] == 150
    assert earn_data["currency"] == "COIN"
    assert earn_data["lifetime_earned"] == 150
    assert earn_data["income_today"] >= 150
    assert earn_data["transactions"][0]["transaction_type"] == "income"
    assert earn_data["transactions"][0]["balance_after"] == 150
    assert earn_data["daily_allowance_available"] is True

    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


@pytest.mark.asyncio
async def test_finance_purchase_inventory_and_rollback(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"finance-shop-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)
    await client.post("/api/finance/earn", json={"amount": 500, "reason": "Signup bonus"}, headers=headers)

    # Ensure shop items exist and have stock
    food_item = await _get_or_create_shop_item(
        db_session,
        sku="test-food",
        name="Integration Kibble",
        category="food",
        price=40,
        stock=20,
    )
    toy_item = await _get_or_create_shop_item(
        db_session,
        sku="test-toy",
        name="Integration Squeaky Toy",
        category="toy",
        price=60,
        stock=15,
    )
    await db_session.commit()

    initial_food_stock = food_item.stock

    purchase_payload = {
        "items": [
            {"item_id": food_item.sku, "quantity": 2},
            {"item_id": toy_item.sku, "quantity": 1},
        ]
    }
    purchase_response = await client.post("/api/finance/purchase", json=purchase_payload, headers=headers)
    assert purchase_response.status_code == 201
    summary = purchase_response.json()["summary"]
    total_cost = 2 * food_item.price + toy_item.price
    assert summary["balance"] == 500 - total_cost
    assert summary["lifetime_spent"] == total_cost
    assert any(item["item_id"] == food_item.sku and item["quantity"] == 2 for item in summary["inventory"])

    wallet_stmt = select(Wallet).where(Wallet.user_id == user.id)
    wallet_result = await db_session.execute(wallet_stmt)
    wallet = wallet_result.scalar_one()

    # Inventory persisted
    inventory_stmt = select(InventoryItem).where(InventoryItem.wallet_id == wallet.id, InventoryItem.item_id == toy_item.sku)
    inventory_result = await db_session.execute(inventory_stmt)
    inventory_entry = inventory_result.scalar_one()
    assert inventory_entry.quantity == 1
    assert inventory_entry.shop_item_id == toy_item.id

    # Stock decreased
    refreshed_food = await db_session.get(ShopItem, food_item.id)
    assert refreshed_food.stock == initial_food_stock - 2

    # Failed purchase should rollback changes
    txn_count_before = await _transaction_count(db_session, wallet.id)
    fail_payload = {"items": [{"item_id": toy_item.sku, "quantity": 99}]}
    fail_response = await client.post("/api/finance/purchase", json=fail_payload, headers=headers)
    assert fail_response.status_code == 409
    wallet_after_fail = await db_session.get(Wallet, wallet.id)
    assert wallet_after_fail.balance == wallet.balance
    txn_count_after = await _transaction_count(db_session, wallet.id)
    assert txn_count_after == txn_count_before

    await _cleanup_finance_entities(db_session, user.id)


@pytest.mark.asyncio
async def test_finance_leaderboard(client: AsyncClient, db_session: AsyncSession):
    first_user = User(email=f"leaderboard-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    second_user = User(email=f"leaderboard-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add_all([first_user, second_user])
    await db_session.flush()

    first_headers = auth_headers(first_user.id)
    second_headers = auth_headers(second_user.id)

    await client.post("/api/finance/earn", json={"amount": 300, "reason": "Grand prize"}, headers=first_headers)
    await client.post("/api/finance/earn", json={"amount": 150, "reason": "Daily reward"}, headers=second_headers)
    await client.post("/api/finance/earn", json={"amount": 50, "reason": "Daily care reward", "care_score": 10}, headers=second_headers)

    leaderboard_response = await client.get("/api/finance/leaderboard", headers=first_headers)
    assert leaderboard_response.status_code == 200
    leaderboard = leaderboard_response.json()
    assert len(leaderboard) >= 2
    assert leaderboard[0]["user_id"] == str(first_user.id)

    care_board = await client.get("/api/finance/leaderboard?metric=care_score", headers=first_headers)
    assert care_board.status_code == 200
    care_list = care_board.json()
    assert care_list[0]["care_score"] >= care_list[-1]["care_score"]

    await _cleanup_finance_entities(db_session, first_user.id)
    await _cleanup_finance_entities(db_session, second_user.id)
    await db_session.commit()


@pytest.mark.asyncio
async def test_daily_allowance_once_per_day(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"allowance-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)
    first_claim = await client.post("/api/finance/daily-allowance", headers=headers)
    assert first_claim.status_code == 201
    summary = first_claim.json()["summary"]
    assert summary["balance"] == summary["allowance_amount"]
    assert summary["daily_allowance_available"] is False

    second_claim = await client.post("/api/finance/daily-allowance", headers=headers)
    assert second_claim.status_code == 409

    await _cleanup_finance_entities(db_session, user.id)
    await db_session.commit()


@pytest.mark.asyncio
async def test_donation_flow(client: AsyncClient, db_session: AsyncSession):
    donor = User(email=f"donor-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    recipient = User(email=f"recipient-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add_all([donor, recipient])
    await db_session.flush()

    donor_headers = auth_headers(donor.id)
    recipient_headers = auth_headers(recipient.id)

    await client.post("/api/finance/earn", json={"amount": 300, "reason": "Gift"}, headers=donor_headers)
    donation_payload = {"recipient_id": str(recipient.id), "amount": 120, "message": "For your pet"}
    donation_response = await client.post("/api/finance/donate", json=donation_payload, headers=donor_headers)
    assert donation_response.status_code == 201

    donor_wallet = await _get_wallet(db_session, donor.id)
    recipient_wallet = await _get_wallet(db_session, recipient.id)
    assert donor_wallet.balance == 180
    assert recipient_wallet.balance == 120
    assert donor_wallet.donation_total == 120

    donor_txns = await _transactions_for_wallet(db_session, donor_wallet.id)
    recipient_txns = await _transactions_for_wallet(db_session, recipient_wallet.id)
    assert any(tx.category == "donation_out" for tx in donor_txns)
    assert any(tx.category == "donation_in" for tx in recipient_txns)

    fail_payload = {"recipient_id": str(recipient.id), "amount": 9999}
    fail_response = await client.post("/api/finance/donate", json=fail_payload, headers=donor_headers)
    assert fail_response.status_code == 400

    await _cleanup_finance_entities(db_session, donor.id)
    await _cleanup_finance_entities(db_session, recipient.id)
    await db_session.commit()


@pytest.mark.asyncio
async def test_goal_lifecycle(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"goals-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)
    await client.post("/api/finance/earn", json={"amount": 500, "reason": "Goal seed"}, headers=headers)

    create_payload = {"name": "Luxury Pet Bed", "target_amount": 300}
    create_response = await client.post("/api/finance/goals", json=create_payload, headers=headers)
    assert create_response.status_code == 201
    summary = create_response.json()["summary"]
    assert len(summary["goals"]) == 1
    goal_id = summary["goals"][0]["id"]
    assert summary["goals"][0]["status"] == "active"

    contribution_payload = {"amount": 150}
    contribution_response = await client.post(
        f"/api/finance/goals/{goal_id}/contribute", json=contribution_payload, headers=headers
    )
    assert contribution_response.status_code == 201
    after_first = contribution_response.json()["summary"]
    assert after_first["goals"][0]["current_amount"] == 150
    assert after_first["balance"] == 350

    second_contribution = await client.post(
        f"/api/finance/goals/{goal_id}/contribute", json={"amount": 200}, headers=headers
    )
    assert second_contribution.status_code == 201
    after_second = second_contribution.json()["summary"]
    goal_summary = after_second["goals"][0]
    assert goal_summary["status"] == "completed"
    assert goal_summary["current_amount"] >= goal_summary["target_amount"]
    assert any("completed" in note.lower() for note in after_second["notifications"])

    goals_list = await client.get("/api/finance/goals", headers=headers)
    assert goals_list.status_code == 200
    assert len(goals_list.json()) == 1

    await _cleanup_finance_entities(db_session, user.id)
    await db_session.commit()


async def _get_or_create_shop_item(
    session: AsyncSession,
    *,
    sku: str,
    name: str,
    category: str,
    price: int,
    stock: int,
) -> ShopItem:
    stmt = select(ShopItem).where(ShopItem.sku == sku)
    result = await session.execute(stmt)
    shop_item = result.scalar_one_or_none()
    if shop_item is None:
        shop_item = ShopItem(
            sku=sku,
            name=name,
            category=category,
            price=price,
            stock=stock,
            is_active=True,
        )
        session.add(shop_item)
        await session.flush()
    else:
        await session.execute(
            update(ShopItem)
            .where(ShopItem.id == shop_item.id)
            .values(stock=stock, price=price, is_active=True)
        )
        shop_item.stock = stock
        shop_item.price = price
        shop_item.is_active = True
        await session.flush()
    return shop_item


async def _transaction_count(session: AsyncSession, wallet_id: uuid.UUID) -> int:
    stmt = select(Transaction).where(Transaction.wallet_id == wallet_id)
    result = await session.execute(stmt)
    return len(result.scalars().all())


async def _get_wallet(session: AsyncSession, user_id: uuid.UUID) -> Wallet:
    stmt = select(Wallet).where(Wallet.user_id == user_id)
    result = await session.execute(stmt)
    wallet = result.scalar_one_or_none()
    if wallet is None:
        raise AssertionError("Wallet not found")
    return wallet


async def _transactions_for_wallet(session: AsyncSession, wallet_id: uuid.UUID) -> list[Transaction]:
    stmt = select(Transaction).where(Transaction.wallet_id == wallet_id)
    result = await session.execute(stmt)
    return result.scalars().all()


async def _cleanup_finance_entities(session: AsyncSession, user_id: uuid.UUID) -> None:
    stmt_wallet = select(Wallet).where(Wallet.user_id == user_id)
    wallet_result = await session.execute(stmt_wallet)
    wallet = wallet_result.scalar_one_or_none()
    if wallet:
        await session.execute(delete(Transaction).where(Transaction.wallet_id == wallet.id))
        await session.execute(delete(InventoryItem).where(InventoryItem.wallet_id == wallet.id))
        await session.execute(delete(Goal).where(Goal.wallet_id == wallet.id))
        await session.execute(delete(Wallet).where(Wallet.id == wallet.id))
    await session.execute(delete(User).where(User.id == user_id))

