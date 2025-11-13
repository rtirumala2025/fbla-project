"""
Next generation feature stubs for social, voice, AR, weather, and habit prediction.
"""

from __future__ import annotations

import hashlib
import os
from datetime import datetime, timezone
from uuid import UUID

import httpx
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.finance import Transaction
from app.models.game import GameSession
from app.schemas.next_gen import (
    ARSessionResponse,
    CloudSavePayload,
    CloudSaveResponse,
    HabitPredictionResponse,
    SeasonalEventResponse,
    SocialInteractionRequest,
    SocialInteractionResponse,
    VoiceCommandRequest,
    VoiceCommandResponse,
    WeatherReactionResponse,
)


async def pet_social_interaction(payload: SocialInteractionRequest) -> SocialInteractionResponse:
    now = datetime.now(tz=timezone.utc)
    summary = (
        "Pets exchanged greetings and planned a mini-game session together. "
        "Future releases will record deeper personality-driven conversations."
    )
    follow_up = "Schedule a co-op mini-game or send a gift through the shop."
    return SocialInteractionResponse(summary=summary, suggested_follow_up=follow_up, timestamp=now)


async def voice_command_intent(payload: VoiceCommandRequest) -> VoiceCommandResponse:
    normalized = payload.transcript.lower()
    if "feed" in normalized:
        action = "feed_pet"
        intent = "care.feed"
    elif "play" in normalized:
        action = "play_with_pet"
        intent = "care.play"
    elif "analytics" in normalized or "report" in normalized:
        action = "open_analytics"
        intent = "analytics.open"
    else:
        action = None
        intent = "general.chat"
    confidence = 0.65 if action else 0.4
    feedback = (
        "Command understood. Triggering action."
        if action
        else "Command recorded. More phrases will be supported soon."
    )
    return VoiceCommandResponse(intent=intent, confidence=confidence, action=action, feedback=feedback)


async def generate_ar_session(user_id: UUID) -> ARSessionResponse:
    now = datetime.now(tz=timezone.utc).isoformat()
    session_id = hashlib.sha1(f"{user_id}-{now}".encode("utf-8")).hexdigest()
    instructions = [
        "Open the mobile companion app and scan a flat surface.",
        "Move your device in small circles to help tracking.",
        "Tap the glowing paw icon to place your pet in AR.",
    ]
    return ARSessionResponse(
        session_id=session_id,
        anchor_description="Use surface detection to anchor the pet at eye-level.",
        instructions=instructions,
    )


async def save_cloud_state(user_id: UUID, payload: CloudSavePayload) -> CloudSaveResponse:
    snapshot = hashlib.sha1(str(payload.state).encode("utf-8")).hexdigest()
    return CloudSaveResponse(saved_at=datetime.now(tz=timezone.utc), checksum=snapshot)


async def fetch_weather_reaction(lat: float, lon: float) -> WeatherReactionResponse:
    settings = get_settings()
    api_key = settings.weather_api_key or os.getenv("WEATHER_API_KEY", "")
    if not api_key:
        return WeatherReactionResponse(
            condition="sunny",
            temperature_c=24.0,
            reaction="Your pet is basking in the sunshine!",
            recommendation="Consider an outdoor mini-game today.",
        )

    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}
    async with httpx.AsyncClient(timeout=5) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        data = response.json()

    condition = data["weather"][0]["main"].lower()
    temperature = float(data["main"]["temp"])

    if "rain" in condition:
        reaction = "Your pet is staying cozy indoors because it's rainy."
        recommendation = "Play an indoor puzzle to keep spirits high."
    elif "snow" in condition:
        reaction = "Snowflakes! Your pet is excited to make paw prints."
        recommendation = "Bundle up and visit the AR view for a snowy surprise."
    else:
        reaction = "It's a clear day — perfect for an outdoor fetch session."
        recommendation = "Earn bonus coins by playing a fetch mini-game."

    return WeatherReactionResponse(
        condition=condition,
        temperature_c=temperature,
        reaction=reaction,
        recommendation=recommendation,
    )


async def predict_user_habits(session: AsyncSession, user_id: UUID | str) -> HabitPredictionResponse:
    user_uuid = user_id if isinstance(user_id, UUID) else UUID(str(user_id))
    bind = session.get_bind()
    dialect_name = bind.dialect.name if bind else ""
    if dialect_name == "sqlite":
        hour_expression = func.strftime("%H", GameSession.created_at)
    else:
        hour_expression = func.date_trunc("hour", GameSession.created_at)
    stmt: Select = (
        select(func.count(GameSession.id), hour_expression)
        .where(GameSession.user_id == user_uuid)
        .group_by(hour_expression)
        .order_by(func.count(GameSession.id).desc())
        .limit(1)
    )
    result = await session.execute(stmt)
    row = result.first()
    if row:
        if dialect_name == "sqlite":
            preferred_hour = int(row[1]) if row[1] is not None else 18
        else:
            preferred_hour = int(row[1].hour)
    else:
        preferred_hour = 18

    actions_stmt = (
        select(Transaction.category, func.count(Transaction.id))
        .where(
            Transaction.user_id == user_uuid,
            Transaction.category.in_(["care_reward", "shop_purchase"]),
        )
        .group_by(Transaction.category)
    )
    action_result = await session.execute(actions_stmt)
    preferred_actions = [row[0] for row in action_result.all()] or ["care_reward"]
    confidence = 0.6 if row else 0.3

    return HabitPredictionResponse(
        preferred_actions=preferred_actions,
        next_best_time=f"{preferred_hour:02d}:00",
        confidence=confidence,
    )


def current_seasonal_event(now: datetime | None = None) -> SeasonalEventResponse:
    now = now or datetime.now(tz=timezone.utc)
    month = now.month
    if month in {12, 1}:
        return SeasonalEventResponse(
            event_name="Winter Wonder Paws",
            message="Snowball mini-games and cozy sweaters available for a limited time.",
            rewards=["Snowflake Collar", "Cozy Cabin background"],
        )
    if month in {6, 7}:
        return SeasonalEventResponse(
            event_name="Summer Splash",
            message="Cool down with limited-time water toys and beach accessories.",
            rewards=["Watermelon Frisbee", "Beach Umbrella"],
        )
    if month == 10:
        return SeasonalEventResponse(
            event_name="Spooky Howl-o-ween",
            message="Collect treats to unlock spooky animations and costumes.",
            rewards=["Pumpkin Treat", "Ghostly Bandana"],
        )
    return SeasonalEventResponse(
        event_name="Daily Adventures",
        message="Keep caring for your pet to unlock surprise seasonal events.",
        rewards=[],
    )

