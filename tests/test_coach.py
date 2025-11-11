"""
Integration tests for AI coach endpoint.
"""

from __future__ import annotations

from datetime import date
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet, SpeciesEnum
from app.models.quest import Quest, QuestDifficulty, QuestStatus, QuestType, UserQuest
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_coach_heuristic_response(client: AsyncClient, db_session: AsyncSession, monkeypatch: pytest.MonkeyPatch):
    """
    Ensure the AI coach returns heuristic guidance when no external LLM is configured.
    """

    monkeypatch.delenv("AI_COACH_ENDPOINT", raising=False)

    user = User(email=f"coach-{uuid.uuid4()}@example.com", password_hash=hash_password("CoachPass1!"))
    db_session.add(user)
    await db_session.flush()

    pet = Pet(
        user_id=user.id,
        name="Nova",
        species=SpeciesEnum.CAT,
        breed="Siamese",
        color_pattern="Midnight",
        birthday=date(2021, 12, 25),
        hunger=40,
        happiness=35,
        cleanliness=70,
        energy=30,
        health=85,
        diary=[],
    )
    db_session.add(pet)
    await db_session.flush()

    quest = Quest(
        quest_key="daily_playtime",
        description="Play with your pet for 10 minutes.",
        quest_type=QuestType.DAILY,
        difficulty=QuestDifficulty.NORMAL,
        rewards={"coins": 20, "xp": 15},
        target_value=1,
    )
    db_session.add(quest)
    await db_session.flush()

    progress = UserQuest(
        user_id=user.id,
        quest_id=quest.id,
        status=QuestStatus.IN_PROGRESS,
        progress=0,
        target_value=1,
    )
    db_session.add(progress)
    await db_session.commit()

    response = await client.get("/api/coach", headers=auth_headers(user.id))
    assert response.status_code == 200, response.text
    payload = response.json()
    assert payload["source"] == "heuristic"
    assert payload["difficulty_hint"] in {"easy", "normal", "hard", "heroic"}
    assert payload["suggestions"], "Expected at least one suggestion from coach"

    await db_session.execute(delete(UserQuest).where(UserQuest.user_id == user.id))
    await db_session.execute(delete(Quest).where(Quest.id == quest.id))
    await db_session.execute(delete(Pet).where(Pet.user_id == user.id))
    await db_session.execute(delete(User).where(User.id == user.id))
    await db_session.commit()

