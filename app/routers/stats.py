"""
Platform statistics API endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.stats import StatsSummary
from app.services.stats_service import get_platform_stats

router = APIRouter(prefix="/api/stats", tags=["Stats"])


@router.get("/summary", response_model=StatsSummary)
async def stats_summary_endpoint(
    session: AsyncSession = Depends(get_db),
) -> StatsSummary:
    """
    Retrieve platform-wide statistics summary.

    Returns aggregate statistics including:
    - Total active users
    - Number of distinct pet species
    - Number of unique breeds
    - Average satisfaction rate (based on pet happiness)
    """
    return await get_platform_stats(session)

