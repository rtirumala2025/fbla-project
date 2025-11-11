"""Domain models for shop inventory."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ShopItem:
    id: str
    name: str
    price: float
    currency: str = "coins"
