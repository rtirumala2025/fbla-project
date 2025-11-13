"""
AI Coach endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.quest import CoachAdviceResponse
from app.services.coach_service import generate_coach_advice

router = APIRouter(prefix="/api/coach", tags=["Coach"])


@router.get("", response_model=CoachAdviceResponse)
async def get_coach_advice(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> CoachAdviceResponse:
    """
    Generate adaptive guidance for the authenticated user's pet care and quests.
    """

    return await generate_coach_advice(session, user_id)


