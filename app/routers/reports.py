"""
Advanced reporting and analytics API endpoints.
"""

from __future__ import annotations

from datetime import date, timedelta

import base64

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.reports import (
    CostForecast,
    MetricOption,
    PDFExportRequest,
    PDFExportResponse,
    ReportFilters,
)
from app.services.report_service import generate_cost_forecast, generate_pdf_report

router = APIRouter(prefix="/api/reports", tags=["Reports"])


# Available metrics for selection
AVAILABLE_METRICS = [
    MetricOption(key="coins_earned", label="Coins Earned", description="Total coins earned"),
    MetricOption(key="coins_spent", label="Coins Spent", description="Total coins spent"),
    MetricOption(key="net_coins", label="Net Coins", description="Net coin balance"),
    MetricOption(key="games_played", label="Games Played", description="Number of games played"),
    MetricOption(key="pet_actions", label="Pet Actions", description="Number of pet care actions"),
    MetricOption(key="happiness_gain", label="Happiness Gain", description="Total happiness increase"),
    MetricOption(key="health_change", label="Health Change", description="Total health change"),
    MetricOption(key="expenses", label="Expenses", description="Expense breakdown by category"),
]


@router.get("/metrics", response_model=list[MetricOption])
async def get_available_metrics():
    """
    Get list of available metrics for custom report generation.
    """
    return AVAILABLE_METRICS


@router.post("/export_pdf", response_model=PDFExportResponse)
async def export_pdf_endpoint(
    request: PDFExportRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate and export a PDF report with analytics data.
    """
    if request.start_date > request.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before or equal to end date."
        )
    
    # Limit date range to prevent excessive processing
    max_days = 365
    if (request.end_date - request.start_date).days > max_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Date range cannot exceed {max_days} days."
        )
    
    try:
        pdf_bytes = await generate_pdf_report(session, user_id, request)
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        filename = f"care-report-{request.start_date.strftime('%Y%m%d')}-{request.end_date.strftime('%Y%m%d')}.pdf"
        
        return PDFExportResponse(
            filename=filename,
            content=pdf_base64,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate PDF: {str(e)}"
        )


@router.post("/forecast_cost", response_model=CostForecast)
async def forecast_cost_endpoint(
    forecast_days: int = 30,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Generate AI-powered cost forecast for future spending.
    """
    if forecast_days < 1 or forecast_days > 365:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Forecast days must be between 1 and 365."
        )
    
    try:
        forecast = await generate_cost_forecast(session, user_id, forecast_days)
        return forecast
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate forecast: {str(e)}"
        )


@router.post("/filtered")
async def get_filtered_report(
    filters: ReportFilters,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Get filtered analytics data based on date range and selected metrics.
    """
    if filters.start_date > filters.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date must be before or equal to end date."
        )
    
    # This endpoint would use the analytics service to return filtered data
    # For now, return a basic response structure
    from app.services.analytics_service import analytics_snapshot
    
    snapshot = await analytics_snapshot(session, user_id)
    
    # Filter based on selected metrics if provided
    # This is a simplified version - in production, you'd filter the actual data
    response_data = {
        "start_date": filters.start_date.isoformat(),
        "end_date": filters.end_date.isoformat(),
        "selected_metrics": filters.selected_metrics,
        "data": snapshot.model_dump(),
    }
    
    return response_data
