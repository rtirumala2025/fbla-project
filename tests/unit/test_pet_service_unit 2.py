"\"\"\"Unit tests for pet service helper behavior.\"\"\""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.models.pet import Pet, SpeciesEnum
from app.schemas.pet import PetStats
from app.services import pet_service


def _pet_with_stats(**overrides) -> Pet:
    now = datetime.now(tz=timezone.utc)
    pet = Pet(
        id=uuid4(),
        user_id=uuid4(),
        name="Nova",
        species=SpeciesEnum.CAT,
        breed="Siamese",
        color_pattern="Starlight",
        birthday=now.date(),
        hunger=overrides.get("hunger", 50),
        happiness=overrides.get("happiness", 50),
        cleanliness=overrides.get("cleanliness", 50),
        energy=overrides.get("energy", 50),
        health=overrides.get("health", 50),
    )
    pet.diary = overrides.get("diary", [])
    pet.created_at = overrides.get("created_at", now - timedelta(hours=4))
    pet.updated_at = overrides.get("updated_at", now - timedelta(hours=4))
    pet.mood = overrides.get("mood", "happy")
    return pet


def test_clamp_respects_bounds():
    assert pet_service._clamp(120) == 100
    assert pet_service._clamp(-10) == 0
    assert pet_service._clamp(42) == 42
    assert pet_service._clamp(42, minimum=10, maximum=40) == 40


def test_log_diary_entry_trims_history():
    pet = _pet_with_stats(diary=[{"action": f"action-{i}"} for i in range(25)])
    pet_service._log_diary_entry(pet, "feed", "Fed premium meal.", {"hunger": 20})
    assert len(pet.diary) == 20
    assert pet.diary[-1]["action"] == "feed"
    assert "hunger" in pet.diary[-1]["delta"]


def test_build_stats_response_reflects_current_pet_state():
    pet = _pet_with_stats(hunger=80, happiness=70, cleanliness=65, energy=60, health=75, mood="tired")
    stats = pet_service._build_stats_response(pet)
    assert isinstance(stats, PetStats)
    assert stats.hunger == 80
    assert stats.mood == "tired"


@pytest.mark.asyncio
async def test_apply_time_decay_uses_adjusted_rates(monkeypatch: pytest.MonkeyPatch):
    pet = _pet_with_stats(hunger=90, happiness=90, cleanliness=90, energy=90, health=90)
    pet.updated_at = datetime.now(tz=timezone.utc) - timedelta(hours=1)

    async def fake_adjust(_pet, base_rates):
        assert base_rates["hunger"] > 0
        return {
            "hunger": base_rates["hunger"] * 1.0,
            "energy": base_rates["energy"] * 1.0,
            "cleanliness": base_rates["cleanliness"] * 1.5,
            "happiness": base_rates["happiness"] * 0.5,
            "health": base_rates["health"],
        }

    monkeypatch.setattr(pet_service.ai_service, "adjust_decay_rates", fake_adjust)

    await pet_service._apply_time_decay(pet)

    assert pet.hunger < 90
    assert pet.cleanliness < 90
    assert pet.happiness < 90
    assert pet.energy < 90
    assert pet.health < 90


class _DummySession:
    async def flush(self):
        return None

    async def refresh(self, _pet):
        return None


@pytest.mark.asyncio
async def test_feed_pet_updates_stats_and_reaction(monkeypatch: pytest.MonkeyPatch):
    pet = _pet_with_stats(hunger=40, happiness=50, cleanliness=60, energy=55, health=70)

    async def fake_fetch(_session, _user_id):
        return pet

    async def fake_adjust(_pet, base_rates):
        return base_rates

    monkeypatch.setattr(pet_service, "_fetch_pet", fake_fetch)
    monkeypatch.setattr(pet_service.ai_service, "adjust_decay_rates", fake_adjust)
    monkeypatch.setattr(
        pet_service.PetRead,
        "from_orm",
        classmethod(
            lambda cls, obj: SimpleNamespace(
                id=getattr(obj, "id", uuid4()),
                user_id=getattr(obj, "user_id", uuid4()),
                hunger=obj.hunger,
                happiness=obj.happiness,
                cleanliness=obj.cleanliness,
                energy=obj.energy,
                health=obj.health,
                mood=obj.mood,
                stats=pet_service._build_stats_response(obj),
                diary=obj.diary,
            )
        ),
    )
    monkeypatch.setattr(pet_service, "PetActionResponse", lambda pet, reaction: SimpleNamespace(pet=pet, reaction=reaction))

    response = await pet_service.feed_pet(_DummySession(), uuid4(), "premium")

    assert response.pet.hunger > 40
    assert "food" in response.reaction.lower()


@pytest.mark.asyncio
async def test_play_with_pet_consumes_energy(monkeypatch: pytest.MonkeyPatch):
    pet = _pet_with_stats(hunger=80, happiness=60, cleanliness=70, energy=80, health=75)

    async def fake_fetch(_session, _user_id):
        return pet

    async def fake_adjust(_pet, base_rates):
        return base_rates

    monkeypatch.setattr(pet_service, "_fetch_pet", fake_fetch)
    monkeypatch.setattr(pet_service.ai_service, "adjust_decay_rates", fake_adjust)
    monkeypatch.setattr(
        pet_service.PetRead,
        "from_orm",
        classmethod(
            lambda cls, obj: SimpleNamespace(
                id=getattr(obj, "id", uuid4()),
                user_id=getattr(obj, "user_id", uuid4()),
                hunger=obj.hunger,
                happiness=obj.happiness,
                cleanliness=obj.cleanliness,
                energy=obj.energy,
                health=obj.health,
                mood=obj.mood,
                stats=pet_service._build_stats_response(obj),
                diary=obj.diary,
            )
        ),
    )
    monkeypatch.setattr(pet_service, "PetActionResponse", lambda pet, reaction: SimpleNamespace(pet=pet, reaction=reaction))

    response = await pet_service.play_with_pet(_DummySession(), uuid4(), "fetch")
    assert response.pet.happiness > 60
    assert response.pet.energy < 80

