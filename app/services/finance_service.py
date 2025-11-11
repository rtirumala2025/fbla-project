"""
Finance service: handles wallets, transactions, inventory, and leaderboards.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any, Iterable, Sequence
from uuid import UUID

from sqlalchemy import Select, case, desc, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.finance import Goal, InventoryItem, ShopItem, Transaction, Wallet
from app.schemas.finance import (
    EarnRequest,
    DonationRequest,
    FinanceResponse,
    FinanceSummary,
    InventoryEntry,
    LeaderboardEntry,
    GoalCreateRequest,
    GoalContributionRequest,
    GoalSummary,
    PurchaseRequest,
    ShopItemEntry,
    TransactionRecord,
)


class InsufficientFundsError(ValueError):
    """Raised when trying to deduct coins beyond the available balance."""


class AllowanceAlreadyClaimedError(ValueError):
    """Raised when a user attempts to claim the daily allowance more than once per interval."""


class InvalidDonationError(ValueError):
    """Raised when a donation request is invalid."""


class InsufficientStockError(ValueError):
    """Raised when a requested shop item lacks available stock."""


class GoalNotFoundError(ValueError):
    """Raised when attempting to update a goal that does not exist."""


ALLOWANCE_AMOUNT = 50
ALLOWANCE_INTERVAL = timedelta(hours=24)
DONATION_MIN_AMOUNT = 1


async def _get_wallet(session: AsyncSession, user_id: UUID | str) -> Wallet:
    if isinstance(user_id, str):
        user_id = UUID(user_id)
    result = await session.execute(select(Wallet).where(Wallet.user_id == user_id))
    wallet = result.scalar_one_or_none()
    if wallet is None:
        wallet = Wallet(user_id=user_id)
        session.add(wallet)
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            result = await session.execute(select(Wallet).where(Wallet.user_id == user_id))
            wallet = result.scalar_one()
    return wallet


async def _serialize_transactions(session: AsyncSession, wallet: Wallet, limit: int = 20) -> list[TransactionRecord]:
    stmt: Select[Any] = (
        select(Transaction)
        .where(Transaction.wallet_id == wallet.id)
        .order_by(desc(Transaction.created_at))
        .limit(limit)
    )
    result = await session.execute(stmt)
    items = result.scalars().all()
    return [
        TransactionRecord(
            id=entry.id,
            amount=entry.amount,
            transaction_type=entry.transaction_type,
            category=entry.category,
            description=entry.description,
            created_at=entry.created_at,
            balance_after=entry.balance_after,
            related_goal_id=entry.related_goal_id,
            related_shop_item_id=entry.related_shop_item_id,
        )
        for entry in items
    ]


async def _serialize_inventory(session: AsyncSession, wallet: Wallet) -> list[InventoryEntry]:
    stmt = select(InventoryItem).where(InventoryItem.wallet_id == wallet.id).order_by(InventoryItem.item_name)
    result = await session.execute(stmt)
    items = result.scalars().all()
    return [
        InventoryEntry(
            item_id=item.item_id,
            item_name=item.item_name,
            category=item.category,
            quantity=item.quantity,
        )
        for item in items
    ]


async def _serialize_goals(session: AsyncSession, wallet: Wallet) -> list[GoalSummary]:
    stmt = select(Goal).where(Goal.wallet_id == wallet.id).order_by(desc(Goal.created_at))
    result = await session.execute(stmt)
    goals = result.scalars().all()
    summaries: list[GoalSummary] = []
    for goal in goals:
        progress = 0.0
        if goal.target_amount > 0:
            progress = min(100.0, (goal.current_amount / goal.target_amount) * 100)
        summaries.append(
            GoalSummary(
                id=goal.id,
                name=goal.name,
                target_amount=goal.target_amount,
                current_amount=goal.current_amount,
                status=goal.status,
                deadline=goal.deadline,
                completed_at=goal.completed_at,
                progress_percent=progress,
            )
        )
    # Cache snapshot for quick dashboard references
    wallet.goals_snapshot = [summary.dict() for summary in summaries]
    await session.flush()
    return summaries


async def _calculate_daily_totals(session: AsyncSession, wallet: Wallet) -> tuple[int, int]:
    now = datetime.now(tz=timezone.utc)
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    stmt = (
        select(Transaction.transaction_type, func.coalesce(func.sum(Transaction.amount), 0))
        .where(Transaction.wallet_id == wallet.id, Transaction.created_at >= start_of_day)
        .group_by(Transaction.transaction_type)
    )
    result = await session.execute(stmt)
    income_today = 0
    expenses_today = 0
    for tx_type, total in result.all():
        if tx_type == "income":
            income_today = int(total or 0)
        else:
            expenses_today = int(total or 0)
    return income_today, expenses_today


def _daily_allowance_available(wallet: Wallet) -> bool:
    if wallet.last_allowance_at is None:
        return True
    last_allowance = wallet.last_allowance_at
    if last_allowance.tzinfo is None:
        last_allowance = last_allowance.replace(tzinfo=timezone.utc)
        wallet.last_allowance_at = last_allowance
    return datetime.now(tz=timezone.utc) - last_allowance >= ALLOWANCE_INTERVAL


def _goal_notifications(goals: Iterable[GoalSummary]) -> list[str]:
    notifications: list[str] = []
    for goal in goals:
        remaining = goal.target_amount - goal.current_amount
        if goal.status == "completed":
            notifications.append(f"Goal '{goal.name}' completed! 🎉")
        elif goal.target_amount > 0 and remaining > 0:
            if remaining <= max(10, int(goal.target_amount * 0.2)):
                notifications.append(f"You're close to finishing '{goal.name}'. Keep it up!")
    return notifications


async def get_shop_catalog(session: AsyncSession) -> list[ShopItemEntry]:
    stmt = (
        select(ShopItem)
        .where(ShopItem.is_active.is_(True))
        .order_by(ShopItem.category, ShopItem.name)
    )
    result = await session.execute(stmt)
    items = result.scalars().all()
    return [
        ShopItemEntry(
            id=item.id,
            sku=item.sku,
            name=item.name,
            category=item.category,
            price=item.price,
            stock=item.stock,
            description=item.description,
            metadata=item.metadata_json,
        )
        for item in items
    ]


async def _fetch_shop_item_map(session: AsyncSession, item_ids: Iterable[str]) -> dict[str, ShopItem]:
    unique_ids = {item_id for item_id in item_ids if item_id}
    if not unique_ids:
        return {}
    stmt = select(ShopItem).where(ShopItem.sku.in_(unique_ids))
    result = await session.execute(stmt)
    records = result.scalars().all()
    return {record.sku: record for record in records}


async def _record_transaction(
    session: AsyncSession,
    wallet: Wallet,
    *,
    amount: int,
    transaction_type: str,
    category: str,
    description: str | None = None,
    metadata: dict[str, Any] | None = None,
    balance_after: int | None = None,
    related_goal_id: UUID | None = None,
    related_shop_item_id: UUID | None = None,
) -> None:
    if transaction_type not in {"income", "expense"}:
        raise ValueError("Invalid transaction type.")
    entry = Transaction(
        wallet_id=wallet.id,
        user_id=wallet.user_id,
        amount=amount,
        transaction_type=transaction_type,
        category=category,
        description=description,
        metadata_json=metadata,
        balance_after=balance_after,
        related_goal_id=related_goal_id,
        related_shop_item_id=related_shop_item_id,
    )
    session.add(entry)
    await session.flush()


def _generate_budget_warning(wallet: Wallet, transactions: Sequence[TransactionRecord]) -> str | None:
    if wallet.balance < 20:
        return "Balance is getting low. Consider earning coins before spending more."

    recent_expenses = [tx for tx in transactions if tx.transaction_type == "expense"]
    if len(recent_expenses) >= 3 and sum(tx.amount for tx in recent_expenses[:3]) > wallet.balance:
        return "Recent spending is outpacing income. Slow down to avoid going broke."

    return None


def _recommendations(wallet: Wallet, transactions: Sequence[TransactionRecord]) -> list[str]:
    tips: list[str] = []
    if wallet.balance >= 200:
        tips.append("Great savings! Consider investing in premium care items.")
    if any(tx.category == "vet" for tx in transactions):
        tips.append("Vet visit recorded. Earn daily rewards to replenish savings.")
    if not tips:
        tips.append("Complete daily care tasks to earn consistent coins.")
    return tips


async def _leaderboard(session: AsyncSession, metric: str = "balance", limit: int = 10) -> list[LeaderboardEntry]:
    stmt = select(Wallet.user_id, Wallet.balance)
    if metric == "care_score":
        care_subquery = (
            select(
                Transaction.user_id,
                func.coalesce(func.sum(Transaction.amount), 0).label("care_score"),
            )
            .where(Transaction.category == "care_reward")
            .group_by(Transaction.user_id)
            .subquery()
        )
        stmt = (
            select(
                Wallet.user_id,
                Wallet.balance,
                func.coalesce(care_subquery.c.care_score, 0).label("care_score"),
            )
            .outerjoin(care_subquery, care_subquery.c.user_id == Wallet.user_id)
            .order_by(desc("care_score"), desc(Wallet.balance))
            .limit(limit)
        )
    else:
        care_case = case((Transaction.category == "care_reward", Transaction.amount), else_=0)
        stmt = (
            select(
                Wallet.user_id,
                Wallet.balance,
                func.coalesce(func.sum(care_case), 0).label("care_score"),
            )
            .outerjoin(Transaction, Transaction.wallet_id == Wallet.id)
            .group_by(Wallet.user_id, Wallet.balance)
            .order_by(desc(Wallet.balance))
            .limit(limit)
        )

    result = await session.execute(stmt)
    entries = result.all()
    leaderboard: list[LeaderboardEntry] = []
    for rank, row in enumerate(entries, start=1):
        user_id = row[0]
        balance = row[1]
        care_score = row[2] if len(row) > 2 else 0
        leaderboard.append(LeaderboardEntry(user_id=user_id, balance=balance, care_score=care_score, rank=rank))
    return leaderboard


async def get_finance_summary(session: AsyncSession, user_id: UUID | str) -> FinanceSummary:
    wallet = await _get_wallet(session, user_id)
    transactions = await _serialize_transactions(session, wallet, limit=20)
    inventory = await _serialize_inventory(session, wallet)
    goals = await _serialize_goals(session, wallet)
    income_today, expenses_today = await _calculate_daily_totals(session, wallet)
    warning = _generate_budget_warning(wallet, transactions)
    recommendations = _recommendations(wallet, transactions)
    allowance_available = _daily_allowance_available(wallet)
    notifications = _goal_notifications(goals)
    if allowance_available:
        notifications.append(f"Daily allowance available! Claim {ALLOWANCE_AMOUNT} {wallet.currency}.")
    leaderboard = await _leaderboard(session, metric="balance")
    return FinanceSummary(
        currency=wallet.currency,
        balance=wallet.balance,
        donation_total=wallet.donation_total,
        lifetime_earned=wallet.lifetime_earned,
        lifetime_spent=wallet.lifetime_spent,
        income_today=income_today,
        expenses_today=expenses_today,
        budget_warning=warning,
        recommendations=recommendations,
        notifications=notifications,
        daily_allowance_available=allowance_available,
        allowance_amount=ALLOWANCE_AMOUNT,
        goals=goals,
        transactions=transactions,
        inventory=inventory,
        leaderboard=leaderboard,
    )


async def earn_coins(session: AsyncSession, user_id: UUID | str, payload: EarnRequest) -> FinanceSummary:
    wallet = await _get_wallet(session, user_id)
    async with session.begin_nested():
        wallet.balance += payload.amount
        wallet.lifetime_earned += payload.amount
        metadata: dict[str, Any] = {"reason": payload.reason}
        if payload.care_score is not None:
            metadata["care_score"] = payload.care_score
        await _record_transaction(
            session,
            wallet,
            amount=payload.amount,
            transaction_type="income",
            category="care_reward" if payload.care_score is not None else "income",
            description=payload.reason,
            metadata=metadata,
            balance_after=wallet.balance,
        )
    return await get_finance_summary(session, user_id)


async def _apply_inventory_updates(
    session: AsyncSession,
    wallet: Wallet,
    items: Iterable[tuple[ShopItem, int]],
) -> None:
    counts: dict[str, dict[str, Any]] = defaultdict(lambda: {"quantity": 0, "item": None})
    for shop_item, quantity in items:
        counts[shop_item.sku]["quantity"] += quantity
        counts[shop_item.sku]["item"] = shop_item

    for sku, data in counts.items():
        shop_item: ShopItem = data["item"]
        quantity = data["quantity"]
        stmt = select(InventoryItem).where(InventoryItem.wallet_id == wallet.id, InventoryItem.item_id == sku)
        result = await session.execute(stmt)
        record = result.scalar_one_or_none()
        if record is None:
            record = InventoryItem(
                wallet_id=wallet.id,
                user_id=wallet.user_id,
                item_id=shop_item.sku,
                item_name=shop_item.name,
                category=shop_item.category,
                quantity=quantity,
                shop_item_id=shop_item.id,
            )
            session.add(record)
        else:
            record.quantity += quantity
            record.updated_at = datetime.now(tz=timezone.utc)
        await session.flush()


async def _get_goal(session: AsyncSession, wallet: Wallet, goal_id: UUID | str) -> Goal:
    if isinstance(goal_id, str):
        goal_id = UUID(goal_id)
    stmt = select(Goal).where(Goal.id == goal_id, Goal.wallet_id == wallet.id)
    result = await session.execute(stmt)
    goal = result.scalar_one_or_none()
    if goal is None:
        raise GoalNotFoundError("Goal not found.")
    return goal


async def purchase_items(session: AsyncSession, user_id: UUID | str, payload: PurchaseRequest) -> FinanceSummary:
    wallet = await _get_wallet(session, user_id)

    async with session.begin_nested():
        items_map = await _fetch_shop_item_map(session, [item.item_id for item in payload.items])
        if len(items_map) < len({item.item_id for item in payload.items}):
            missing = {item.item_id for item in payload.items if item.item_id not in items_map}
            raise InsufficientStockError(f"Shop items not found: {', '.join(sorted(missing))}")

        purchase_lines: list[tuple[ShopItem, int]] = []
        total_cost = 0
        metadata_items: list[dict[str, Any]] = []
        primary_shop_item_id: UUID | None = None

        for request_item in payload.items:
            shop_item = items_map[request_item.item_id]
            if not shop_item.is_active:
                raise InsufficientStockError(f"Item '{shop_item.name}' is no longer available.")

            if shop_item.stock is not None and shop_item.stock < request_item.quantity:
                raise InsufficientStockError(f"Not enough stock for '{shop_item.name}'.")

            line_cost = shop_item.price * request_item.quantity
            total_cost += line_cost
            purchase_lines.append((shop_item, request_item.quantity))
            if primary_shop_item_id is None and len(payload.items) == 1:
                primary_shop_item_id = shop_item.id
            metadata_items.append(
                {
                    "item_id": shop_item.sku,
                    "item_name": shop_item.name,
                    "category": shop_item.category,
                    "price": shop_item.price,
                    "quantity": request_item.quantity,
                }
            )

        if total_cost > wallet.balance:
            raise InsufficientFundsError("Not enough coins to complete the purchase.")

        wallet.balance -= total_cost
        wallet.lifetime_spent += total_cost

        for shop_item, quantity in purchase_lines:
            if shop_item.stock is not None:
                if shop_item.stock < quantity:
                    raise InsufficientStockError(f"Not enough stock remaining for '{shop_item.name}'.")
                shop_item.stock -= quantity
                shop_item.updated_at = datetime.now(tz=timezone.utc)

        await _record_transaction(
            session,
            wallet,
            amount=total_cost,
            transaction_type="expense",
            category="shop_purchase",
            description=f"Purchased {len(payload.items)} item(s)",
            metadata={
                "items": metadata_items,
                "pet_id": str(payload.pet_id) if payload.pet_id else None,
            },
            balance_after=wallet.balance,
            related_shop_item_id=primary_shop_item_id,
        )

        await _apply_inventory_updates(session, wallet, purchase_lines)
    return await get_finance_summary(session, user_id)


async def claim_daily_allowance(session: AsyncSession, user_id: UUID | str) -> FinanceSummary:
    wallet = await _get_wallet(session, user_id)
    if not _daily_allowance_available(wallet):
        raise AllowanceAlreadyClaimedError("Daily allowance already claimed. Try again tomorrow.")

    async with session.begin_nested():
        wallet.balance += ALLOWANCE_AMOUNT
        wallet.lifetime_earned += ALLOWANCE_AMOUNT
        wallet.last_allowance_at = datetime.now(tz=timezone.utc)
        await _record_transaction(
            session,
            wallet,
            amount=ALLOWANCE_AMOUNT,
            transaction_type="income",
            category="daily_allowance",
            description="Daily allowance claimed",
            metadata={"source": "daily_allowance"},
            balance_after=wallet.balance,
        )
    return await get_finance_summary(session, user_id)


async def donate_coins(session: AsyncSession, user_id: UUID | str, payload: DonationRequest) -> FinanceSummary:
    if payload.amount < DONATION_MIN_AMOUNT:
        raise InvalidDonationError("Donation amount must be at least 1 coin.")

    wallet = await _get_wallet(session, user_id)
    if str(wallet.user_id) == str(payload.recipient_id):
        raise InvalidDonationError("Cannot donate to yourself.")

    recipient_wallet = await _get_wallet(session, payload.recipient_id)

    async with session.begin_nested():
        if payload.amount > wallet.balance:
            raise InsufficientFundsError("Not enough coins to donate.")

        wallet.balance -= payload.amount
        wallet.lifetime_spent += payload.amount
        wallet.donation_total += payload.amount

        recipient_wallet.balance += payload.amount
        recipient_wallet.lifetime_earned += payload.amount

        donor_metadata = {
            "recipient_id": str(recipient_wallet.user_id),
            "message": payload.message,
        }
        recipient_metadata = {
            "donor_id": str(wallet.user_id),
            "message": payload.message,
        }

        await _record_transaction(
            session,
            wallet,
            amount=payload.amount,
            transaction_type="expense",
            category="donation_out",
            description=payload.message or "Coins donated",
            metadata=donor_metadata,
            balance_after=wallet.balance,
        )
        await _record_transaction(
            session,
            recipient_wallet,
            amount=payload.amount,
            transaction_type="income",
            category="donation_in",
            description=payload.message or "Coins received",
            metadata=recipient_metadata,
            balance_after=recipient_wallet.balance,
        )
    return await get_finance_summary(session, user_id)


async def create_goal(session: AsyncSession, user_id: UUID | str, payload: GoalCreateRequest) -> FinanceSummary:
    wallet = await _get_wallet(session, user_id)
    async with session.begin_nested():
        goal = Goal(
            wallet_id=wallet.id,
            user_id=wallet.user_id,
            name=payload.name,
            target_amount=payload.target_amount,
            deadline=payload.deadline,
        )
        session.add(goal)
        await session.flush()
        if wallet.active_goal_id is None:
            wallet.active_goal_id = goal.id
    return await get_finance_summary(session, user_id)


async def contribute_to_goal(
    session: AsyncSession,
    user_id: UUID | str,
    goal_id: UUID | str,
    payload: GoalContributionRequest,
) -> FinanceSummary:
    wallet = await _get_wallet(session, user_id)
    goal = await _get_goal(session, wallet, goal_id)

    async with session.begin_nested():
        if payload.amount > wallet.balance:
            raise InsufficientFundsError("Not enough coins to contribute to the goal.")

        wallet.balance -= payload.amount
        wallet.lifetime_spent += payload.amount
        goal.current_amount += payload.amount

        if goal.current_amount >= goal.target_amount and goal.status != "completed":
            goal.status = "completed"
            goal.completed_at = datetime.now(tz=timezone.utc)
            if wallet.active_goal_id == goal.id:
                wallet.active_goal_id = None

        await _record_transaction(
            session,
            wallet,
            amount=payload.amount,
            transaction_type="expense",
            category="goal_contribution",
            description=f"Contribution to goal '{goal.name}'",
            metadata={"goal_id": str(goal.id)},
            balance_after=wallet.balance,
            related_goal_id=goal.id,
        )
    return await get_finance_summary(session, user_id)


async def list_goals(session: AsyncSession, user_id: UUID | str) -> list[GoalSummary]:
    wallet = await _get_wallet(session, user_id)
    return await _serialize_goals(session, wallet)


async def get_finance_response(session: AsyncSession, user_id: UUID | str) -> FinanceResponse:
    summary = await get_finance_summary(session, user_id)
    return FinanceResponse(summary=summary)


async def get_leaderboard_summary(session: AsyncSession, metric: str = "balance") -> list[LeaderboardEntry]:
    return await _leaderboard(session, metric=metric)

