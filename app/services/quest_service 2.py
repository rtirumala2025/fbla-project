"""
Quest service encapsulating quest retrieval, progress updates, and reward payouts.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timezone
from typing import Dict, Iterable
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.finance import Transaction, Wallet
from app.models.quest import Quest, QuestStatus, QuestType, UserQuest
from app.models.social import PublicProfile
from app.schemas.quest import ActiveQuestsResponse, QuestCompletionRequest, QuestCompletionResult, QuestRead, QuestReward


class QuestServiceError(RuntimeError):
    """Base exception raised for quest processing issues."""


class QuestNotFoundError(QuestServiceError):
    """Raised when a quest cannot be located or is inactive."""


class QuestAlreadyCompletedError(QuestServiceError):
    """Raised if the user attempts to claim a quest reward twice."""


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _deserialize_reward(raw: dict | None) -> QuestReward:
    raw = raw or {}
    return QuestReward(
        coins=int(raw.get("coins") or 0),
        xp=int(raw.get("xp") or 0),
        items=list(raw.get("items") or []),
    )


def _quest_to_read(quest: Quest, user_quest: UserQuest) -> QuestRead:
    return QuestRead(
        id=quest.id,
        quest_key=quest.quest_key,
        description=quest.description,
        quest_type=quest.quest_type,
        difficulty=quest.difficulty,
        rewards=_deserialize_reward(quest.rewards),
        target_value=quest.target_value,
        icon=quest.icon,
        start_at=quest.start_at,
        end_at=quest.end_at,
        progress=user_quest.progress,
        status=user_quest.status,
    )


async def _fetch_active_quests(session: AsyncSession) -> list[Quest]:
    now = _now()
    stmt = (
        select(Quest)
        .options(selectinload(Quest.user_quests))
        .where(
            or_(Quest.start_at.is_(None), Quest.start_at <= now),
            or_(Quest.end_at.is_(None), Quest.end_at >= now),
        )
        .order_by(Quest.difficulty, Quest.quest_key)
    )
    result = await session.execute(stmt)
    return list(result.scalars())


async def _get_user_quests_map(session: AsyncSession, user_id: UUID, quest_ids: Iterable[UUID]) -> Dict[UUID, UserQuest]:
    if not quest_ids:
        return {}
    stmt = select(UserQuest).where(UserQuest.user_id == user_id, UserQuest.quest_id.in_(list(quest_ids)))
    result = await session.execute(stmt)
    return {row.quest_id: row for row in result.scalars()}


async def get_active_quests(session: AsyncSession, user_id: UUID | str) -> ActiveQuestsResponse:
    """
    Fetch active quests for the user, ensuring progress rows exist.
    """

    user_uuid = UUID(str(user_id))
    quests = await _fetch_active_quests(session)
    quest_ids = [quest.id for quest in quests]
    user_map = await _get_user_quests_map(session, user_uuid, quest_ids)

    now = _now()
    for quest in quests:
        if quest.id in user_map:
            continue
        user_quest = UserQuest(
            user_id=user_uuid,
            quest_id=quest.id,
            status=QuestStatus.PENDING,
            progress=0,
            target_value=quest.target_value,
        )
        session.add(user_quest)
        user_map[quest.id] = user_quest
    await session.flush()

    buckets: dict[QuestType, list[QuestRead]] = defaultdict(list)
    for quest in quests:
        record = user_map[quest.id]
        if record.status == QuestStatus.PENDING and record.progress > 0:
            record.status = QuestStatus.IN_PROGRESS
        buckets[quest.quest_type].append(_quest_to_read(quest, record))

    return ActiveQuestsResponse(
        daily=buckets.get(QuestType.DAILY, []),
        weekly=buckets.get(QuestType.WEEKLY, []),
        event=buckets.get(QuestType.EVENT, []),
        refreshed_at=now,
    )


async def _get_or_create_wallet(session: AsyncSession, user_id: UUID) -> Wallet:
    stmt = select(Wallet).where(Wallet.user_id == user_id).with_for_update(of=Wallet)
    result = await session.execute(stmt)
    wallet = result.scalar_one_or_none()
    if wallet is None:
        wallet = Wallet(user_id=user_id)
        session.add(wallet)
        try:
            await session.flush()
        except IntegrityError:
            await session.rollback()
            result = await session.execute(stmt)
            wallet = result.scalar_one()
    return wallet


async def _apply_rewards(
    session: AsyncSession,
    user_id: UUID,
    quest: Quest,
    user_quest: UserQuest,
) -> QuestCompletionResult:
    rewards = _deserialize_reward(quest.rewards)
    coins_awarded = rewards.coins
    xp_awarded = rewards.xp

    new_balance: int | None = None
    total_xp: int | None = None

    if coins_awarded > 0:
        wallet = await _get_or_create_wallet(session, user_id)
        wallet.balance += coins_awarded
        wallet.lifetime_earned += coins_awarded
        transaction = Transaction(
            wallet_id=wallet.id,
            user_id=user_id,
            amount=coins_awarded,
            transaction_type="income",
            category="quest_reward",
            description=f"Reward for quest '{quest.quest_key}'",
            balance_after=wallet.balance,
            metadata={"quest_id": str(quest.id), "difficulty": quest.difficulty.value},
        )
        session.add(transaction)
        new_balance = wallet.balance

    if xp_awarded > 0:
        stmt = select(PublicProfile).where(PublicProfile.user_id == user_id).with_for_update(of=PublicProfile)
        result = await session.execute(stmt)
        profile = result.scalar_one_or_none()
        if profile:
            profile.total_xp += xp_awarded
            total_xp = profile.total_xp

    user_quest.status = QuestStatus.CLAIMED
    user_quest.completed_at = user_quest.completed_at or _now()
    user_quest.claimed_at = _now()
    await session.flush()

    return QuestCompletionResult(
        quest=_quest_to_read(quest, user_quest),
        coins_awarded=coins_awarded,
        xp_awarded=xp_awarded,
        new_balance=new_balance,
        total_xp=total_xp,
        message="Quest complete! Rewards applied successfully.",
    )


async def complete_quest(session: AsyncSession, user_id: UUID | str, payload: QuestCompletionRequest) -> QuestCompletionResult:
    """
    Mark a quest as complete for the user with transactional reward payout.
    """

    user_uuid = UUID(str(user_id))
    stmt = select(Quest).where(Quest.id == payload.quest_id)
    result = await session.execute(stmt)
    quest = result.scalar_one_or_none()
    if quest is None:
        raise QuestNotFoundError("Quest not found.")

    now = _now()
    if quest.start_at and quest.start_at > now:
        raise QuestNotFoundError("Quest is not yet active.")
    if quest.end_at and quest.end_at < now:
        raise QuestNotFoundError("Quest has expired.")

    uq_stmt = (
        select(UserQuest)
        .where(UserQuest.user_id == user_uuid, UserQuest.quest_id == quest.id)
        .with_for_update(of=UserQuest)
    )
    uq_result = await session.execute(uq_stmt)
    user_quest = uq_result.scalar_one_or_none()
    if user_quest is None:
        user_quest = UserQuest(
            user_id=user_uuid,
            quest_id=quest.id,
            status=QuestStatus.PENDING,
            progress=0,
            target_value=quest.target_value,
        )
        session.add(user_quest)
        await session.flush()

    if user_quest.status in {QuestStatus.COMPLETED, QuestStatus.CLAIMED}:
        raise QuestAlreadyCompletedError("Quest reward already claimed.")

    user_quest.target_value = quest.target_value
    user_quest.progress = max(user_quest.progress, user_quest.target_value)
    user_quest.status = QuestStatus.COMPLETED
    user_quest.completed_at = now
    user_quest.last_progress_at = now
    await session.flush()

    return await _apply_rewards(session, user_uuid, quest, user_quest)


