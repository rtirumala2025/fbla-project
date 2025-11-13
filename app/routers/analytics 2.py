"""
Analytics API endpoints for care reports and trend exports.
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.analytics import AnalyticsSnapshot, WeeklySummary
from app.services.analytics_service import (
    analytics_snapshot,
    end_of_day_report,
    export_reports_csv,
    weekly_summary,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/snapshot", response_model=AnalyticsSnapshot)
async def analytics_snapshot_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve the latest analytics snapshot with AI insights and trend data.
    """

    return await analytics_snapshot(session, user_id)


@router.get("/daily", response_model=WeeklySummary)
async def analytics_daily_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    end_date: date | None = Query(default=None),
):
    """
    Retrieve a seven-day summary ending at the specified date.
    """

    return await weekly_summary(session, user_id, end_date)


@router.get("/report")
async def analytics_report_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    report_date: date = Query(default_factory=lambda: date.today()),
):
    """
    Retrieve a single end-of-day care report.
    """

    return await end_of_day_report(session, user_id, report_date)


@router.get("/export")
async def analytics_export_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
    start: date = Query(...),
    end: date = Query(...),
):
    """
    Export care reports as a CSV between two dates.
    """

    if start > end:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Start date must be before end date.")

    export = await export_reports_csv(session, user_id, start, end)
    headers = {
        "Content-Disposition": f'attachment; filename="{export.filename}"',
        "Content-Type": "text/csv",
    }
    return Response(content=export.content, media_type="text/csv", headers=headers)

