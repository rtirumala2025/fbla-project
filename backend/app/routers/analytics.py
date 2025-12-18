"""Analytics API endpoints."""
from __future__ import annotations

from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status
from asyncpg import Pool

from app.core.jwt import get_current_user_id
from app.utils.dependencies import get_db_pool
from app.services.analytics_service import analytics_snapshot, AnalyticsSnapshot

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/snapshot")
async def get_analytics_snapshot(
    pool: Optional[Pool] = Depends(get_db_pool),
    user_id: str = Depends(get_current_user_id),
) -> AnalyticsSnapshot:
    """
    Get analytics snapshot for the authenticated user.
    
    Returns aggregated analytics data including:
    - End of day summary
    - Daily, weekly, monthly summaries
    - Trends and expenses
    - AI insights and notifications
    """
    snapshot = await analytics_snapshot(pool, user_id)
    return snapshot


@router.get("/daily")
async def get_daily_summary(
    end_date: Optional[str] = Query(default=None, description="End date for summary (ISO format)"),
    pool: Optional[Pool] = Depends(get_db_pool),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get daily analytics summary.
    
    Returns weekly summary of daily reports.
    """
    # Parse end_date if provided
    if end_date:
        try:
            end = date.fromisoformat(end_date)
        except ValueError:
            end = date.today()
    else:
        end = date.today()
    
    # Generate reports for last 7 days
    reports = []
    for i in range(7):
        report_date = end - timedelta(days=i)
        # In a full implementation, this would fetch actual daily data
        # For now, return basic structure
        reports.append({
            "date": report_date.isoformat(),
            "coins_earned": 0,
            "coins_spent": 0,
            "net_coins": 0,
            "pet_actions": 0,
        })
    
    return {
        "period": "weekly",
        "reports": reports,
        "refreshed_at": date.today().isoformat(),
    }


@router.get("/export")
async def export_analytics_csv(
    start: str = Query(..., description="Start date (ISO format)"),
    end: str = Query(..., description="End date (ISO format)"),
    pool: Optional[Pool] = Depends(get_db_pool),
    user_id: str = Depends(get_current_user_id),
):
    """
    Export analytics data as CSV.
    
    Returns CSV file with analytics data for the specified date range.
    """
    try:
        start_date = date.fromisoformat(start)
        end_date = date.fromisoformat(end)
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid date format: {str(e)}"
        )
    
    # Generate CSV content
    # In a full implementation, this would fetch actual data
    csv_lines = ["date,coins_earned,coins_spent,net_coins,pet_actions"]
    
    current_date = start_date
    while current_date <= end_date:
        csv_lines.append(f"{current_date.isoformat()},0,0,0,0")
        current_date += timedelta(days=1)
    
    csv_content = "\n".join(csv_lines)
    filename = f"care-report-{start_date.isoformat()}-to-{end_date.isoformat()}.csv"
    
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

