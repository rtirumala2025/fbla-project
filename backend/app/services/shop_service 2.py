"""Service layer for the in-app shop."""
from __future__ import annotations

from typing import List

from app.schemas import PurchaseRequest, ShopItem


class ShopService:
    async def list_items(self) -> List[ShopItem]:
        return [
            ShopItem(id="food_basic", name="Basic Food", price=5.0),
            ShopItem(id="toy_ball", name="Bouncy Ball", price=12.0),
        ]

    async def purchase_item(self, payload: PurchaseRequest) -> dict[str, str]:
        # Placeholder purchase acknowledgement.
        return {
            "status": "processed",
            "item_id": payload.item_id,
            "quantity": str(payload.quantity),
        }
