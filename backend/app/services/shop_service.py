"""Service layer for the in-app shop."""
from __future__ import annotations

import logging
from typing import List, Optional
from uuid import UUID

from asyncpg import Pool
from fastapi import HTTPException, status

from app.schemas import (
    InventoryItem,
    PurchaseLineItem,
    PurchaseRequest,
    PurchaseResponse,
    ShopItem,
    UseItemRequest,
    UseItemResponse,
)

logger = logging.getLogger(__name__)


# Item effect definitions
ITEM_EFFECTS: dict[str, dict[str, int]] = {
    "food": {"hunger": 20, "health": 5},
    "medicine": {"health": 30},
    "energy": {"energy": 40},
    "toy": {"happiness": 25},
}


class ShopService:
    """Handles shop operations: listing items, purchases, inventory, and item usage."""

    def __init__(self, pool: Optional[Pool] = None) -> None:
        self._pool = pool

    async def _require_pool(self) -> Pool:
        if self._pool is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Database connection is not configured.",
            )
        return self._pool

    async def list_items(self, user_id: Optional[str] = None) -> List[ShopItem]:
        """List all active shop items."""
        pool = await self._require_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    id::text,
                    sku,
                    name,
                    category,
                    price,
                    stock,
                    description,
                    emoji,
                    metadata
                FROM finance_shop_items
                WHERE is_active = TRUE
                ORDER BY category, name
                """
            )

            items = []
            for row in rows:
                # Get user's inventory quantity for this item
                user_quantity = 0
                if user_id:
                    inv_row = await conn.fetchrow(
                        """
                        SELECT quantity
                        FROM finance_inventory
                        WHERE user_id = $1 AND item_id = $2
                        """,
                        user_id,
                        row["sku"],
                    )
                    if inv_row:
                        user_quantity = inv_row["quantity"]

                # Calculate available stock (total stock minus user's inventory)
                available_stock = max(0, row["stock"] - user_quantity) if row["stock"] > 0 else 999

                items.append(
                    ShopItem(
                        id=str(row["id"]),
                        sku=row["sku"],
                        name=row["name"],
                        category=row["category"],
                        price=row["price"],
                        stock=available_stock,
                        description=row["description"],
                        emoji=row["emoji"],
                        metadata=row["metadata"] or {},
                    )
                )

            return items

    async def purchase_items(
        self, user_id: str, payload: PurchaseRequest
    ) -> PurchaseResponse:
        """Process a purchase: validate, deduct coins, add to inventory."""
        pool = await self._require_pool()

        async with pool.acquire() as conn:
            async with conn.transaction():
                # Get user's wallet
                wallet = await conn.fetchrow(
                    """
                    SELECT id, balance, currency
                    FROM finance_wallets
                    WHERE user_id = $1
                    """,
                    user_id,
                )

                if not wallet:
                    raise HTTPException(
                        status.HTTP_404_NOT_FOUND,
                        "Wallet not found. Please initialize your wallet first.",
                    )

                wallet_id = wallet["id"]
                current_balance = wallet["balance"] or 0

                # Validate items and calculate total cost
                total_cost = 0
                items_to_add = []
                validated_items = []

                for line_item in payload.items:
                    # Get shop item details
                    shop_item = await conn.fetchrow(
                        """
                        SELECT id, sku, name, category, price, stock, description, emoji, metadata
                        FROM finance_shop_items
                        WHERE (id::text = $1 OR sku = $1) AND is_active = TRUE
                        """,
                        line_item.item_id,
                    )

                    if not shop_item:
                        raise HTTPException(
                            status.HTTP_404_NOT_FOUND,
                            f"Item '{line_item.item_id}' not found or inactive.",
                        )

                    # Check stock
                    if shop_item["stock"] > 0:
                        # Get current inventory quantity
                        inv_row = await conn.fetchrow(
                            """
                            SELECT quantity
                            FROM finance_inventory
                            WHERE user_id = $1 AND item_id = $2
                            """,
                            user_id,
                            shop_item["sku"],
                        )
                        current_qty = inv_row["quantity"] if inv_row else 0
                        available = shop_item["stock"] - current_qty

                        if available < line_item.quantity:
                            raise HTTPException(
                                status.HTTP_400_BAD_REQUEST,
                                f"Insufficient stock for '{shop_item['name']}'. Available: {available}, Requested: {line_item.quantity}",
                            )

                    item_cost = shop_item["price"] * line_item.quantity
                    total_cost += item_cost

                    validated_items.append(
                        {
                            "shop_item": shop_item,
                            "line_item": line_item,
                            "cost": item_cost,
                        }
                    )

                # Check balance
                if current_balance < total_cost:
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        f"Insufficient funds. Balance: {current_balance}, Required: {total_cost}",
                    )

                # Deduct coins
                new_balance = current_balance - total_cost
                await conn.execute(
                    """
                    UPDATE finance_wallets
                    SET balance = $1, lifetime_spent = COALESCE(lifetime_spent, 0) + $2, updated_at = NOW()
                    WHERE id = $3
                    """,
                    new_balance,
                    total_cost,
                    wallet_id,
                )

                # Add items to inventory and record transactions
                items_added = []
                for item_data in validated_items:
                    shop_item = item_data["shop_item"]
                    line_item = item_data["line_item"]

                    # Upsert inventory (handle duplicates via UNIQUE constraint)
                    await conn.execute(
                        """
                        INSERT INTO finance_inventory (wallet_id, user_id, item_id, item_name, category, quantity, shop_item_id)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (user_id, item_id)
                        DO UPDATE SET
                            quantity = finance_inventory.quantity + $6,
                            updated_at = NOW()
                        """,
                        wallet_id,
                        user_id,
                        shop_item["sku"],
                        shop_item["name"],
                        shop_item["category"],
                        line_item.quantity,
                        shop_item["id"],
                    )

                    # Record transaction
                    await conn.execute(
                        """
                        INSERT INTO finance_transactions (
                            wallet_id, user_id, item_id, item_name, amount,
                            transaction_type, category, description, balance_after, related_shop_item_id
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                        """,
                        wallet_id,
                        user_id,
                        shop_item["sku"],
                        shop_item["name"],
                        -item_data["cost"],
                        "purchase",
                        shop_item["category"],
                        f"Purchased {line_item.quantity}x {shop_item['name']}",
                        new_balance,
                        shop_item["id"],
                    )

                    items_added.append(
                        {
                            "item_id": shop_item["sku"],
                            "item_name": shop_item["name"],
                            "quantity": line_item.quantity,
                        }
                    )

                return PurchaseResponse(
                    success=True,
                    new_balance=new_balance,
                    items_added=items_added,
                    message=f"Successfully purchased {len(items_added)} item(s).",
                )

    async def get_inventory(self, user_id: str) -> List[InventoryItem]:
        """Get user's inventory."""
        pool = await self._require_pool()
        async with pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT item_id, item_name, category, quantity, shop_item_id
                FROM finance_inventory
                WHERE user_id = $1 AND quantity > 0
                ORDER BY category, item_name
                """,
                user_id,
            )

            return [
                InventoryItem(
                    item_id=row["item_id"],
                    item_name=row["item_name"],
                    category=row["category"],
                    quantity=row["quantity"],
                    shop_item_id=str(row["shop_item_id"]) if row["shop_item_id"] else None,
                )
                for row in rows
            ]

    async def use_item(
        self, user_id: str, payload: UseItemRequest
    ) -> UseItemResponse:
        """Use an item from inventory and apply effects to pet."""
        pool = await self._require_pool()

        async with pool.acquire() as conn:
            async with conn.transaction():
                # Get inventory item
                inv_row = await conn.fetchrow(
                    """
                    SELECT item_id, item_name, category, quantity, shop_item_id
                    FROM finance_inventory
                    WHERE user_id = $1 AND item_id = $2
                    """,
                    user_id,
                    payload.item_id,
                )

                if not inv_row:
                    raise HTTPException(
                        status.HTTP_404_NOT_FOUND,
                        f"Item '{payload.item_id}' not found in inventory.",
                    )

                if inv_row["quantity"] < payload.quantity:
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        f"Insufficient quantity. Available: {inv_row['quantity']}, Requested: {payload.quantity}",
                    )

                # Get item effects
                category = inv_row["category"] or "general"
                effects = ITEM_EFFECTS.get(category, {})

                # Update inventory quantity
                new_quantity = inv_row["quantity"] - payload.quantity
                if new_quantity > 0:
                    await conn.execute(
                        """
                        UPDATE finance_inventory
                        SET quantity = $1, updated_at = NOW()
                        WHERE user_id = $2 AND item_id = $3
                        """,
                        new_quantity,
                        user_id,
                        payload.item_id,
                    )
                else:
                    await conn.execute(
                        """
                        DELETE FROM finance_inventory
                        WHERE user_id = $1 AND item_id = $2
                        """,
                        user_id,
                        payload.item_id,
                    )

                # Apply effects to pet if pet_id provided
                stat_updates = {}
                if payload.pet_id and effects:
                    # Get current pet stats
                    pet_row = await conn.fetchrow(
                        """
                        SELECT health, hunger, happiness, energy, hygiene
                        FROM pets
                        WHERE id = $1 AND user_id = $2
                        """,
                        payload.pet_id,
                        user_id,
                    )

                    if pet_row:
                        # Calculate new stats (clamp to 0-100)
                        updates = {}
                        for stat_name, effect_value in effects.items():
                            current_value = pet_row.get(stat_name, 0) or 0
                            # Apply effect for each quantity
                            new_value = current_value
                            for _ in range(payload.quantity):
                                new_value = min(100, new_value + effect_value)
                            updates[stat_name] = new_value
                            stat_updates[stat_name] = new_value - current_value

                        # Update pet stats
                        if updates:
                            set_clauses = [f"{k} = ${i+2}" for i, k in enumerate(updates.keys())]
                            await conn.execute(
                                f"""
                                UPDATE pets
                                SET {', '.join(set_clauses)}, updated_at = NOW()
                                WHERE id = $1 AND user_id = ${len(updates) + 2}
                                """,
                                payload.pet_id,
                                *updates.values(),
                                user_id,
                            )

                return UseItemResponse(
                    success=True,
                    remaining_quantity=new_quantity,
                    stat_updates=stat_updates,
                    message=f"Used {payload.quantity}x {inv_row['item_name']}.",
                )
