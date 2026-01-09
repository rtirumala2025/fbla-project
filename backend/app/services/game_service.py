"""Service layer for game operations."""
from __future__ import annotations

import logging
from typing import Optional
from datetime import datetime, timezone

from asyncpg import Pool
from fastapi import HTTPException, status

from app.schemas.games import GameScoreResponse

logger = logging.getLogger(__name__)


# Reward configuration per game type
GAME_REWARDS = {
    "agility": {
        "coins_per_100_points": 10,
        "happiness_per_100_points": 5,
        "max_coins_per_game": 100,
        "max_happiness_per_game": 50,
    },
    "vet_reaction": {
        "coins_per_100_points": 8,
        "happiness_per_100_points": 3,
        "max_coins_per_game": 50,
        "max_happiness_per_game": 25,
    },
    "default": {
        "coins_per_100_points": 5,
        "happiness_per_100_points": 2,
        "max_coins_per_game": 50,
        "max_happiness_per_game": 25,
    },
}


class GameService:
    """Handles game score submission, rewards, and leaderboards."""

    def __init__(self, pool: Optional[Pool] = None) -> None:
        self._pool = pool

    async def _require_pool(self) -> Pool:
        if self._pool is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Database connection is not configured.",
            )
        return self._pool

    def calculate_rewards(self, score: int, game_type: str) -> tuple[int, int]:
        """Calculate coins and happiness earned for a score."""
        config = GAME_REWARDS.get(game_type, GAME_REWARDS["default"])
        
        # Calculate base rewards
        coins = (score // 100) * config["coins_per_100_points"]
        happiness = (score // 100) * config["happiness_per_100_points"]
        
        # Cap at maximum
        coins = min(coins, config["max_coins_per_game"])
        happiness = min(happiness, config["max_happiness_per_game"])
        
        return coins, happiness

    async def submit_score(
        self,
        user_id: str,
        game_type: str,
        score: int,
        difficulty: str = "normal",
        pet_id: Optional[str] = None,
    ) -> GameScoreResponse:
        """
        Submit a game score, award coins/happiness, and update leaderboard.
        
        Args:
            user_id: User's ID
            game_type: Type of game played
            score: Score achieved
            difficulty: Difficulty level
            pet_id: Optional pet ID to apply happiness to
            
        Returns:
            GameScoreResponse with rewards and leaderboard info
        """
        pool = await self._require_pool()
        
        # Calculate rewards
        coins_earned, happiness_gained = self.calculate_rewards(score, game_type)
        
        async with pool.acquire() as conn:
            async with conn.transaction():
                # 1. Record game session
                await conn.execute(
                    """
                    INSERT INTO game_sessions (
                        user_id, game_type, difficulty, score, 
                        coins_earned, happiness_gain, metadata
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    user_id,
                    game_type,
                    difficulty,
                    score,
                    coins_earned,
                    happiness_gained,
                    {"submitted_at": datetime.now(timezone.utc).isoformat()},
                )
                
                # 2. Award coins to wallet
                if coins_earned > 0:
                    # Get or create wallet
                    wallet = await conn.fetchrow(
                        """
                        SELECT id, balance
                        FROM finance_wallets
                        WHERE user_id = $1
                        """,
                        user_id,
                    )
                    
                    if wallet:
                        new_balance = (wallet["balance"] or 0) + coins_earned
                        await conn.execute(
                            """
                            UPDATE finance_wallets
                            SET balance = $1, 
                                lifetime_earned = COALESCE(lifetime_earned, 0) + $2,
                                updated_at = NOW()
                            WHERE id = $3
                            """,
                            new_balance,
                            coins_earned,
                            wallet["id"],
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
                            wallet["id"],
                            user_id,
                            f"game_{game_type}",
                            f"{game_type.replace('_', ' ').title()} Game Reward",
                            coins_earned,
                            "reward",
                            "game",
                            f"Earned {coins_earned} coins for score {score} in {game_type}",
                            new_balance,
                        )
                    else:
                        # Create wallet with initial coins
                        await conn.execute(
                            """
                            INSERT INTO finance_wallets (user_id, balance, lifetime_earned, currency)
                            VALUES ($1, $2, $2, 'coins')
                            """,
                            user_id,
                            coins_earned,
                        )
                
                # 3. Apply happiness to pet if pet_id provided
                if happiness_gained > 0 and pet_id:
                    await conn.execute(
                        """
                        UPDATE pets
                        SET happiness = LEAST(100, COALESCE(happiness, 50) + $1),
                            updated_at = NOW()
                        WHERE id = $2 AND user_id = $3
                        """,
                        happiness_gained,
                        pet_id,
                        user_id,
                    )
                
                # 4. Update leaderboard (upsert)
                old_best = await conn.fetchval(
                    """
                    SELECT best_score
                    FROM game_leaderboards
                    WHERE user_id = $1 AND game_type = $2
                    """,
                    user_id,
                    game_type,
                )
                
                new_best = old_best is None or score > old_best
                
                await conn.execute(
                    """
                    INSERT INTO game_leaderboards (
                        user_id, game_type, best_score, games_played, 
                        total_score, total_coins, total_happiness, 
                        average_score, last_played_at
                    )
                    VALUES ($1, $2, $3, 1, $3, $4, $5, $3::float, NOW())
                    ON CONFLICT (user_id, game_type)
                    DO UPDATE SET
                        best_score = GREATEST(game_leaderboards.best_score, $3),
                        games_played = game_leaderboards.games_played + 1,
                        total_score = game_leaderboards.total_score + $3,
                        total_coins = game_leaderboards.total_coins + $4,
                        total_happiness = game_leaderboards.total_happiness + $5,
                        average_score = (game_leaderboards.total_score + $3)::float / (game_leaderboards.games_played + 1),
                        last_played_at = NOW(),
                        updated_at = NOW()
                    """,
                    user_id,
                    game_type,
                    score,
                    coins_earned,
                    happiness_gained,
                )
                
                # 5. Get current leaderboard rank
                rank = await conn.fetchval(
                    """
                    SELECT rank FROM (
                        SELECT user_id, 
                               RANK() OVER (ORDER BY best_score DESC) as rank
                        FROM game_leaderboards
                        WHERE game_type = $1
                    ) ranked
                    WHERE user_id = $2
                    """,
                    game_type,
                    user_id,
                )
        
        message_parts = [f"Score: {score}"]
        if coins_earned > 0:
            message_parts.append(f"+{coins_earned} coins")
        if happiness_gained > 0:
            message_parts.append(f"+{happiness_gained} happiness")
        if new_best:
            message_parts.append("New personal best!")
        
        return GameScoreResponse(
            success=True,
            score=score,
            coins_earned=coins_earned,
            happiness_gained=happiness_gained,
            new_best=new_best,
            leaderboard_rank=rank,
            message=" | ".join(message_parts),
        )
