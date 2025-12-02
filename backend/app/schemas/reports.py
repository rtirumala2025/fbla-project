"""Schemas for reporting and analytics endpoints."""
from __future__ import annotations

from datetime import date
from typing import List

from pydantic import BaseModel, Field


class MetricOption(BaseModel):
    """Available metric option for reports."""
    key: str
    label: str
    description: str


class ReportFilters(BaseModel):
    """Filters for generating custom reports."""
    start_date: date
    end_date: date
    selected_metrics: List[str] = Field(default_factory=list)


class PDFExportRequest(BaseModel):
    """Request for PDF export."""
    start_date: date
    end_date: date
    selected_metrics: List[str] = Field(default_factory=list)
    include_charts: bool = True
    include_forecast: bool = False


class PDFExportResponse(BaseModel):
    """Response containing PDF export."""
    filename: str
    content: str  # Base64 encoded PDF


class CostForecast(BaseModel):
    """Cost forecast data."""
    forecast_days: int
    predicted_costs: List[dict] = Field(default_factory=list)
    confidence: float = 0.0
    trends: List[dict] = Field(default_factory=list)
