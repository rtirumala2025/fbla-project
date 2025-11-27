"""
Next generation feature stubs for social, voice, AR, weather, and habit prediction.
"""

from __future__ import annotations

import hashlib
import logging
import os
from datetime import datetime, timezone
from uuid import UUID

import httpx
from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.finance import Transaction
from app.models.game import GameSession

logger = logging.getLogger(__name__)
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


async def voice_command_intent(
    payload: VoiceCommandRequest,
    session: AsyncSession,
    user_id: UUID | str,
) -> VoiceCommandResponse:
    """
    Parse voice command and execute pet actions end-to-end.
    
    This function:
    1. Parses the voice transcript to identify intent
    2. Executes the corresponding pet action
    3. Returns detailed feedback about the action result
    """
    from app.services import pet_service
    from app.services.pet_command_service import execute_command
    
    # Validate input
    if not payload.transcript or not payload.transcript.strip():
        logger.warning(f"Empty voice transcript received from user {user_id}")
        return VoiceCommandResponse(
            intent="general.chat",
            confidence=0.0,
            action=None,
            feedback="Please speak a command. Try: 'feed my pet', 'play with my pet', etc.",
        )
    
    normalized = payload.transcript.lower()
    action = None
    intent = "general.chat"
    confidence = 0.4
    feedback = "Command recorded. More phrases will be supported soon."
    execution_result = None
    
    # Enhanced intent parsing with action execution
    try:
        logger.info(f"Processing voice command from user {user_id}: {payload.transcript[:100]}")
        # Use the pet command service for robust parsing and execution
        execution_result = await execute_command(session, user_id, payload.transcript)
        
        if execution_result.get("success") and execution_result.get("steps_executed", 0) > 0:
            # Command was successfully parsed and executed
            first_step = execution_result.get("results", [{}])[0] if execution_result.get("results") else {}
            executed_action = first_step.get("action", "")
            
            # Map executed action to intent
            if executed_action == "feed":
                action = "feed_pet"
                intent = "care.feed"
                confidence = 0.85
            elif executed_action == "play":
                action = "play_with_pet"
                intent = "care.play"
                confidence = 0.85
            elif executed_action == "sleep" or executed_action == "rest":
                action = "rest_pet"
                intent = "care.rest"
                confidence = 0.85
            elif executed_action == "bathe":
                action = "bathe_pet"
                intent = "care.bathe"
                confidence = 0.85
            elif executed_action == "trick":
                action = "trick_pet"
                intent = "care.trick"
                confidence = 0.80
            
            # Generate feedback from execution result
            if execution_result.get("message"):
                feedback = execution_result["message"]
            else:
                feedback = f"Successfully executed {executed_action} action!"
        else:
            # Fallback to simple keyword matching if command service fails
            if "feed" in normalized or "hungry" in normalized or "food" in normalized:
                action = "feed_pet"
                intent = "care.feed"
                confidence = 0.70
                feedback = "I heard 'feed'. Use the pet care panel to feed your pet."
            elif "play" in normalized or "game" in normalized or "fetch" in normalized:
                action = "play_with_pet"
                intent = "care.play"
                confidence = 0.70
                feedback = "I heard 'play'. Use the pet care panel to play with your pet."
            elif "sleep" in normalized or "rest" in normalized or "nap" in normalized:
                action = "rest_pet"
                intent = "care.rest"
                confidence = 0.70
                feedback = "I heard 'sleep'. Use the pet care panel to let your pet rest."
            elif "bathe" in normalized or "bath" in normalized or "clean" in normalized:
                action = "bathe_pet"
                intent = "care.bathe"
                confidence = 0.70
                feedback = "I heard 'bathe'. Use the pet care panel to bathe your pet."
            elif "analytics" in normalized or "report" in normalized or "stats" in normalized:
                action = "open_analytics"
                intent = "analytics.open"
                confidence = 0.65
                feedback = "I heard 'analytics'. Navigate to the analytics dashboard to view reports."
            else:
                # Provide helpful suggestions
                feedback = (
                    "I didn't understand that command. Try saying 'feed my pet', "
                    "'play with my pet', 'let my pet sleep', or 'bathe my pet'."
                )
    except Exception as e:
        # Log error but return graceful response
        logger.error(f"Error executing voice command for user {user_id}: {e}", exc_info=True)
        feedback = "Command processing encountered an error. Please try again or use the pet care panel."
        confidence = 0.0
    
    logger.info(f"Voice command processed: intent={intent}, action={action}, confidence={confidence:.2f}")
    return VoiceCommandResponse(
        intent=intent,
        confidence=confidence,
        action=action,
        feedback=feedback,
    )


