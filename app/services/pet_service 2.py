"""
Service layer for pet customization and care interactions.
"""

from __future__ import annotations

from datetime import datetime, timezone
from functools import lru_cache
from typing import Any, Dict
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pet import BREED_OPTIONS, Pet, SpeciesEnum
from app.schemas.pet import (
    PetActionResponse,
    PetCreate,
    PetDiaryEntry,
    PetHealthSummary,
    PetRead,
    PetStats,
    PetUpdate,
)
from app.services import ai_service


class PetAlreadyExistsError(ValueError):
    """Raised when attempting to create a second pet for the same user."""


class PetNotFoundError(ValueError):
    """Raised when a pet is requested but does not exist."""


def _ensure_pet_defaults(pet: Pet) -> None:
    """Populate runtime defaults for stats when server defaults are unavailable."""

    if pet.hunger is None:
        pet.hunger = 70
    if pet.happiness is None:
        pet.happiness = 70
    if pet.cleanliness is None:
        pet.cleanliness = 70
    if pet.energy is None:
        pet.energy = 70
    if pet.health is None:
        pet.health = 80
    if pet.mood is None:
        pet.mood = "happy"
    if not pet.diary:
        pet.diary = []
    if not pet.traits:
        pet.traits = {}
    setattr(pet, "stats", _build_stats_response(pet))


def _serialize_pet(pet: Pet) -> PetRead:
    _ensure_pet_defaults(pet)
    stats = _build_stats_response(pet)
    diary = pet.diary or []
    traits = pet.traits or {}
    species_value = pet.species.value if isinstance(pet.species, SpeciesEnum) else pet.species
    return PetRead(
        id=pet.id,
        user_id=pet.user_id,
        name=pet.name,
        species=species_value,
        breed=pet.breed,
        color_pattern=pet.color_pattern,
        birthday=pet.birthday,
        hunger=pet.hunger,
        happiness=pet.happiness,
        cleanliness=pet.cleanliness,
        energy=pet.energy,
        health=pet.health,
        mood=pet.mood,
        last_fed=pet.last_fed,
        last_played=pet.last_played,
        last_bathed=pet.last_bathed,
        last_slept=pet.last_slept,
        stats=stats,
        created_at=pet.created_at,
        updated_at=pet.updated_at,
        diary=[PetDiaryEntry(**entry) if isinstance(entry, dict) else entry for entry in diary],
        traits=traits,
    )


def _clamp(value: int, minimum: int = 0, maximum: int = 100) -> int:
    return max(minimum, min(maximum, value))


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _log_diary_entry(pet: Pet, action: str, description: str, delta: Dict[str, int]) -> None:
    entry = {
        "timestamp": _now().isoformat(),
        "action": action,
        "description": description,
        "delta": delta,
    }
    diary = pet.diary or []
    diary.append(entry)
    pet.diary = diary[-20:]  # keep latest 20 entries to avoid unbounded growth


def _build_stats_response(pet: Pet) -> PetStats:
    return PetStats(
        hunger=pet.hunger,
        happiness=pet.happiness,
        cleanliness=pet.cleanliness,
        energy=pet.energy,
        health=pet.health,
        mood=pet.mood,
    )


MOOD_ORDER = ("happy", "content", "tired", "hungry", "sad", "sick")

