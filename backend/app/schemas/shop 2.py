"""Schemas for virtual shop operations."""
from __future__ import annotations

from pydantic import BaseModel, Field


class ShopItem(BaseModel):
    id: str
    name: str
    price: float = Field(..., ge=0)
    currency: str = Field(default="coins", max_length=16)


class PurchaseRequest(BaseModel):
    item_id: str
    quantity: int = Field(default=1, ge=1)
