"""Schemas for virtual shop operations."""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class ShopItem(BaseModel):
    id: str
    sku: str
    name: str
    category: str
    price: int = Field(..., ge=0)
    stock: int = Field(default=0, ge=0)
    description: Optional[str] = None
    emoji: Optional[str] = None
    metadata: Optional[dict] = None


class PurchaseLineItem(BaseModel):
    item_id: str
    quantity: int = Field(..., ge=1)


class PurchaseRequest(BaseModel):
    items: List[PurchaseLineItem]
    pet_id: Optional[UUID] = None


class PurchaseResponse(BaseModel):
    success: bool
    new_balance: int
    items_added: List[dict]
    message: str


class InventoryItem(BaseModel):
    item_id: str
    item_name: str
    category: Optional[str] = None
    quantity: int
    shop_item_id: Optional[UUID] = None


class UseItemRequest(BaseModel):
    item_id: str
    quantity: int = Field(default=1, ge=1)
    pet_id: Optional[UUID] = None


class UseItemResponse(BaseModel):
    success: bool
    remaining_quantity: int
    stat_updates: dict
    message: str