_REACTION_LIBRARY: Dict[str, Dict[str, str]] = {
    "feed": {
        "happy": "That meal hit the spot! I'm ready for more adventures.",
        "content": "Yum! Thanks for keeping me full.",
        "tired": "A quiet snack helps me recharge.",
        "hungry": "Finally! I've been dreaming about this treat.",
        "sad": "Food always makes the day feel better.",
        "sick": "I'll nibble slowly, but I'm grateful you care.",
    },
    "play": {
        "happy": "Best. Game. Ever! Let's go again!",
        "content": "That was fun—thanks for playing!",
        "tired": "Whew, I'm exhausted but smiling.",
        "hungry": "So much fun! Maybe a snack next?",
        "sad": "Playing with you always cheers me up.",
        "sick": "I'll take it easy, but that was enjoyable.",
    },
    "bathe": {
        "happy": "Sparkly clean and feeling fabulous!",
        "content": "Nothing like a fresh bath.",
        "tired": "Warm water helps me unwind.",
        "hungry": "Bath time finished—snack soon?",
        "sad": "Feeling clean makes everything brighter.",
        "sick": "Thanks for keeping me comfy while I recover.",
    },
    "rest": {
        "happy": "That nap was perfect! I'm energized.",
        "content": "A cozy rest was just what I needed.",
        "tired": "Zzz... exactly what I needed.",
        "hungry": "I'll fuel up after this relaxing break.",
        "sad": "Quiet time with you helps a lot.",
        "sick": "Resting up so I can bounce back soon.",
    },
}


@lru_cache(maxsize=128)
def _generate_ai_reaction(action: str, mood: str) -> str:
    """
    Deterministic AI-flavoured reaction strings with lightweight caching.

    The cache avoids recomputing string concatenation for repeated combinations
    during high-frequency interactions (for example, rapid feed/play loops).
    """

    normalized_action = action.lower()
    normalized_mood = mood.lower()
    fallback = "seems appreciative of your care!"
    action_map = _REACTION_LIBRARY.get(normalized_action)
    if not action_map:
        return fallback
    return action_map.get(normalized_mood, fallback)


def _calculate_mood(pet: Pet) -> str:
    """
    Compute a coarse mood label from the pet's current vitals.

    Mirrors the asynchronous `ai_service.compute_mood` helper but inlined here
    to keep synchronous updates fast and avoid unnecessary event-loop hops.
    """

    if pet.health < 30:
        return "sick"
    if pet.hunger < 30:
        return "hungry"
    if pet.energy < 30:
        return "tired"

    score = (
        pet.happiness * 0.4
        + pet.health * 0.25
        + pet.energy * 0.15
        + pet.cleanliness * 0.1
        + pet.hunger * 0.1
    )

    if score >= 70:
        return "happy"
    if score >= 55:
        return "content"
    if score >= 40:
        return "sad"
    return "sick"


async def _fetch_pet(session: AsyncSession, user_id: UUID | str) -> Pet:
    if isinstance(user_id, str):
        user_id = UUID(user_id)
    result = await session.execute(select(Pet).where(Pet.user_id == user_id))
    pet = result.scalar_one_or_none()
    if pet is None:
        raise PetNotFoundError("Pet not found.")
    return pet


async def create_pet(session: AsyncSession, user_id: UUID | str, payload: PetCreate) -> PetRead:
    if isinstance(user_id, str):
        user_id = UUID(user_id)

    existing = await session.execute(select(Pet).where(Pet.user_id == user_id))
    if existing.scalar_one_or_none() is not None:
        raise PetAlreadyExistsError("Pet already exists for this user.")

    species_value = payload.species.value if isinstance(payload.species, SpeciesEnum) else payload.species

    pet = Pet(
        user_id=user_id,
        name=payload.name,
        species=species_value,
        breed=payload.breed,
        color_pattern=payload.color_pattern,
        birthday=payload.birthday,
    )
    _ensure_pet_defaults(pet)
    mood = await ai_service.compute_mood(pet)
    pet.mood = mood.key
    session.add(pet)
    try:
        await session.flush()
    except IntegrityError as exc:
        await session.rollback()
        raise exc

    await session.refresh(pet)
    return _serialize_pet(pet)


async def get_pet_by_user(session: AsyncSession, user_id: UUID | str) -> PetRead | None:
    try:
        pet = await _fetch_pet(session, user_id)
    except PetNotFoundError:
        return None
    return _serialize_pet(pet)


