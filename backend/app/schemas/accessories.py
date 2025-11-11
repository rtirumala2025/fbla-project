"""Pydantic schemas for accessories and customization endpoints."""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class AccessorySchema(BaseModel):
    accessory_id: str = Field(..., description="Unique identifier for the accessory.")
    name: str
    type: str = Field(..., description="Category of accessory such as hat, collar, or outfit.")
    rarity: str = Field(..., description="Rarity tier (common, rare, legendary, etc.).")
    effects: Dict[str, object] = Field(default_factory=dict)
    color_palette: Dict[str, str] = Field(default_factory=dict, description="Mood → color mapping.")
    preview_url: Optional[str] = Field(default=None)


class EquippedAccessorySchema(BaseModel):
    accessory_id: str
    pet_id: Optional[str]
    user_id: str
    equipped: bool
    equipped_color: Optional[str] = None
    equipped_slot: Optional[str] = None
    updated_at: datetime


class AccessoryEquipRequest(BaseModel):
    accessory_id: str = Field(..., description="Accessory to equip or unequip.")
    pet_id: Optional[str] = Field(default=None, description="Pet receiving the accessory.")
    equipped: bool = Field(default=True, description="True to equip, false to unequip.")


class AccessoryEquipResponse(BaseModel):
    accessory_id: str
    pet_id: Optional[str]
    equipped: bool
    equipped_color: Optional[str] = None
    equipped_slot: Optional[str] = None
    applied_mood: Optional[str] = None
    updated_at: datetime


class AccessoryListResponse(BaseModel):
    accessories: List[AccessorySchema]

