"""
Pet customization API endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.ai import AIChatResponse
from app.schemas.pet import (
    PetAIInsights,
    FeedPetRequest,
    PetCommandRequest,
    PetCommandResponse,
    PetActionResponse,
    PetCreate,
    PetDiaryEntry,
    PetHelpResponse,
    PetHealthSummary,
    PetInteractRequest,
    PetNotification,
    PetRead,
    PetStats,
    PetUpdate,
    PlayPetRequest,
    RestPetRequest,
)
from app.services.pet_service import (
    PetAlreadyExistsError,
    PetNotFoundError,
    bathe_pet,
    check_health,
    create_pet,
    feed_pet,
    get_pet_by_user,
    get_pet_diary,
    get_pet_ai_help,
    get_pet_ai_notifications,
    get_pet_ai_overview,
    get_pet_stats,
    play_with_pet,
    rest_pet,
    update_pet,
)
from app.services import ai_chat_service, ai_service

router = APIRouter(prefix="/api/pets", tags=["Pets"])
legacy_router = APIRouter(prefix="/api/pet", tags=["Pets"])


@router.post("", response_model=PetRead, status_code=status.HTTP_201_CREATED)
async def create_pet_endpoint(
    payload: PetCreate,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a new pet for the authenticated user.
    """

    try:
        return await create_pet(session, user_id, payload)
    except PetAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("", response_model=PetRead)
async def get_pet_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve the authenticated user's pet.
    """

    pet = await get_pet_by_user(session, user_id)
    if pet is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pet not found.")
    return pet


@router.patch("", response_model=PetRead)
async def update_pet_endpoint(
    payload: PetUpdate,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Update the authenticated user's pet customization.
    """

    try:
        return await update_pet(session, user_id, payload)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/feed", response_model=PetActionResponse)
async def feed_pet_endpoint(
    payload: FeedPetRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Feed the authenticated user's pet with the provided food type.
    """

    try:
        return await feed_pet(session, user_id, payload.food_type)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/play", response_model=PetActionResponse)
async def play_with_pet_endpoint(
    payload: PlayPetRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Play a mini-game with the pet to boost happiness.
    """

    try:
        return await play_with_pet(session, user_id, payload.game_type)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/bathe", response_model=PetActionResponse)
async def bathe_pet_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Bathe the pet to restore cleanliness.
    """

    try:
        return await bathe_pet(session, user_id)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/rest", response_model=PetActionResponse)
async def rest_pet_endpoint(
    payload: RestPetRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Let the pet rest to recover energy and health.
    """

    try:
        return await rest_pet(session, user_id, payload.duration_hours)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/interact", response_model=AIChatResponse)
async def interact_with_pet(
    payload: PetInteractRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> AIChatResponse:
    """
    Unified interaction endpoint that dispatches to the appropriate care action.
    """
    try:
        return await ai_chat_service.interact(session, user_id, payload)
    except PetNotFoundError as exc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc


@legacy_router.post("/interact", response_model=PetActionResponse, include_in_schema=False)
async def interact_with_pet_legacy(
    payload: PetInteractRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PetActionResponse:
    """
    Backwards-compatible alias for the older singular pet route.
    """

    return await interact_with_pet(payload, session, user_id)


@router.get("/stats", response_model=PetStats)
async def get_pet_stats_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve the latest computed stats for the pet.
    """

    try:
        return await get_pet_stats(session, user_id)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/diary", response_model=list[PetDiaryEntry])
async def get_pet_diary_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve the activity diary for the pet.
    """

    try:
        return await get_pet_diary(session, user_id)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/health", response_model=PetHealthSummary)
async def get_pet_health_summary_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate a lightweight AI health summary for the pet.
    """

    try:
        return await check_health(session, user_id)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/ai/insights", response_model=PetAIInsights)
async def get_pet_ai_insights_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve aggregated AI insights for the authenticated user's pet.
    """

    try:
        return await get_pet_ai_overview(session, user_id)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/ai/notifications", response_model=list[PetNotification])
async def get_pet_ai_notifications_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve AI-generated notifications and reminders.
    """

    try:
        return await get_pet_ai_notifications(session, user_id)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.get("/ai/help", response_model=PetHelpResponse)
async def get_pet_ai_help_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Provide context-aware AI help suggestions for the user.
    """

    try:
        suggestions = await get_pet_ai_help(session, user_id)
    except PetNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    return PetHelpResponse(suggestions=suggestions)


@router.post("/ai/command", response_model=PetCommandResponse)
async def parse_pet_command_endpoint(
    payload: PetCommandRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Parse natural language commands into actionable intents.
    """

    result = await ai_service.parse_natural_language_command(payload.command_text)
    return PetCommandResponse(
        action=result.action,
        parameters=result.parameters,
        confidence=result.confidence,
        note=result.note,
    )