async def generate_ar_session(
    user_id: UUID,
    session: AsyncSession,
) -> ARSessionResponse:
    """
    Generate AR session with real pet data for visualization.
    
    This function:
    1. Fetches the user's pet data
    2. Generates AR session configuration
    3. Includes pet appearance and stats for AR rendering
    """
    from app.services import pet_service
    
    # Validate user_id
    if not user_id:
        raise ValueError("user_id is required for AR session generation")
    
    now = datetime.now(tz=timezone.utc).isoformat()
    session_id = hashlib.sha1(f"{user_id}-{now}".encode("utf-8")).hexdigest()
    
    # Fetch real pet data
    pet = None
    try:
        pet = await pet_service.get_pet_by_user(session, user_id)
        logger.info(f"AR session generated for user {user_id} with pet {pet.name if pet else 'none'}")
    except Exception as e:
        # Pet might not exist, continue with generic instructions
        logger.debug(f"Pet not found for user {user_id} in AR session: {e}")
        pass
    
    # Generate contextual instructions based on pet data
    if pet:
        instructions = [
            f"Open the AR view and scan a flat surface to place {pet.name}.",
            f"Move your device slowly to help AR tracking detect surfaces.",
            f"Tap the glowing paw icon to anchor {pet.name} ({pet.species}) in AR.",
            f"Your pet's current mood: {pet.mood}. Stats: Health {pet.health}%, Happiness {pet.happiness}%.",
        ]
        anchor_description = (
            f"Place {pet.name} ({pet.species}, {pet.breed}) at eye-level using surface detection. "
            f"Your pet will appear with current stats and mood."
        )
    else:
        instructions = [
            "Open the mobile companion app and scan a flat surface.",
            "Move your device in small circles to help tracking.",
            "Tap the glowing paw icon to place your pet in AR.",
            "Create a pet first to see it in AR!",
        ]
        anchor_description = "Use surface detection to anchor the pet at eye-level."
    
    # Include pet data for AR rendering
    pet_data = None
    if pet:
        pet_data = {
            "id": str(pet.id),
            "name": pet.name,
            "species": pet.species,
            "breed": pet.breed,
            "color_pattern": pet.color_pattern,
            "mood": pet.mood,
            "stats": {
                "hunger": pet.hunger,
                "happiness": pet.happiness,
                "cleanliness": pet.cleanliness,
                "energy": pet.energy,
                "health": pet.health,
            },
        }
    
    return ARSessionResponse(
        session_id=session_id,
        anchor_description=anchor_description,
        instructions=instructions,
        pet_data=pet_data,
    )


async def save_cloud_state(user_id: UUID, payload: CloudSavePayload) -> CloudSaveResponse:
    snapshot = hashlib.sha1(str(payload.state).encode("utf-8")).hexdigest()
    return CloudSaveResponse(saved_at=datetime.now(tz=timezone.utc), checksum=snapshot)


async def fetch_weather_reaction(
    lat: float,
    lon: float,
    session: AsyncSession | None = None,
    user_id: UUID | str | None = None,
) -> WeatherReactionResponse:
    """
    Fetch weather data and generate contextual pet care recommendations.
    
    This function:
    1. Fetches live weather from OpenWeatherMap API
    2. Generates pet-specific reactions based on weather
    3. Provides contextual care recommendations
    4. Integrates with pet state for personalized suggestions
    """
    # Validate coordinates
    if not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
        raise ValueError("Latitude and longitude must be numeric values")
    if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
        raise ValueError("Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180")
    
    settings = get_settings()
    api_key = settings.weather_api_key or os.getenv("WEATHER_API_KEY", "")
    
    logger.info(f"Fetching weather for coordinates: lat={lat}, lon={lon}, user_id={user_id}")
    
    # Fetch pet data for contextual recommendations
    pet = None
    if session and user_id:
        try:
            from app.services import pet_service
            pet = await pet_service.get_pet_by_user(session, user_id)
        except Exception:
            pass  # Continue without pet context
    
    # Fetch weather data with retry logic
    condition = "clear"
    temperature = 22.0
    weather_description = "clear skies"
    
    if api_key:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {"lat": lat, "lon": lon, "appid": api_key, "units": "metric"}
        
        # Retry logic for network resilience
        max_retries = 3
        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    response = await client.get(url, params=params)
                    response.raise_for_status()
                    data = response.json()
                    
                    condition = data["weather"][0]["main"].lower()
                    temperature = float(data["main"]["temp"])
                    weather_description = data["weather"][0].get("description", condition)
                    break
            except (httpx.HTTPError, httpx.TimeoutException) as e:
                if attempt == max_retries - 1:
                    # Final attempt failed, use fallback
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.warning(f"Weather API failed after {max_retries} attempts: {e}")
                else:
                    import asyncio
                    await asyncio.sleep(0.5 * (attempt + 1))  # Exponential backoff
    
    # Generate contextual reactions based on weather and pet state
    pet_name = pet.name if pet else "Your pet"
    pet_mood = pet.mood if pet else "happy"
    
    if "rain" in condition or "drizzle" in condition:
        if pet and pet.happiness < 60:
            reaction = f"{pet_name} is staying cozy indoors. The rain might be affecting {pet_name.lower()}'s mood."
            recommendation = "Play an indoor puzzle game to boost happiness and earn coins!"
        else:
            reaction = f"{pet_name} is staying cozy indoors because it's rainy outside."
            recommendation = "Perfect time for indoor activities! Try a puzzle mini-game or feed your pet."
    elif "snow" in condition:
        reaction = f"Snowflakes! {pet_name} is excited about the winter weather."
        recommendation = "Bundle up and visit the AR view for a snowy surprise, or play fetch indoors!"
    elif "cloud" in condition:
        if temperature < 15:
            reaction = f"It's a cool, cloudy day. {pet_name} prefers staying warm."
            recommendation = "Indoor activities are best. Consider feeding or playing games."
        else:
            reaction = f"Cloudy skies, but {pet_name} is still energetic!"
            recommendation = "Good weather for both indoor and outdoor activities."
    elif temperature > 30:
        reaction = f"It's very hot outside! {pet_name} needs to stay cool and hydrated."
        recommendation = "Keep activities indoors. Feed your pet and play indoor games to avoid overheating."
    elif temperature < 5:
        reaction = f"Brr! It's cold outside. {pet_name} prefers staying warm indoors."
        recommendation = "Perfect for cozy indoor activities. Feed your pet and play games together!"
    else:
        # Clear or pleasant weather
        if pet and pet.energy > 70:
            reaction = f"Perfect weather! {pet_name} is full of energy and ready for outdoor fun."
            recommendation = "Great day for outdoor activities! Play fetch or visit the AR view."
        else:
            reaction = f"It's a beautiful day! {pet_name} is enjoying the pleasant weather."
            recommendation = "Take advantage of the nice weather - play fetch or go for a virtual walk!"

    # Add pet-specific health recommendations based on weather
    if pet:
        if pet.health < 60 and "rain" in condition:
            recommendation += " Your pet's health is low - consider rest and care activities."
        elif pet.hunger < 50:
            recommendation += f" {pet_name} might be hungry - feeding now would be great!"

    return WeatherReactionResponse(
        condition=condition,
        temperature_c=temperature,
        reaction=reaction,
        recommendation=recommendation,
    )


