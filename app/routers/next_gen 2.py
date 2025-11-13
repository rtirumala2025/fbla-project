"""
Next-gen feature endpoints (social, voice, AR, weather, habits, seasonal).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
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
from app.services.next_gen_service import (
    current_seasonal_event,
    fetch_weather_reaction,
    generate_ar_session,
    pet_social_interaction,
    predict_user_habits,
    save_cloud_state,
    voice_command_intent,
)

router = APIRouter(prefix="/api/nextgen", tags=["NextGen"])


@router.post("/social", response_model=SocialInteractionResponse)
async def social_interaction_endpoint(payload: SocialInteractionRequest) -> SocialInteractionResponse:
    return await pet_social_interaction(payload)


@router.post("/voice", response_model=VoiceCommandResponse)
async def voice_command_endpoint(payload: VoiceCommandRequest) -> VoiceCommandResponse:
    return await voice_command_intent(payload)


@router.get("/ar", response_model=ARSessionResponse)
async def ar_session_endpoint(user_id: str = Depends(get_current_user_id)) -> ARSessionResponse:
    return await generate_ar_session(user_id)


@router.post("/cloud", response_model=CloudSaveResponse, status_code=status.HTTP_201_CREATED)
async def cloud_save_endpoint(
    payload: CloudSavePayload,
    user_id: str = Depends(get_current_user_id),
) -> CloudSaveResponse:
    return await save_cloud_state(user_id, payload)


@router.get("/weather", response_model=WeatherReactionResponse)
async def weather_reaction_endpoint(
    lat: float,
    lon: float,
) -> WeatherReactionResponse:
    return await fetch_weather_reaction(lat, lon)


@router.get("/habits", response_model=HabitPredictionResponse)
async def habit_prediction_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> HabitPredictionResponse:
    return await predict_user_habits(session, user_id)


@router.get("/seasonal", response_model=SeasonalEventResponse)
async def seasonal_event_endpoint() -> SeasonalEventResponse:
    return current_seasonal_event()

