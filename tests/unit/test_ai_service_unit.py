"\"\"\"Additional unit tests for the AI service helpers.\"\"\""

from __future__ import annotations

from datetime import date, datetime, timezone
from uuid import uuid4

import pytest

from app.models.pet import Pet, SpeciesEnum
from app.services import ai_service


def _make_pet(**overrides) -> Pet:
    pet = Pet(
        id=overrides.get("id", uuid4()),
        user_id=uuid4(),
        name=overrides.get("name", "Buddy"),
        species=SpeciesEnum.DOG,
        breed="Labrador",
        color_pattern="Golden",
        birthday=date(2021, 1, 1),
        hunger=overrides.get("hunger", 60),
        happiness=overrides.get("happiness", 60),
        cleanliness=overrides.get("cleanliness", 60),
        energy=overrides.get("energy", 60),
        health=overrides.get("health", 80),
    )
    now = datetime.now(tz=timezone.utc)
    pet.created_at = overrides.get("created_at", now)
    pet.updated_at = overrides.get("updated_at", now)
    pet.diary = overrides.get("diary", [])
    pet.mood = overrides.get("mood", "happy")
    return pet


@pytest.mark.asyncio
async def test_adjust_decay_rates_respects_personality(monkeypatch: pytest.MonkeyPatch):
    pet = _make_pet()

    async def fake_profile(_: Pet):
        return ai_service.PersonalityProfile(
            traits=["playful"],
            summary="Energetic and playful.",
            modifiers={
                "hunger_decay": 1.2,
                "energy_decay": 0.8,
                "cleanliness_decay": 1.1,
                "happiness_gain": 1.4,
                "health_regen": 1.1,
            },
        )

    monkeypatch.setattr(ai_service, "get_personality_profile", fake_profile)

    base = {"hunger": 10.0, "energy": 10.0, "cleanliness": 10.0, "happiness": 10.0, "health": 10.0}
    adjusted = await ai_service.adjust_decay_rates(pet, base)

    assert adjusted["hunger"] == pytest.approx(12.0)
    assert adjusted["energy"] == pytest.approx(8.0)
    assert adjusted["cleanliness"] == pytest.approx(11.0)
    assert adjusted["happiness"] == pytest.approx(10.0 / 1.4)
    assert adjusted["health"] == pytest.approx(10.0 / 1.1)


@pytest.mark.asyncio
async def test_generate_help_suggestions_handles_low_stats():
    pet = _make_pet(hunger=30, energy=20, cleanliness=35, happiness=40, health=25)
    suggestions = await ai_service.generate_help_suggestions(pet)
    assert "meal" in suggestions[0].lower()
    assert any("rest" in tip.lower() for tip in suggestions)
    assert any("bath" in tip.lower() for tip in suggestions)
    assert any("health" in tip.lower() for tip in suggestions)


@pytest.mark.asyncio
async def test_recommended_actions_defaults_when_unknown():
    mood = ai_service.MoodAnalysis(key="unknown", label="Unknown", score=50)
    actions = await ai_service.recommended_actions(mood)
    assert actions == ["Spend time together to assess needs."]


@pytest.mark.asyncio
async def test_generate_notifications_returns_positive_message_when_stats_good():
    pet = _make_pet(hunger=90, energy=90, cleanliness=90, happiness=90, health=90, name="Nova")
    notes = await ai_service.generate_notifications(pet)
    assert len(notes) == 1
    assert notes[0]["severity"] == "info"
    assert "Nova" in notes[0]["message"]


@pytest.mark.asyncio
async def test_predict_health_risks_identifies_high_risk():
    pet = _make_pet(hunger=20, energy=20, cleanliness=15, health=10, happiness=50)
    forecast = await ai_service.predict_health_risks(pet)
    assert forecast.risk_level == "high"
    assert any("health is already low" in note.lower() for note in forecast.contributing_factors)


