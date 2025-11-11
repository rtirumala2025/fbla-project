"""
Unit tests for the AI intelligence layer helpers.
"""

from __future__ import annotations

from datetime import date, datetime, timezone
import uuid

import pytest

from app.models.pet import Pet, SpeciesEnum
from app.services import ai_service


def _build_pet(
    *,
    hunger: int = 70,
    happiness: int = 70,
    cleanliness: int = 70,
    energy: int = 70,
    health: int = 80,
) -> Pet:
    pet = Pet(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        name="AI Tester",
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2021, 1, 1),
        hunger=hunger,
        happiness=happiness,
        cleanliness=cleanliness,
        energy=energy,
        health=health,
    )
    current_time = datetime.now(tz=timezone.utc)
    pet.created_at = current_time
    pet.updated_at = current_time
    pet.diary = []
    return pet


@pytest.mark.asyncio
async def test_compute_mood_happy():
    pet = _build_pet(hunger=90, happiness=95, cleanliness=85, energy=90, health=92)

    mood = await ai_service.compute_mood(pet)

    assert mood.key == "happy"
    assert mood.label == "Happy"
    assert mood.score > 80


@pytest.mark.asyncio
async def test_compute_mood_sick_due_to_low_health():
    pet = _build_pet(hunger=90, happiness=50, cleanliness=60, energy=50, health=20)

    mood = await ai_service.compute_mood(pet)

    assert mood.key == "sick"
    assert mood.label == "Sick"


@pytest.mark.asyncio
async def test_personality_profile_is_deterministic():
    pet = _build_pet()

    profile_one = await ai_service.get_personality_profile(pet)
    profile_two = await ai_service.get_personality_profile(pet)

    assert profile_one.traits == profile_two.traits
    assert profile_one.modifiers == profile_two.modifiers
    assert profile_one.summary == profile_two.summary


@pytest.mark.asyncio
async def test_parse_natural_language_command_stub():
    command = "feed my cat tuna please"

    result = await ai_service.parse_natural_language_command(command)

    assert result.action == "feed"
    assert result.parameters.get("food_type") in {"tuna", "treat", "standard"}
    assert 0 <= result.confidence <= 1
    assert "Heuristic" in result.note or "Unable" in result.note

