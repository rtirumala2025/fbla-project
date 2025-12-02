"""
Game Loop Service - Backend implementation
Processes game state updates server-side for consistency and reliability.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

from asyncpg import Pool
from fastapi import HTTPException, status

from app.models import AuthenticatedUser
from app.services.pet_service import PetService
from app.services.shop_service import ShopService


class GameLoopService:
    """Handles periodic game state updates server-side."""

    def __init__(
        self,
        pool: Optional[Pool],
        pet_service: Optional[PetService] = None,
        shop_service: Optional[ShopService] = None,
    ) -> None:
        self._pool = pool
        self._pet_service = pet_service
        self._shop_service = shop_service

    async def process_game_loop(
        self,
        user_id: str,
        last_run_time: Optional[datetime] = None,
    ) -> dict:
        """
        Process game loop updates for a user.
        
        Args:
            user_id: User ID to process
            last_run_time: Last time the game loop ran (optional, will use pet's updated_at if not provided)
        
        Returns:
            dict with updates applied
        """
        if self._pet_service is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Pet service is not configured."
            )

        # Get pet to determine last update time
        pet_response = await self._pet_service.get_pet(user_id)
        if pet_response is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found.")

        # Determine time elapsed
        if last_run_time is None:
            last_run_time = pet_response.updated_at

        now = datetime.utcnow()
        time_elapsed = (now - last_run_time).total_seconds() / 3600.0  # Convert to hours

        if time_elapsed < 0.01:  # Less than 36 seconds
            return {
                "status": "skipped",
                "reason": "insufficient_time_elapsed",
                "hours_elapsed": time_elapsed,
            }

        # Apply stat decay
        decay_updates = self._calculate_stat_decay(pet_response.stats, time_elapsed)

        # Award idle coins
        coins_awarded = await self._award_idle_coins(user_id, time_elapsed)

        # Update pet stats if there are changes
        if decay_updates:
            from app.schemas import PetUpdate

            update_payload = PetUpdate(**decay_updates)
            await self._pet_service.update_pet(user_id, update_payload)

        return {
            "status": "completed",
            "hours_elapsed": round(time_elapsed, 2),
            "stat_updates": decay_updates,
            "coins_awarded": coins_awarded,
            "processed_at": now.isoformat(),
        }

    def _calculate_stat_decay(
        self,
        current_stats: Any,
        hours_elapsed: float,
    ) -> dict:
        """
        Calculate stat decay based on time elapsed.
        
        Decay rates per hour:
        - Hunger: 5 points/hour
        - Happiness: 3 points/hour
        - Cleanliness: 2 points/hour
        - Energy: 4 points/hour
        - Health: 1 point/hour (only if other stats average < 30)
        """
        decay_rates = {
            "hunger": 5,
            "happiness": 3,
            "cleanliness": 2,
            "energy": 4,
            "health": 1,
        }

        updates = {}

        # Apply decay to hunger, happiness, cleanliness, energy
        for stat_name in ["hunger", "happiness", "cleanliness", "energy"]:
            current_value = getattr(current_stats, stat_name, 50)
            decay_amount = decay_rates[stat_name] * hours_elapsed
            new_value = max(0, min(100, current_value - decay_amount))

            if abs(new_value - current_value) >= 1:
                updates[stat_name] = int(new_value)

        # Health only decays if other stats are very low
        current_health = getattr(current_stats, "health", 100)
        avg_other_stats = (
            updates.get("hunger", getattr(current_stats, "hunger", 50))
            + updates.get("happiness", getattr(current_stats, "happiness", 50))
            + updates.get("cleanliness", getattr(current_stats, "cleanliness", 50))
            + updates.get("energy", getattr(current_stats, "energy", 50))
        ) / 4

        if avg_other_stats < 30:
            decay_amount = decay_rates["health"] * hours_elapsed
            new_health = max(0, min(100, current_health - decay_amount))
            if abs(new_health - current_health) >= 1:
                updates["health"] = int(new_health)

        return updates

    async def _award_idle_coins(
        self,
        user_id: str,
        hours_elapsed: float,
    ) -> int:
        """
        Award idle coins based on time elapsed.
        
        Rate: 10 coins per hour
        Max: 24 hours (240 coins max)
        """
        if self._pool is None:
            return 0

        # Cap idle hours to prevent abuse
        max_idle_hours = 24
        capped_hours = min(hours_elapsed, max_idle_hours)
        coins_per_hour = 10
        coins_to_award = int(capped_hours * coins_per_hour)

        if coins_to_award <= 0:
            return 0

        try:
            # Award coins by updating wallet balance
            pool = await self._require_pool()
            async with pool.acquire() as conn:
                # Get or create wallet
                wallet = await conn.fetchrow(
                    """
                    SELECT id, balance
                    FROM finance_wallets
                    WHERE user_id = $1
                    """,
                    user_id,
                )

                if not wallet:
                    # Create wallet if it doesn't exist
                    wallet_id = await conn.fetchval(
                        """
                        INSERT INTO finance_wallets (user_id, balance, currency)
                        VALUES ($1, $2, 'coins')
                        RETURNING id
                        """,
                        user_id,
                        coins_to_award,
                    )
                else:
                    wallet_id = wallet["id"]
                    new_balance = (wallet["balance"] or 0) + coins_to_award
                    await conn.execute(
                        """
                        UPDATE finance_wallets
                        SET balance = $1, updated_at = NOW()
                        WHERE id = $2
                        """,
                        new_balance,
                        wallet_id,
                    )

                # Record transaction
                await conn.execute(
                    """
                    INSERT INTO finance_transactions (
                        wallet_id, user_id, item_id, item_name, amount,
                        transaction_type, category, description, balance_after
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                    """,
                    wallet_id,
                    user_id,
                    "idle_reward",
                    f"Idle rewards ({capped_hours:.1f} hours)",
                    coins_to_award,
                    "reward",
                    "idle",
                    f"Idle rewards for {capped_hours:.1f} hours",
                    (wallet["balance"] if wallet else 0) + coins_to_award,
                )

            return coins_to_award
        except Exception as e:
            # Log error but don't fail the game loop
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error awarding idle coins: {e}")
            return 0

    async def _require_pool(self) -> Pool:
        if self._pool is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Database connection is not configured.",
            )
        return self._pool