@pytest.mark.asyncio
async def test_analyze_care_style_derives_balanced_from_diverse_diary():
    diary = [
        {"action": "feed"},
        {"action": "play"},
        {"action": "rest"},
        {"action": "bathe"},
        {"action": "play"},
    ]
    pet = _make_pet(diary=diary)
    style = await ai_service.analyze_care_style(pet)
    assert style == "balanced"


@pytest.mark.asyncio
async def test_recommend_minigame_difficulty_scales_with_stats():
    pet_high = _make_pet(hunger=95, happiness=94, cleanliness=92, energy=90, health=95)
    pet_mid = _make_pet(hunger=70, happiness=65, cleanliness=68, energy=70, health=72)
    pet_low = _make_pet(hunger=40, happiness=42, cleanliness=45, energy=38, health=39)

    result_high = await ai_service.recommend_minigame_difficulty(pet_high)
    result_mid = await ai_service.recommend_minigame_difficulty(pet_mid)
    result_low = await ai_service.recommend_minigame_difficulty(pet_low)

    assert result_high == "advanced"
    assert result_mid == "standard"
    assert result_low == "gentle"


@pytest.mark.asyncio
async def test_compute_mood_handles_thresholds():
    happy_pet = _make_pet(hunger=90, happiness=95, cleanliness=80, energy=85, health=90)
    hungry_pet = _make_pet(hunger=20, happiness=60, cleanliness=70, energy=70, health=80)
    tired_pet = _make_pet(hunger=60, happiness=60, cleanliness=70, energy=20, health=70)
    sick_pet = _make_pet(hunger=70, happiness=60, cleanliness=70, energy=70, health=20)

    assert (await ai_service.compute_mood(happy_pet)).key == "happy"
    assert (await ai_service.compute_mood(hungry_pet)).key == "hungry"
    assert (await ai_service.compute_mood(tired_pet)).key == "tired"
    assert (await ai_service.compute_mood(sick_pet)).key == "sick"


@pytest.mark.asyncio
async def test_get_personality_profile_deterministic():
    pet = _make_pet(id=uuid4())
    profile_one = await ai_service.get_personality_profile(pet)
    profile_two = await ai_service.get_personality_profile(pet)
    assert profile_one.traits == profile_two.traits
    assert profile_one.summary == profile_two.summary


@pytest.mark.asyncio
async def test_generate_reaction_uses_personality(monkeypatch: pytest.MonkeyPatch):
    pet = _make_pet()
    mood = ai_service.MoodAnalysis(key="happy", label="Happy", score=90)

    async def fake_profile(_: Pet):
        return ai_service.PersonalityProfile(
            traits=["playful"],
            summary="Playful companion.",
            modifiers={
                "hunger_decay": 1.0,
                "energy_decay": 1.0,
                "cleanliness_decay": 1.0,
                "happiness_gain": 1.0,
                "health_regen": 1.0,
            },
        )

    monkeypatch.setattr(ai_service, "get_personality_profile", fake_profile)

    reaction = await ai_service.generate_reaction(pet, "play", mood)
    assert "again soon" in reaction


@pytest.mark.asyncio
async def test_parse_natural_language_command_identifies_actions():
    feed = await ai_service.parse_natural_language_command("Please feed my pet some tuna")
    play = await ai_service.parse_natural_language_command("Let's play fetch outside")
    rest = await ai_service.parse_natural_language_command("time for a long rest")
    unknown = await ai_service.parse_natural_language_command("say hello")

    assert feed.action == "feed" and feed.parameters["food_type"] == "tuna"
    assert play.action == "play" and play.parameters["game_type"] == "fetch"
    assert rest.action == "rest" and rest.parameters["duration_hours"] == "8"
    assert unknown.action is None


@pytest.mark.asyncio
async def test_build_ai_overview_compiles_metrics():
    diary = [{"action": "feed"}, {"action": "play"}, {"action": "rest"}]
    pet = _make_pet(hunger=60, happiness=70, cleanliness=65, energy=55, health=80, diary=diary)
    overview = await ai_service.build_ai_overview(pet)

    assert overview["mood"] in ai_service.MOOD_ORDER
    assert overview["personality_traits"]
    assert "help_suggestions" in overview
    assert "recommended_actions" in overview

