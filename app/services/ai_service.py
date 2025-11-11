"""
AI and intelligence utilities for the virtual pet experience.

The helpers in this module are intentionally lightweight, asynchronous stubs
that emulate the behavior of a future ML/LLM powered system. They centralize
logic for mood evaluation, personality traits, health forecasting, and natural
language command parsing so downstream services can remain decoupled from the
implementation details once real models are introduced.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from random import Random
from typing import Any, Mapping, MutableMapping

from app.models.pet import Pet

MOOD_ORDER = ["happy", "hungry", "tired", "sad", "sick"]
MOOD_LABELS = {
    "happy": "Happy",
    "hungry": "Hungry",
    "tired": "Tired",
    "sad": "Sad",
    "sick": "Sick",
}


@dataclass
class MoodAnalysis:
    """Container describing the computed mood for a pet."""

    key: str
    label: str
    score: float


@dataclass
class PersonalityProfile:
    """Represents a deterministic personality assignment for a pet."""

    traits: list[str]
    summary: str
    modifiers: dict[str, float]


@dataclass
class HealthForecast:
    """Predictive health evaluation for upcoming hours/days."""

    risk_level: str
    summary: str
    contributing_factors: list[str]


@dataclass
class ParsedCommand:
    """Stubbed result from natural language command parsing."""

    action: str | None
    parameters: dict[str, str]
    confidence: float
    note: str


PERSONALITY_LIBRARY: Mapping[str, Mapping[str, Any]] = {
    "playful": {
        "description": "Loves games and social interaction.",
        "modifiers": {"happiness_gain": 1.1, "energy_decay": 1.1},
    },
    "shy": {
        "description": "Prefers calm environments and gentle care.",
        "modifiers": {"happiness_gain": 0.95, "cleanliness_decay": 0.9},
    },
    "greedy": {
        "description": "Food motivated and always scouting for snacks.",
        "modifiers": {"hunger_decay": 1.25, "happiness_gain": 1.05},
    },
    "curious": {
        "description": "Explores frequently which can drain energy but lifts mood.",
        "modifiers": {"energy_decay": 1.15, "cleanliness_decay": 1.05, "happiness_gain": 1.08},
    },
    "loyal": {
        "description": "Form strong bonds with owners and recovers mood faster.",
        "modifiers": {"happiness_gain": 1.15, "health_regen": 1.05},
    },
    "mischievous": {
        "description": "Gets into trouble which can reduce cleanliness quickly.",
        "modifiers": {"cleanliness_decay": 1.25, "energy_decay": 1.05},
    },
    "gentle": {
        "description": "Balanced temperament with slower stat loss overall.",
        "modifiers": {"hunger_decay": 0.95, "energy_decay": 0.95, "cleanliness_decay": 0.95},
    },
}

COMMAND_KEYWORDS: Mapping[str, str] = {
    "feed": "feed",
    "treat": "feed",
    "food": "feed",
    "play": "play",
    "fetch": "play",
    "game": "play",
    "bath": "bathe",
    "clean": "bathe",
    "rest": "rest",
    "sleep": "rest",
    "nap": "rest",
}

RECOMMENDED_ACTIONS_BY_MOOD: Mapping[str, list[str]] = {
    "happy": ["Keep the routine consistent.", "Try a new mini-game to celebrate."],
    "hungry": ["Feed a hearty meal.", "Offer a premium treat to boost mood."],
    "tired": ["Schedule a longer rest period.", "Keep playtime light today."],
    "sad": ["Play a comforting game.", "Give a bath to freshen up."],
    "sick": ["Monitor health closely.", "Prepare medicine or visit the vet soon."],
}


def _seed_from_pet(pet: Pet) -> int:
    return int(pet.id.hex[:8], 16) if pet.id else int(pet.user_id.hex[:8], 16)


async def compute_mood(pet: Pet) -> MoodAnalysis:
    """
    Compute the pet's mood based on weighted stats.

    The score is a weighted sum that prioritizes happiness and health while
    ensuring cleanliness, hunger, and energy meaningfully influence the result.
    """

    await asyncio.sleep(0)
    score = (
        pet.happiness * 0.4
        + pet.health * 0.25
        + pet.energy * 0.15
        + pet.cleanliness * 0.1
        + pet.hunger * 0.1
    )

    if pet.health < 30:
        mood_key = "sick"
    elif pet.hunger < 30:
        mood_key = "hungry"
    elif pet.energy < 30:
        mood_key = "tired"
    elif score >= 70:
        mood_key = "happy"
    else:
        mood_key = "sad"

    return MoodAnalysis(key=mood_key, label=MOOD_LABELS[mood_key], score=round(score, 2))


async def get_personality_profile(pet: Pet) -> PersonalityProfile:
    """
    Assign a deterministic personality based on the pet's ID.

    Traits influence stat decay multipliers and AI reactions. Using a PRNG
    seeded by the pet ID guarantees stable traits across sessions without
    persisting additional columns.
    """

    await asyncio.sleep(0)
    randomizer = Random(_seed_from_pet(pet))
    trait_names = sorted(PERSONALITY_LIBRARY.keys())
    trait_count = min(2, len(trait_names))
    selected = randomizer.sample(trait_names, trait_count)

    modifiers: MutableMapping[str, float] = {
        "hunger_decay": 1.0,
        "energy_decay": 1.0,
        "cleanliness_decay": 1.0,
        "happiness_gain": 1.0,
        "health_regen": 1.0,
    }

    descriptions: list[str] = []
    for trait in selected:
        data = PERSONALITY_LIBRARY[trait]
        descriptions.append(data["description"])
        for modifier_name, value in data["modifiers"].items():
            modifiers[modifier_name] = round(modifiers.get(modifier_name, 1.0) * value, 4)

    summary = " ".join(descriptions)
    return PersonalityProfile(traits=selected, summary=summary, modifiers=dict(modifiers))


async def adjust_decay_rates(pet: Pet, base_rates: Mapping[str, float]) -> dict[str, float]:
    """
    Apply personality-driven adjustments to each stat decay rate.
    """

    profile = await get_personality_profile(pet)
    adjusted = dict(base_rates)
    adjusted["hunger"] = base_rates["hunger"] * profile.modifiers["hunger_decay"]
    adjusted["energy"] = base_rates["energy"] * profile.modifiers["energy_decay"]
    adjusted["cleanliness"] = base_rates["cleanliness"] * profile.modifiers["cleanliness_decay"]
    adjusted["happiness"] = base_rates["happiness"] / profile.modifiers["happiness_gain"]
    adjusted["health"] = base_rates["health"] / profile.modifiers["health_regen"]
    return adjusted


async def generate_reaction(
    pet: Pet,
    action: str,
    mood: MoodAnalysis,
    personality: PersonalityProfile | None = None,
) -> str:
    """
    Produce an AI-flavored reaction string that incorporates mood and personality.
    """

    await asyncio.sleep(0)
    personality = personality or await get_personality_profile(pet)

    base_templates: Mapping[str, Mapping[str, str]] = {
        "feed": {
            "happy": "That meal was delicious! Ready for more adventures.",
            "hungry": "Finally! I've been starving. Thank you!",
            "tired": "A good snack helps me relax.",
            "sad": "Food makes everything a bit brighter.",
            "sick": "I'll try to keep it down... thanks for caring.",
        },
        "play": {
            "happy": "That was the best game ever!",
            "hungry": "Fun! But maybe a treat next?",
            "tired": "I'm exhausted but smiling.",
            "sad": "Playing with you always cheers me up.",
            "sick": "I'll take it easy, but that was enjoyable.",
        },
        "bathe": {
            "happy": "I feel squeaky clean and refreshed!",
            "hungry": "Bath time done—snack time next?",
            "tired": "Warm water helps me unwind.",
            "sad": "Being clean helps me feel better.",
            "sick": "Thanks for keeping me comfy while I recover.",
        },
        "rest": {
            "happy": "A cozy nap keeps me shining.",
            "hungry": "I'll nap now and snack later.",
            "tired": "Zzz... exactly what I needed.",
            "sad": "Quiet time with you helps a lot.",
            "sick": "Resting up so I can bounce back soon.",
        },
    }

    template = base_templates.get(action, {}).get(mood.key, "I'm feeling different today!")

    if "playful" in personality.traits and action == "play":
        template += " Let's play again soon!"
    if "greedy" in personality.traits and action == "feed":
        template += " Maybe seconds...?"
    if "gentle" in personality.traits and action == "rest":
        template += " That was wonderfully peaceful."

    return template


async def parse_natural_language_command(command: str) -> ParsedCommand:
    """
    Stub natural language parser that maps free-form commands to pet actions.

    The parser relies on keyword heuristics for now. Future work can upgrade
    this function to delegate to an LLM intent recognizer.
    """

    await asyncio.sleep(0)
    normalized = command.strip().lower()
    if not normalized:
        return ParsedCommand(action=None, parameters={}, confidence=0.0, note="No command detected.")

    selected_action = None
    for keyword, action in COMMAND_KEYWORDS.items():
        if keyword in normalized:
            selected_action = action
            break

    parameters: dict[str, str] = {}
    if selected_action == "feed":
        if "tuna" in normalized:
            parameters["food_type"] = "tuna"
        elif "treat" in normalized or "snack" in normalized:
            parameters["food_type"] = "treat"
        else:
            parameters["food_type"] = "standard"
    elif selected_action == "play":
        if "fetch" in normalized:
            parameters["game_type"] = "fetch"
        elif "puzzle" in normalized:
            parameters["game_type"] = "puzzle"
        else:
            parameters["game_type"] = "free_play"
    elif selected_action == "rest":
        if "long" in normalized or "overnight" in normalized:
            parameters["duration_hours"] = "8"
        elif "nap" in normalized:
            parameters["duration_hours"] = "2"
        else:
            parameters["duration_hours"] = "4"

    confidence = 0.2 if selected_action is None else 0.75
    note = "Heuristic intent match (upgradeable)." if selected_action else "Unable to infer action."
    return ParsedCommand(action=selected_action, parameters=parameters, confidence=confidence, note=note)


async def generate_help_suggestions(pet: Pet) -> list[str]:
    """
    Offer context-aware guidance based on current stats.
    """

    await asyncio.sleep(0)
    suggestions: list[str] = []
    if pet.hunger < 40:
        suggestions.append("Prepare a hearty meal to raise hunger and overall happiness.")
    if pet.energy < 45:
        suggestions.append("Schedule a longer rest period to restore energy reserves.")
    if pet.cleanliness < 50:
        suggestions.append("Consider a bath or grooming session to lift cleanliness.")
    if pet.happiness < 50:
        suggestions.append("Play a favorite mini-game to boost happiness quickly.")
    if pet.health < 40:
        suggestions.append("Monitor health closely and have medicine ready just in case.")

    if not suggestions:
        suggestions.append("Keep up the great care! Maintain the current routine.")
    return suggestions


async def recommend_minigame_difficulty(pet: Pet) -> str:
    """
    Adjust mini-game difficulty heuristically based on care history.
    """

    await asyncio.sleep(0)
    average_stat = (pet.hunger + pet.happiness + pet.cleanliness + pet.energy + pet.health) / 5
    if average_stat >= 80:
        return "advanced"
    if average_stat >= 60:
        return "standard"
    return "gentle"


async def analyze_care_style(pet: Pet) -> str:
    """
    Review recent diary entries to infer the user's care style.
    """

    await asyncio.sleep(0)
    diary = pet.diary or []
    if not diary:
        return "inconsistent"

    recent_actions = [entry.get("action") for entry in diary[-10:]]
    diversity = len({action for action in recent_actions if action})
    if diversity >= 3:
        return "balanced"
    if recent_actions.count("feed") >= 5:
        return "nurturing"
    if recent_actions.count("play") >= 5:
        return "energetic"
    return "inconsistent"


async def predict_health_risks(pet: Pet) -> HealthForecast:
    """
    Forecast potential health outcomes based on neglect patterns.
    """

    await asyncio.sleep(0)
    factors: list[str] = []
    risk_level = "low"

    if pet.health < 35:
        factors.append("Current health is already low.")
        risk_level = "high"
    if pet.cleanliness < 40:
        factors.append("Low cleanliness can lead to infections.")
        risk_level = "high"
    if pet.hunger < 35:
        factors.append("Consistent hunger weakens immune system.")
        risk_level = "medium" if risk_level != "high" else risk_level
    if pet.energy < 35:
        factors.append("Low energy suggests fatigue and stress.")
        if risk_level == "low":
            risk_level = "medium"

    if not factors:
        factors.append("Vitals look steady. Keep routines consistent.")

    summary = (
        "High risk of sickness without immediate attention."
        if risk_level == "high"
        else "Moderate risk; consider proactive care."
        if risk_level == "medium"
        else "Low risk; continue existing care pattern."
    )
    return HealthForecast(risk_level=risk_level, summary=summary, contributing_factors=factors)


async def generate_notifications(pet: Pet) -> list[dict[str, Any]]:
    """
    Create actionable notifications for low stats or daily care reminders.
    """

    await asyncio.sleep(0)
    notifications: list[dict[str, Any]] = []

    thresholds = {
        "hunger": (35, "warning"),
        "energy": (35, "warning"),
        "cleanliness": (45, "info"),
        "happiness": (45, "info"),
        "health": (40, "critical"),
    }

    for stat, (limit, severity) in thresholds.items():
        value = getattr(pet, stat)
        if value < limit:
            notifications.append(
                {
                    "stat": stat,
                    "severity": severity,
                    "message": f"{pet.name} needs attention: {stat} is at {value}%.",
                    "urgency": "high" if severity in {"critical", "warning"} else "medium",
                }
            )

    if not notifications:
        notifications.append(
            {
                "stat": None,
                "severity": "info",
                "message": f"{pet.name} is thriving! Keep up the daily routine.",
                "urgency": "low",
            }
        )

    return notifications


async def recommended_actions(mood: MoodAnalysis) -> list[str]:
    """
    Provide recommended actions linked to the current mood.
    """

    await asyncio.sleep(0)
    return RECOMMENDED_ACTIONS_BY_MOOD.get(mood.key, ["Spend time together to assess needs."])


async def build_ai_overview(pet: Pet) -> dict[str, Any]:
    """
    Aggregate insights used by the AI dashboard.
    """

    mood = await compute_mood(pet)
    personality = await get_personality_profile(pet)
    help_tips = await generate_help_suggestions(pet)
    forecast = await predict_health_risks(pet)
    difficulty = await recommend_minigame_difficulty(pet)
    notifications = await generate_notifications(pet)
    care_style = await analyze_care_style(pet)
    recommendations = await recommended_actions(mood)

    return {
        "mood": mood.key,
        "mood_label": mood.label,
        "mood_score": mood.score,
        "personality_traits": personality.traits,
        "personality_summary": personality.summary,
        "help_suggestions": help_tips,
        "predicted_health": forecast.summary,
        "health_risk_level": forecast.risk_level,
        "health_factors": forecast.contributing_factors,
        "recommended_difficulty": difficulty,
        "care_style": care_style,
        "notifications": notifications,
        "recommended_actions": recommendations,
    }

