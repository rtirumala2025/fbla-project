"""Command-oriented pet interaction endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException, status

from app.models import AuthenticatedUser
from app.schemas import (
    PetAction,
    PetActionRequest,
    PetInteractRequest,
    PetInteractResponse,
    PetResponse,
)
from app.services.pet_service import PetService
from app.utils.dependencies import get_current_user, get_pet_service

router = APIRouter(prefix="/pet", tags=["pets"])

ACTION_ALIASES: Dict[str, PetAction] = {
    "feed": PetAction.feed,
    "snack": PetAction.feed,
    "treat": PetAction.feed,
    "play": PetAction.play,
    "pet": PetAction.play,
    "train": PetAction.play,
    "game": PetAction.play,
    "bathe": PetAction.bathe,
    "clean": PetAction.bathe,
    "groom": PetAction.bathe,
    "rest": PetAction.rest,
    "sleep": PetAction.rest,
}


@router.post("/interact", response_model=PetInteractResponse, summary="Interact with the virtual pet via command")
async def interact_with_pet(
    payload: PetInteractRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    pet_service: PetService = Depends(get_pet_service),
) -> PetInteractResponse:
    pet = await pet_service.get_pet(current_user.id)
    if pet is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found.")

    session_id = payload.session_id or f"pet-session-{current_user.id}"
    normalized_action = payload.action.lower().strip()

    if normalized_action == "status":
        return PetInteractResponse(
            session_id=session_id,
            message=_render_status_summary(pet),
            mood=pet.stats.mood,
            pet_state=_build_pet_state(pet),
            notifications=[],
            health_forecast=_forecast_health(pet),
        )

    pet_action = ACTION_ALIASES.get(normalized_action)
    if pet_action is None:
        # For unrecognised commands, surface a helpful message.
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported pet command '{payload.action}'. Try /feed, /play, /bathe, /rest, or /status.",
        )

    action_request = _derive_action_request(pet_action, payload.message)
    action_response = await pet_service.apply_action(
        current_user.id,
        pet_action,
        action_request,
    )

    message = _format_reaction_message(action_response.pet, action_response.reaction, action_response.mood)

    pet_state = _build_pet_state(action_response.pet)
    if action_response.health_forecast:
        pet_state["health_forecast"] = action_response.health_forecast

    notifications = list(action_response.notifications)
    if action_response.health_forecast and action_response.health_forecast.get("recommended_actions"):
        notifications.extend(action_response.health_forecast["recommended_actions"])

    return PetInteractResponse(
        session_id=session_id,
        message=message,
        mood=action_response.mood,
        pet_state=pet_state,
        notifications=notifications,
        health_forecast=action_response.health_forecast,
    )


def _derive_action_request(action: PetAction, message: str | None) -> PetActionRequest:
    """Create a PetActionRequest tailored to the supplied command."""
    if action is PetAction.feed:
        return PetActionRequest(food_type=message or "favorite snack")
    if action is PetAction.play:
        return PetActionRequest(game_type=message or "playtime")
    if action is PetAction.rest:
        duration = 1
        if message:
            tokens = [token for token in message.split() if token.isdigit()]
            if tokens:
                duration = max(1, min(12, int(tokens[0])))
        return PetActionRequest(duration_hours=duration)
    return PetActionRequest()


def _build_pet_state(pet: PetResponse) -> Dict[str, int | str]:
    stats = pet.stats
    return {
        "mood": stats.mood,
        "happiness": _mood_to_percent(stats.mood),
        "energy": stats.energy,
        "hunger": stats.hunger,
        "cleanliness": stats.hygiene,
        "health": stats.health,
        "last_updated": datetime.utcnow().isoformat(),
    }


def _mood_to_percent(mood: str) -> int:
    mapping = {
        "ecstatic": 95,
        "happy": 85,
        "content": 70,
        "anxious": 45,
        "distressed": 25,
        "ill": 20,
    }
    return mapping.get(mood.lower(), 65)


def _format_reaction_message(pet: PetResponse, reaction: str, mood: str) -> str:
    return f"{pet.name} {reaction}. Mood now: {mood}."


def _render_status_summary(pet: PetResponse) -> str:
    stats = pet.stats
    return (
        f"{pet.name}'s status — Mood: {stats.mood}, Hunger: {stats.hunger}%, Energy: {stats.energy}%, "
        f"Hygiene: {stats.hygiene}%, Health: {stats.health}%. Keep up the great care!"
    )


def _forecast_health(pet: PetResponse) -> Dict[str, Any]:
    stats = pet.stats
    average = (stats.health + stats.energy + stats.hunger + stats.hygiene) / 4
    trend = "steady"
    if average >= 75:
        trend = "improving"
    elif average <= 45:
        trend = "declining"

    risk = "low"
    if stats.health < 35 or stats.hunger < 30:
        risk = "high"
    elif stats.health < 50 or stats.hunger < 40:
        risk = "medium"

    recommendations = []
    if stats.hunger < 40:
        recommendations.append("Offer a balanced meal soon.")
    if stats.energy < 40:
        recommendations.append("Schedule a rest break to recover energy.")
    if stats.hygiene < 40:
        recommendations.append("Consider a grooming session to boost comfort.")
    if not recommendations:
        recommendations.append("Maintain the current care routine.")

    return {
        "trend": trend,
        "risk": risk,
        "recommended_actions": recommendations,
    }

