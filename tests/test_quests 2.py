"""
Integration tests for quest endpoints.
"""

from __future__ import annotations

from datetime import date
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.finance import Transaction, Wallet
from app.models.pet import Pet, SpeciesEnum
from app.models.quest import Quest, QuestDifficulty, QuestType, UserQuest
from app.models.social import PublicProfile
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_active_quests_listing(client: AsyncClient, db_session: AsyncSession):
    """
    Ensure active quests are returned and user quest rows are initialised.
    """

    user = User(email=f"quester-{uuid.uuid4()}@example.com", password_hash=hash_password("QuestPass1!"))
    db_session.add(user)
    await db_session.flush()

    quest = Quest(
        quest_key="daily_feed_pet",
        description="Feed your pet a premium meal.",
        quest_type=QuestType.DAILY,
        difficulty=QuestDifficulty.EASY,
        rewards={"coins": 25, "xp": 15},
        target_value=1,
    )
    db_session.add(quest)
    await db_session.commit()

    response = await client.get("/api/quests", headers=auth_headers(user.id))
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["daily"], "Expected at least one daily quest"
    quest_entry = payload["daily"][0]
    assert quest_entry["quest_key"] == "daily_feed_pet"
    assert quest_entry["status"] == "pending"

    await db_session.execute(delete(UserQuest).where(UserQuest.user_id == user.id))
    await db_session.execute(delete(Quest).where(Quest.id == quest.id))
    await db_session.execute(delete(Transaction).where(Transaction.user_id == user.id))
    await db_session.execute(delete(Wallet).where(Wallet.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


@pytest.mark.asyncio
async def test_complete_quest_awards_rewards(client: AsyncClient, db_session: AsyncSession):
    """
    Completing a quest updates quest status, awards coins, and increments profile XP.
    """

    user = User(email=f"hero-{uuid.uuid4()}@example.com", password_hash=hash_password("HeroicPass1!"))
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        user_id=user.id,
        name="Bolt",
        species=SpeciesEnum.DOG,
        breed="Beagle",
        color_pattern="Sunset",
        birthday=date(2022, 2, 14),
        hunger=60,
        happiness=55,
        cleanliness=70,
        energy=65,
        health=80,
        diary=[],
    )
    db_session.add(pet)
    await db_session.flush()

    profile = PublicProfile(
        user_id=user.id,
        pet_id=pet.id,
        display_name="Hero & Bolt",
        bio="Dynamic quest duo.",
        achievements=[],
        total_xp=100,
        total_coins=500,
    )
    db_session.add(profile)
    await db_session.flush()

    quest = Quest(
        quest_key="weekly_marathon",
        description="Complete three play sessions.",
        quest_type=QuestType.WEEKLY,
        difficulty=QuestDifficulty.NORMAL,
        rewards={"coins": 120, "xp": 60},
        target_value=3,
    )
    db_session.add(quest)
    await db_session.commit()

    complete_response = await client.post(
        "/api/quests/complete",
        json={"quest_id": str(quest.id)},
        headers=auth_headers(user.id),
    )
    assert complete_response.status_code == 200, complete_response.text
    completion = complete_response.json()["result"]
    assert completion["coins_awarded"] == 120
    assert completion["xp_awarded"] == 60
    assert completion["new_balance"] == 120  # wallet starts at 0
    assert completion["total_xp"] == 160

    # Double completion should be rejected.
    duplicate = await client.post(
        "/api/quests/complete",
        json={"quest_id": str(quest.id)},
        headers=auth_headers(user.id),
    )
    assert duplicate.status_code == 409

    await db_session.execute(delete(UserQuest).where(UserQuest.user_id == user.id))
    await db_session.execute(delete(PublicProfile).where(PublicProfile.user_id == user.id))
    await db_session.execute(delete(Pet).where(Pet.user_id == user.id))
    await db_session.execute(delete(Quest).where(Quest.id == quest.id))
    await db_session.execute(delete(Transaction).where(Transaction.user_id == user.id))
    await db_session.execute(delete(Wallet).where(Wallet.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()


