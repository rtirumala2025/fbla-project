"""
Pydantic schemas for finance endpoints and services.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator


class TransactionRecord(BaseModel):
    id: UUID
    amount: int
    transaction_type: str
    category: str
    description: Optional[str]
    created_at: datetime
    balance_after: Optional[int] = None
    related_goal_id: Optional[UUID] = None
    related_shop_item_id: Optional[UUID] = None


class InventoryEntry(BaseModel):
    item_id: str
    item_name: str
    category: Optional[str]
    quantity: int


class LeaderboardEntry(BaseModel):
    user_id: UUID
    balance: int
    care_score: int
    rank: int


class GoalSummary(BaseModel):
    id: UUID
    name: str
    target_amount: int
    current_amount: int
    status: str
    deadline: Optional[datetime]
    completed_at: Optional[datetime]
    progress_percent: float = Field(..., ge=0, le=100)


class ShopItemEntry(BaseModel):
    id: UUID
    sku: str
    name: str
    category: str
    price: int
    stock: int
    description: Optional[str] = None
    metadata: Optional[dict] = None


class FinanceSummary(BaseModel):
    currency: str
    balance: int
    donation_total: int
    lifetime_earned: int
    lifetime_spent: int
    income_today: int
    expenses_today: int
    budget_warning: Optional[str]
    recommendations: List[str] = Field(default_factory=list)
    notifications: List[str] = Field(default_factory=list)
    daily_allowance_available: bool = False
    allowance_amount: int = 0
    goals: List[GoalSummary] = Field(default_factory=list)
    transactions: List[TransactionRecord] = Field(default_factory=list)
    inventory: List[InventoryEntry] = Field(default_factory=list)
    leaderboard: List[LeaderboardEntry] = Field(default_factory=list)


class PurchaseItem(BaseModel):
    item_id: str = Field(..., min_length=1, max_length=120)
    quantity: int = Field(..., ge=1, le=25)


class PurchaseRequest(BaseModel):
    items: List[PurchaseItem]
    pet_id: Optional[UUID] = None

    @validator("items")
    def validate_items(cls, value: List[PurchaseItem]) -> List[PurchaseItem]:
        if not value:
            raise ValueError("At least one item is required for a purchase.")
        return value


class EarnRequest(BaseModel):
    amount: int = Field(..., ge=0)
    reason: str = Field(..., min_length=3, max_length=120)
    care_score: Optional[int] = Field(default=None, ge=0)


class GoalCreateRequest(BaseModel):
    name: str = Field(..., min_length=3, max_length=120)
    target_amount: int = Field(..., gt=0)
    deadline: Optional[datetime] = None


class GoalContributionRequest(BaseModel):
    amount: int = Field(..., gt=0)


class DonationRequest(BaseModel):
    recipient_id: UUID
    amount: int = Field(..., gt=0)
    message: Optional[str] = Field(default=None, max_length=200)


class FinanceResponse(BaseModel):
    summary: FinanceSummary