async def update_pet(session: AsyncSession, user_id: UUID | str, payload: PetUpdate) -> PetRead:
    pet = await _fetch_pet(session, user_id)

    data = payload.dict()
    if payload.species and "breed" not in data:
        allowed = BREED_OPTIONS.get(payload.species, [])
        data["breed"] = allowed[0] if allowed else pet.breed

    for field, value in data.items():
        setattr(pet, field, value)
    if payload.species is not None:
        pet.species = payload.species.value if isinstance(payload.species, SpeciesEnum) else payload.species

    _ensure_pet_defaults(pet)
    mood = await ai_service.compute_mood(pet)
    pet.mood = mood.key
    await session.flush()
    await session.refresh(pet)
    return _serialize_pet(pet)


async def _apply_time_decay(pet: Pet) -> None:
    """
    Apply passive stat decay based on elapsed time since the last update.

    The decay formula is intentionally simple for now:
    - Hunger decreases by 4 points per hour.
    - Energy, cleanliness, and happiness decrease by 2 points per hour.
    - Health decreases by 1 point per hour.

    These rates provide noticeable drift during idle periods without making the
    pet unmanageable. Future iterations can plug in personalization or machine
    learned adjustments by replacing this helper.
    """

    reference = pet.updated_at or pet.created_at or _now()
    elapsed = _now() - reference
    hours = max(0.0, elapsed.total_seconds() / 3600)

    if hours < 0.25:  # ignore tiny intervals to reduce churn
        return

    base_rates = {
        "hunger": hours * 4,
        "energy": hours * 2,
        "cleanliness": hours * 2,
        "happiness": hours * 2,
        "health": hours * 1,
    }
    adjusted = await ai_service.adjust_decay_rates(pet, base_rates)

    hunger_decay = int(adjusted["hunger"])
    energy_decay = int(adjusted["energy"])
    cleanliness_decay = int(adjusted["cleanliness"])
    happiness_decay = int(adjusted["happiness"])
    health_decay = int(adjusted["health"])

    if all(value == 0 for value in (hunger_decay, energy_decay, cleanliness_decay, happiness_decay, health_decay)):
        return

    pet.hunger = _clamp(pet.hunger - hunger_decay)
    pet.energy = _clamp(pet.energy - energy_decay)
    pet.cleanliness = _clamp(pet.cleanliness - cleanliness_decay)
    pet.happiness = _clamp(pet.happiness - happiness_decay)
    pet.health = _clamp(pet.health - health_decay)


async def feed_pet(session: AsyncSession, user_id: UUID | str, food_type: str) -> PetActionResponse:
    pet = await _fetch_pet(session, user_id)
    await _apply_time_decay(pet)

    hunger_boost = 20 if food_type == "premium" else 12
    happiness_boost = 8 if food_type == "treat" else 4

    pet.hunger = _clamp(pet.hunger + hunger_boost)
    pet.happiness = _clamp(pet.happiness + happiness_boost)
    pet.health = _clamp(pet.health + 3)
    pet.last_fed = _now()

    pet.mood = _calculate_mood(pet)
    _log_diary_entry(pet, "feed", f"Gave pet a {food_type} meal.", {"hunger": hunger_boost, "happiness": happiness_boost, "health": 3})
    await session.flush()
    await session.refresh(pet)

    reaction = _generate_ai_reaction("feed", pet.mood)
    return PetActionResponse(pet=_serialize_pet(pet), reaction=reaction)


async def play_with_pet(session: AsyncSession, user_id: UUID | str, game_type: str) -> PetActionResponse:
    pet = await _fetch_pet(session, user_id)
    await _apply_time_decay(pet)

    happiness_boost = 18 if game_type == "fetch" else 12
    energy_cost = 10
    pet.happiness = _clamp(pet.happiness + happiness_boost)
    pet.energy = _clamp(pet.energy - energy_cost)
    pet.cleanliness = _clamp(pet.cleanliness - 5)
    pet.last_played = _now()

    pet.mood = _calculate_mood(pet)
    _log_diary_entry(pet, "play", f"Played {game_type} together.", {"happiness": happiness_boost, "energy": -energy_cost, "cleanliness": -5})
    await session.flush()
    await session.refresh(pet)

    reaction = _generate_ai_reaction("play", pet.mood)
    return PetActionResponse(pet=_serialize_pet(pet), reaction=reaction)