async def predict_user_habits(session: AsyncSession, user_id: UUID | str) -> HabitPredictionResponse:
    """
    Predict user habits and generate AI suggestions for optimal pet care.
    
    This function:
    1. Analyzes game sessions and transactions to predict preferred times/actions
    2. Generates AI-powered suggestions based on pet state
    3. Creates notification messages for optimal care timing
    """
    from app.services import ai_service, pet_service
    
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

    # Generate AI suggestions based on pet state
    ai_suggestions = []
    notification_message = None
    
    try:
        pet = await pet_service.get_pet_by_user(session, user_id)
        if pet:
            # Get AI recommendations
            from app.services.ai_service import build_ai_overview
            ai_overview = await build_ai_overview(pet)
            
            # Extract suggestions from AI overview
            if ai_overview.get("recommended_actions"):
                ai_suggestions = ai_overview["recommended_actions"][:3]  # Top 3 suggestions
            
            # Generate contextual notification
            from datetime import datetime, time
            current_hour = datetime.now().hour
            
            # Check if it's approaching the preferred time
            time_diff = abs(current_hour - preferred_hour)
            if time_diff <= 1:
                notification_message = (
                    f"Perfect timing! Based on your habits, now is a great time to "
                    f"{', '.join(preferred_actions[:2])} with your pet."
                )
            elif current_hour < preferred_hour:
                hours_until = preferred_hour - current_hour
                notification_message = (
                    f"In {hours_until} hour(s), you typically interact with your pet. "
                    f"Consider {', '.join(preferred_actions[:2])} then!"
                )
            else:
                # Check pet stats for urgent care needs
                if pet.hunger < 40:
                    notification_message = f"{pet.name} might be getting hungry. Consider feeding soon!"
                elif pet.happiness < 50:
                    notification_message = f"{pet.name} could use some playtime to boost happiness!"
                elif pet.health < 60:
                    notification_message = f"{pet.name}'s health is low. Consider rest and care activities!"
                else:
                    notification_message = (
                        f"Your next optimal interaction time is around {preferred_hour:02d}:00. "
                        f"Try: {', '.join(preferred_actions[:2])}"
                    )
    except Exception:
        # If pet doesn't exist or error occurs, provide generic suggestions
        ai_suggestions = [
            "Feed your pet regularly to maintain hunger levels",
            "Play games to boost happiness and energy",
            "Monitor health stats and provide care as needed",
        ]
        notification_message = (
            f"Based on your activity patterns, try interacting with your pet around {preferred_hour:02d}:00."
        )

    return HabitPredictionResponse(
        preferred_actions=preferred_actions,
        next_best_time=f"{preferred_hour:02d}:00",
        confidence=confidence,
        ai_suggestions=ai_suggestions,
        notification_message=notification_message,
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

