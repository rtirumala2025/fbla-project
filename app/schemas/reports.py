"""
Pydantic schemas for advanced reporting and analytics endpoints.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ReportFilters(BaseModel):
    """Filters for generating custom reports."""
    start_date: date
    end_date: date
    selected_metrics: List[str] = Field(default_factory=list, description="List of metric names to include")


class MetricOption(BaseModel):
    """Available metric option for selection."""
    key: str
    label: str
    description: Optional[str] = None


class ForecastDataPoint(BaseModel):
    """Single data point in a cost forecast."""
    date: date
    predicted_cost: float
    confidence_interval_lower: Optional[float] = None
    confidence_interval_upper: Optional[float] = None


class CostForecast(BaseModel):
    """AI-generated cost forecast response."""
    forecast_period_start: date
    forecast_period_end: date
    current_average_daily_cost: float
    predicted_average_daily_cost: float
    total_predicted_cost: float
    forecast_points: List[ForecastDataPoint]
    insights: List[str] = Field(default_factory=list)
    generated_at: datetime


class PDFExportRequest(BaseModel):
    """Request for PDF export."""
    start_date: date
    end_date: date
    selected_metrics: List[str] = Field(default_factory=list)
    include_charts: bool = True
    include_forecast: bool = False


class PDFExportResponse(BaseModel):
    """Response containing PDF data."""
    filename: str
    content: str  # Base64 encoded PDF content