async def bathe_pet(session: AsyncSession, user_id: UUID | str) -> PetActionResponse:
    pet = await _fetch_pet(session, user_id)
    await _apply_time_decay(pet)

    cleanliness_boost = 25
    pet.cleanliness = _clamp(pet.cleanliness + cleanliness_boost)
    pet.happiness = _clamp(pet.happiness + 4)
    pet.health = _clamp(pet.health + 5)
    pet.last_bathed = _now()

    pet.mood = _calculate_mood(pet)
    _log_diary_entry(pet, "bathe", "Pet enjoyed a refreshing bath.", {"cleanliness": cleanliness_boost, "happiness": 4, "health": 5})
    await session.flush()
    await session.refresh(pet)

    reaction = _generate_ai_reaction("bathe", pet.mood)
    return PetActionResponse(pet=_serialize_pet(pet), reaction=reaction)


async def rest_pet(session: AsyncSession, user_id: UUID | str, duration_hours: int) -> PetActionResponse:
    pet = await _fetch_pet(session, user_id)
    await _apply_time_decay(pet)

    energy_boost = min(30, duration_hours * 5)
    health_boost = min(10, duration_hours * 2)
    pet.energy = _clamp(pet.energy + energy_boost)
    pet.health = _clamp(pet.health + health_boost)
    pet.happiness = _clamp(pet.happiness + 2)
    pet.last_slept = _now()

    pet.mood = _calculate_mood(pet)
    _log_diary_entry(
        pet,
        "rest",
        f"Rested for {duration_hours} hour(s).",
        {"energy": energy_boost, "health": health_boost, "happiness": 2},
    )
    await session.flush()
    await session.refresh(pet)

    reaction = _generate_ai_reaction("rest", pet.mood)
    return PetActionResponse(pet=_serialize_pet(pet), reaction=reaction)


async def check_health(session: AsyncSession, user_id: UUID | str) -> PetHealthSummary:
    pet = await _fetch_pet(session, user_id)
    await _apply_time_decay(pet)
    pet.mood = _calculate_mood(pet)
    await session.flush()
    await session.refresh(pet)
    # Placeholder AI summary; future tasks can integrate real AI predictions.
    summary = (
        f"{pet.name} is feeling {pet.mood}. Health at {pet.health}%, "
        f"hunger {pet.hunger}%, energy {pet.energy}%. Keep up the great care!"
    )
    return PetHealthSummary(summary=summary, mood=pet.mood)


async def get_pet_stats(session: AsyncSession, user_id: UUID | str) -> PetStats:
    pet = await _fetch_pet(session, user_id)
    await _apply_time_decay(pet)
    pet.mood = _calculate_mood(pet)
    await session.flush()
    await session.refresh(pet)
    return _build_stats_response(pet)


async def get_pet_diary(session: AsyncSession, user_id: UUID | str) -> list[PetDiaryEntry]:
    pet = await _fetch_pet(session, user_id)
    return [PetDiaryEntry(**entry) for entry in pet.diary or []]


async def _prepare_pet_for_ai(session: AsyncSession, user_id: UUID | str) -> tuple[Pet, ai_service.MoodAnalysis]:
    pet = await _fetch_pet(session, user_id)
    await _apply_time_decay(pet)
    mood = await ai_service.compute_mood(pet)
    pet.mood = mood.key
    await session.flush()
    await session.refresh(pet)
    return pet, mood


async def get_pet_ai_overview(session: AsyncSession, user_id: UUID | str) -> dict[str, Any]:
    pet, _ = await _prepare_pet_for_ai(session, user_id)
    return await ai_service.build_ai_overview(pet)


async def get_pet_ai_notifications(session: AsyncSession, user_id: UUID | str) -> list[dict[str, Any]]:
    pet, _ = await _prepare_pet_for_ai(session, user_id)
    return await ai_service.generate_notifications(pet)


async def get_pet_ai_help(session: AsyncSession, user_id: UUID | str) -> list[str]:
    pet, _ = await _prepare_pet_for_ai(session, user_id)
    return await ai_service.generate_help_suggestions(pet)
