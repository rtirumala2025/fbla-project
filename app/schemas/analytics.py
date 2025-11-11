"""
Pydantic schemas for analytics and reporting endpoints.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class StatPoint(BaseModel):
    timestamp: datetime
    value: float


class TrendSeries(BaseModel):
    label: str
    points: List[StatPoint]


class ExpenseCategory(BaseModel):
    category: str
    total: float


class CareReport(BaseModel):
    date: date
    coins_earned: int
    coins_spent: int
    happiness_gain: int
    health_change: int
    games_played: int
    pet_actions: int


class WeeklySummary(BaseModel):
    start_date: date
    end_date: date
    reports: List[CareReport]


class SnapshotSummary(BaseModel):
    period: str
    start_date: date
    end_date: date
    coins_earned: int
    coins_spent: int
    net_coins: int
    avg_happiness: float
    avg_health: float
    avg_energy: float
    avg_cleanliness: float
    happiness_gain: int
    health_change: int
    games_played: int
    pet_actions: int
    ai_summary: Optional[str] = None


class SnapshotNotification(BaseModel):
    id: str
    period_type: str
    reference_date: date
    stat: Optional[str]
    change: float
    severity: str
    message: str
    is_read: bool
    created_at: datetime


class AnalyticsSnapshot(BaseModel):
    end_of_day: CareReport
    daily_summary: SnapshotSummary
    weekly_summary: SnapshotSummary
    monthly_summary: SnapshotSummary
    weekly_trend: TrendSeries
    monthly_trend: TrendSeries
    expenses: List[ExpenseCategory]
    health_progression: TrendSeries
    ai_insights: List[str] = Field(default_factory=list)
    notifications: List[SnapshotNotification] = Field(default_factory=list)


class AnalyticsCSVResponse(BaseModel):
    filename: str
    content: str

