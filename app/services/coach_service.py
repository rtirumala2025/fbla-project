"""
AI Coach service that synthesises pet stats, quest state, and engagement signals.
"""

from __future__ import annotations

from statistics import mean
from typing import Any, Dict, List, Optional
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.quest import QuestDifficulty, QuestStatus
from app.schemas.quest import CoachAdviceResponse, CoachInsight
from app.services.pet_service import PetNotFoundError, get_pet_by_user
from app.services.quest_service import get_active_quests


def _determine_difficulty(stats: Dict[str, int]) -> QuestDifficulty:
    tracked = [stats.get(key, 0) for key in ("happiness", "energy", "health")]
    if not tracked:
        return QuestDifficulty.NORMAL
    average = mean(tracked)
    if average >= 80:
        return QuestDifficulty.HEROIC
    if average >= 60:
        return QuestDifficulty.HARD
    if average >= 40:
        return QuestDifficulty.NORMAL
    return QuestDifficulty.EASY


def _build_heuristic_response(
    pet: Optional[Any],
    difficulty: QuestDifficulty,
    active_quest_count: int,
    pending_quests: int,
) -> CoachAdviceResponse:
    stats = getattr(pet, "stats", None)
    energy = stats.energy if stats else None
    happiness = stats.happiness if stats else None
    health = stats.health if stats else None

    suggestions: List[CoachInsight] = []

    if happiness is not None and happiness < 50:
        suggestions.append(
            CoachInsight(
                category="care",
                recommendation="Your pet could use some play time—launch a quick mini-game to boost happiness.",
            )
        )
    if energy is not None and energy < 40:
        suggestions.append(
            CoachInsight(
                category="care",
                recommendation="Energy levels are fading. Schedule a rest session or feed a premium meal.",
            )
        )
    if active_quest_count > 0:
        if pending_quests > 0:
            suggestions.append(
                CoachInsight(
                    category="quest",
                    recommendation=f"You have {pending_quests} quest(s) waiting. Tackle one now to secure bonus rewards.",
                )
            )
        else:
            suggestions.append(
                CoachInsight(
                    category="quest",
                    recommendation="Great job staying on top of quests! Try a harder quest for even bigger rewards.",
                )
            )

    difficulty_note = {
        QuestDifficulty.EASY: "Scale back to easy difficulty while you rebuild routines.",
        QuestDifficulty.NORMAL: "Stay at normal difficulty for a balanced challenge.",
        QuestDifficulty.HARD: "Consider bumping quests to hard mode for richer rewards.",
        QuestDifficulty.HEROIC: "Heroic difficulty unlocked—chain quests for legendary gear!",
    }[difficulty]
    suggestions.append(
        CoachInsight(category="difficulty", recommendation=difficulty_note)
    )

    if health is not None and health >= 80:
        suggestions.append(
            CoachInsight(
                category="motivation",
                recommendation="Health looks great! Keep momentum by linking a rest action after each quest.",
            )
        )

    summary = "I'm tracking your pet's wellbeing and quests to keep motivation high."
    if happiness and happiness < 40:
        summary = "Your pet needs a morale boost; let's prioritise playful quests today."
    elif energy and energy < 40:
        summary = "Energy is low. We'll mix lighter quests with restorative actions."
    elif pending_quests == 0:
        summary = "All quests are complete—time to push into advanced challenges!"

    return CoachAdviceResponse(
        mood=getattr(stats, "mood", None) if stats else None,
        difficulty_hint=difficulty,
        summary=summary,
        suggestions=suggestions,
        generated_at=_now_aware(),
        source="heuristic",
    )


def _now_aware():
    from datetime import datetime, timezone

    return datetime.now(tz=timezone.utc)


async def _call_llm(endpoint: str, payload: dict) -> Optional[CoachAdviceResponse]:
    try:
        async with httpx.AsyncClient(timeout=6) as client:
            response = await client.post(endpoint, json=payload)
            response.raise_for_status()
            data = response.json()
    except (httpx.HTTPError, ValueError):
        return None

    summary = data.get("summary") or data.get("message")
    suggestions_raw = data.get("suggestions") or []

    suggestions = [
        CoachInsight(category=item.get("category", "motivation"), recommendation=item.get("recommendation", "Keep going!"))
        for item in suggestions_raw
    ]

    difficulty_str = (data.get("difficulty_hint") or "normal").lower()
    try:
        difficulty = QuestDifficulty(difficulty_str)
    except ValueError:
        difficulty = QuestDifficulty.NORMAL

    return CoachAdviceResponse(
        mood=data.get("mood"),
        difficulty_hint=difficulty,
        summary=summary or "Stay focused and keep leveling up.",
        suggestions=suggestions,
        generated_at=_now_aware(),
        source="llm",
    )


async def generate_coach_advice(session: AsyncSession, user_id: UUID | str) -> CoachAdviceResponse:
    """
    Create AI coach guidance, optionally delegating to an external LLM if configured.
    """

    user_uuid = UUID(str(user_id))
    settings = get_settings()

    pet = None
    try:
        pet = await get_pet_by_user(session, user_uuid)
    except PetNotFoundError:
        pet = None

    quest_response = await get_active_quests(session, user_uuid)
    quests = quest_response.daily + quest_response.weekly + quest_response.event
    pending = [quest for quest in quests if quest.status in {QuestStatus.PENDING, QuestStatus.IN_PROGRESS}]

    stats_payload = {}
    if pet and getattr(pet, "stats", None):
        stats_payload = {
            "happiness": pet.stats.happiness,
            "energy": pet.stats.energy,
            "health": pet.stats.health,
            "mood": pet.stats.mood,
        }

    difficulty = _determine_difficulty(stats_payload or {})

    endpoint = settings.ai_coach_endpoint
    if endpoint:
        llm_payload = {
            "pet": {
                "name": getattr(pet, "name", None),
                "species": getattr(pet, "species", None),
                "stats": stats_payload,
            },
            "quests": [
                {
                    "id": str(quest.id),
                    "difficulty": quest.difficulty.value,
                    "status": quest.status.value,
                    "type": quest.quest_type.value,
                }
                for quest in quests
            ],
            "suggested_difficulty": difficulty.value,
        }
        llm_response = await _call_llm(str(endpoint), llm_payload)
        if llm_response:
            return llm_response

    return _build_heuristic_response(pet, difficulty, len(quests), len(pending))


