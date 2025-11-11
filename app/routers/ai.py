"""
Conversational AI routes.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.services import ai_chat_service

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/chat", response_model=AIChatResponse)
async def chat_with_scout(
    payload: AIChatRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> AIChatResponse:
    """Streamlined endpoint for the front-end chat widget."""

    return await ai_chat_service.chat(session, user_id, payload)

