"""Service layer for quest system operations."""
from __future__ import annotations

import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional

from asyncpg import Pool
from fastapi import HTTPException, status

from app.models.quest import Quest, QuestDifficulty as ModelQuestDifficulty, QuestStatus as ModelQuestStatus, QuestType as ModelQuestType, UserQuest
from app.schemas.quest import (
    ActiveQuestsResponse,
    DailyQuestsResponse,
    QuestClaimResponse,
    QuestCompletionResponse,
    QuestResponse,
    QuestReward,
    QuestDifficulty,
    QuestStatus,
    QuestType,
)

logger = logging.getLogger(__name__)


class QuestService:
    """Handles quest operations: listing, progress tracking, completion, and rewards."""

    def __init__(self, pool: Optional[Pool] = None) -> None:
        self._pool = pool

    async def _require_pool(self) -> Pool:
        if self._pool is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Database connection is not configured.",
            )
        return self._pool

    async def get_active_quests(self, user_id: str) -> ActiveQuestsResponse:
        """Get all active quests for a user, grouped by type."""
        pool = await self._require_pool()
        now = datetime.now(timezone.utc)

        async with pool.acquire() as conn:
            # Fetch all active quests
            quest_rows = await conn.fetch(
                """
                SELECT 
                    id, quest_key, description, quest_type, difficulty,
                    rewards, target_value, icon, start_at, end_at,
                    created_at, updated_at
                FROM quests
                WHERE 
                    (start_at IS NULL OR start_at <= $1)
                    AND (end_at IS NULL OR end_at >= $1)
                ORDER BY quest_type, difficulty, created_at
                """,
                now,
            )

            # Fetch user's quest progress
            user_quest_rows = await conn.fetch(
                """
                SELECT 
                    id, quest_id, status, progress, target_value,
                    last_progress_at, completed_at, claimed_at,
                    created_at, updated_at
                FROM user_quests
                WHERE user_id = $1
                """,
                user_id,
            )

            # Build a map of quest_id -> user_quest
            user_quest_map = {row["quest_id"]: row for row in user_quest_rows}

            daily_quests: List[QuestResponse] = []
            weekly_quests: List[QuestResponse] = []
            event_quests: List[QuestResponse] = []

            for quest_row in quest_rows:
                # Initialize user quest if it doesn't exist
                user_quest_row = user_quest_map.get(quest_row["id"])
                if user_quest_row is None:
                    # Create new user_quest entry
                    user_quest_row = await self._initialize_user_quest(conn, user_id, quest_row["id"], quest_row["target_value"])
                    user_quest_map[quest_row["id"]] = user_quest_row

                # Parse rewards
                rewards_data = quest_row["rewards"] if isinstance(quest_row["rewards"], dict) else {}
                rewards = QuestReward(
                    coins=rewards_data.get("coins", 0),
                    xp=rewards_data.get("xp", 0),
                    items=rewards_data.get("items", []),
                )

                quest_response = QuestResponse(
                    id=str(quest_row["id"]),
                    quest_key=quest_row["quest_key"],
                    description=quest_row["description"],
                    quest_type=QuestType(quest_row["quest_type"]),  # type: ignore[arg-type]
                    difficulty=QuestDifficulty(quest_row["difficulty"]),  # type: ignore[arg-type]
                    rewards=rewards,
                    target_value=quest_row["target_value"],
                    icon=quest_row.get("icon"),
                    start_at=quest_row.get("start_at"),
                    end_at=quest_row.get("end_at"),
                    progress=user_quest_row["progress"],
                    status=QuestStatus(user_quest_row["status"]),  # type: ignore[arg-type]
                )

                # Group by type
                quest_type = quest_response.quest_type
                if quest_type == QuestType.DAILY:
                    daily_quests.append(quest_response)
                elif quest_type == QuestType.WEEKLY:
                    weekly_quests.append(quest_response)
                elif quest_type == QuestType.EVENT:
                    event_quests.append(quest_response)

            return ActiveQuestsResponse(
                daily=daily_quests,
                weekly=weekly_quests,
                event=event_quests,
                refreshed_at=now,
            )

    async def get_daily_quests(self, user_id: str) -> DailyQuestsResponse:
        """Get only daily quests with reset time information."""
        active_quests = await self.get_active_quests(user_id)
        
        # Calculate next reset time (midnight UTC)
        now = datetime.now(timezone.utc)
        tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        
        return DailyQuestsResponse(
            daily=active_quests.daily,
            refreshed_at=active_quests.refreshed_at,
            next_reset_at=tomorrow,
        )

    async def _initialize_user_quest(self, conn, user_id: str, quest_id: str, target_value: int) -> Dict[str, Any]:
        """Initialize a user_quest record if it doesn't exist."""
        row = await conn.fetchrow(
            """
            INSERT INTO user_quests (user_id, quest_id, status, progress, target_value)
            VALUES ($1, $2, 'pending', 0, $3)
            ON CONFLICT (user_id, quest_id)
            DO UPDATE SET updated_at = NOW()
            RETURNING id, quest_id, status, progress, target_value,
                      last_progress_at, completed_at, claimed_at,
                      created_at, updated_at
            """,
            user_id,
            quest_id,
            target_value,
        )
        return row

    async def update_progress(
        self,
        user_id: str,
        quest_key: str,
        amount: int = 1,
    ) -> Optional[UserQuest]:
        """Update progress on a quest by quest_key (for integration with pet actions)."""
        pool = await self._require_pool()

        async with pool.acquire() as conn:
            async with conn.transaction():
                # Find quest by key
                quest_row = await conn.fetchrow(
                    """
                    SELECT id, target_value
                    FROM quests
                    WHERE quest_key = $1
                    """,
                    quest_key,
                )

                if not quest_row:
                    logger.warning(f"Quest with key '{quest_key}' not found")
                    return None

                quest_id = quest_row["id"]
                target_value = quest_row["target_value"]

                # Get or create user_quest
                user_quest_row = await conn.fetchrow(
                    """
                    SELECT id, status, progress, target_value
                    FROM user_quests
                    WHERE user_id = $1 AND quest_id = $2
                    """,
                    user_id,
                    quest_id,
                )

                if not user_quest_row:
                    # Initialize user quest
                    user_quest_row = await self._initialize_user_quest(conn, user_id, quest_id, target_value)

                # Skip if already completed or claimed
                current_status = user_quest_row["status"]
                if current_status in (QuestStatus.COMPLETED.value, QuestStatus.CLAIMED.value):
                    return None

                # Update progress
                new_progress = min(user_quest_row["progress"] + amount, target_value)
                new_status = QuestStatus.IN_PROGRESS.value

                # Check if quest is now complete
                if new_progress >= target_value:
                    new_progress = target_value
                    new_status = QuestStatus.COMPLETED.value
                    completed_at = datetime.now(timezone.utc)
                else:
                    completed_at = None

                await conn.execute(
                    """
                    UPDATE user_quests
                    SET 
                        progress = $1,
                        status = $2,
                        last_progress_at = NOW(),
                        completed_at = $3,
                        updated_at = NOW()
                    WHERE user_id = $4 AND quest_id = $5
                    """,
                    new_progress,
                    new_status,
                    completed_at,
                    user_id,
                    quest_id,
                )

                # Fetch updated user_quest
                updated_row = await conn.fetchrow(
                    """
                    SELECT 
                        id, user_id, quest_id, status, progress, target_value,
                        last_progress_at, completed_at, claimed_at,
                        created_at, updated_at
                    FROM user_quests
                    WHERE user_id = $1 AND quest_id = $2
                    """,
                    user_id,
                    quest_id,
                )

                return self._row_to_user_quest(updated_row)

    async def complete_quest(self, user_id: str, quest_id: str) -> QuestCompletionResponse:
        """Mark a quest as completed and award rewards."""
        pool = await self._require_pool()

        async with pool.acquire() as conn:
            async with conn.transaction():
                # Get quest details
                quest_row = await conn.fetchrow(
                    """
                    SELECT id, quest_key, description, quest_type, difficulty,
                           rewards, target_value, icon
                    FROM quests
                    WHERE id = $1::uuid
                    """,
                    quest_id,
                )

                if not quest_row:
                    raise HTTPException(
                        status.HTTP_404_NOT_FOUND,
                        f"Quest '{quest_id}' not found.",
                    )

                # Get user quest progress
                user_quest_row = await conn.fetchrow(
                    """
                    SELECT id, status, progress, target_value
                    FROM user_quests
                    WHERE user_id = $1 AND quest_id = $2::uuid
                    """,
                    user_id,
                    quest_id,
                )

                if not user_quest_row:
                    raise HTTPException(
                        status.HTTP_404_NOT_FOUND,
                        f"Quest progress not found for user.",
                    )

                current_status = user_quest_row["status"]
                
                # Check if already completed
                if current_status == QuestStatus.COMPLETED.value:
                    raise HTTPException(
                        status.HTTP_409_CONFLICT,
                        "Quest is already completed. Use claim-reward to collect rewards.",
                    )

                if current_status == QuestStatus.CLAIMED.value:
                    raise HTTPException(
                        status.HTTP_409_CONFLICT,
                        "Quest rewards have already been claimed.",
                    )

                # Ensure quest is actually complete
                if user_quest_row["progress"] < user_quest_row["target_value"]:
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        f"Quest progress ({user_quest_row['progress']}/{user_quest_row['target_value']}) is insufficient to complete.",
                    )

                # Mark as completed
                await conn.execute(
                    """
                    UPDATE user_quests
                    SET 
                        status = 'completed',
                        completed_at = NOW(),
                        updated_at = NOW()
                    WHERE user_id = $1 AND quest_id = $2::uuid
                    """,
                    user_id,
                    quest_id,
                )

                # Parse rewards
                rewards_data = quest_row["rewards"] if isinstance(quest_row["rewards"], dict) else {}
                coins_awarded = rewards_data.get("coins", 0)
                xp_awarded = rewards_data.get("xp", 0)

                # Award coins (update profiles table)
                new_balance = None
                if coins_awarded > 0:
                    await conn.execute(
                        """
                        UPDATE profiles
                        SET coins = coins + $1, updated_at = NOW()
                        WHERE user_id = $2
                        RETURNING coins
                        """,
                        coins_awarded,
                        user_id,
                    )
                    balance_row = await conn.fetchrow(
                        """
                        SELECT coins FROM profiles WHERE user_id = $1
                        """,
                        user_id,
                    )
                    if balance_row:
                        new_balance = balance_row["coins"]

                # Award XP (update public_profiles or profiles if total_xp exists)
                total_xp = None
                if xp_awarded > 0:
                    # Try to update public_profiles first (has total_xp)
                    xp_result = await conn.execute(
                        """
                        UPDATE public_profiles
                        SET total_xp = COALESCE(total_xp, 0) + $1, updated_at = NOW()
                        WHERE user_id = $2
                        RETURNING total_xp
                        """,
                        xp_awarded,
                        user_id,
                    )
                    if xp_result == "UPDATE 0":
                        # public_profiles doesn't exist, check if profiles has total_xp
                        xp_row = await conn.fetchrow(
                            """
                            SELECT column_name
                            FROM information_schema.columns
                            WHERE table_schema = 'public' 
                            AND table_name = 'profiles'
                            AND column_name = 'total_xp'
                            """
                        )
                        if xp_row:
                            total_xp_row = await conn.fetchrow(
                                """
                                UPDATE profiles
                                SET total_xp = COALESCE(total_xp, 0) + $1, updated_at = NOW()
                                WHERE user_id = $2
                                RETURNING total_xp
                                """,
                                xp_awarded,
                                user_id,
                            )
                            if total_xp_row:
                                total_xp = total_xp_row["total_xp"]
                    else:
                        total_xp_row = await conn.fetchrow(
                            """
                            SELECT total_xp FROM public_profiles WHERE user_id = $1
                            """,
                            user_id,
                        )
                        if total_xp_row:
                            total_xp = total_xp_row["total_xp"]

                # Build quest response
                rewards = QuestReward(
                    coins=coins_awarded,
                    xp=xp_awarded,
                    items=rewards_data.get("items", []),
                )

                quest_response = QuestResponse(
                    id=str(quest_row["id"]),
                    quest_key=quest_row["quest_key"],
                    description=quest_row["description"],
                    quest_type=QuestType(quest_row["quest_type"]),  # type: ignore[arg-type]
                    difficulty=QuestDifficulty(quest_row["difficulty"]),  # type: ignore[arg-type]
                    rewards=rewards,
                    target_value=quest_row["target_value"],
                    icon=quest_row.get("icon"),
                    progress=user_quest_row["target_value"],
                    status=QuestStatus.COMPLETED,  # type: ignore[assignment]
                )

                return QuestCompletionResponse(
                    result={
                        "quest": quest_response.model_dump(),
                        "coins_awarded": coins_awarded,
                        "xp_awarded": xp_awarded,
                        "new_balance": new_balance,
                        "total_xp": total_xp,
                        "message": f"Quest completed! Received {coins_awarded} coins and {xp_awarded} XP.",
                    }
                )

    async def claim_reward(self, user_id: str, quest_id: str) -> QuestClaimResponse:
        """Claim rewards from a completed quest."""
        pool = await self._require_pool()

        async with pool.acquire() as conn:
            async with conn.transaction():
                # Get quest and user_quest
                quest_row = await conn.fetchrow(
                    """
                    SELECT id, quest_key, description, quest_type, difficulty,
                           rewards, target_value, icon
                    FROM quests
                    WHERE id = $1::uuid
                    """,
                    quest_id,
                )

                if not quest_row:
                    raise HTTPException(
                        status.HTTP_404_NOT_FOUND,
                        f"Quest '{quest_id}' not found.",
                    )

                user_quest_row = await conn.fetchrow(
                    """
                    SELECT id, status
                    FROM user_quests
                    WHERE user_id = $1 AND quest_id = $2::uuid
                    """,
                    user_id,
                    quest_id,
                )

                if not user_quest_row:
                    raise HTTPException(
                        status.HTTP_404_NOT_FOUND,
                        f"Quest progress not found for user.",
                    )

                current_status = user_quest_row["status"]

                if current_status != QuestStatus.COMPLETED.value:
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        f"Quest is not in 'completed' status. Current status: {current_status}",
                    )

                # Mark as claimed
                await conn.execute(
                    """
                    UPDATE user_quests
                    SET 
                        status = 'claimed',
                        claimed_at = NOW(),
                        updated_at = NOW()
                    WHERE user_id = $1 AND quest_id = $2::uuid
                    """,
                    user_id,
                    quest_id,
                )

                # Parse rewards
                rewards_data = quest_row["rewards"] if isinstance(quest_row["rewards"], dict) else {}
                coins_awarded = rewards_data.get("coins", 0)
                xp_awarded = rewards_data.get("xp", 0)

                # Awards are already given during completion, just return confirmation
                rewards = QuestReward(
                    coins=coins_awarded,
                    xp=xp_awarded,
                    items=rewards_data.get("items", []),
                )

                quest_response = QuestResponse(
                    id=str(quest_row["id"]),
                    quest_key=quest_row["quest_key"],
                    description=quest_row["description"],
                    quest_type=QuestType(quest_row["quest_type"]),  # type: ignore[arg-type]
                    difficulty=QuestDifficulty(quest_row["difficulty"]),  # type: ignore[arg-type]
                    rewards=rewards,
                    target_value=quest_row["target_value"],
                    icon=quest_row.get("icon"),
                    progress=quest_row["target_value"],
                    status=QuestStatus.CLAIMED,  # type: ignore[assignment]
                )

                return QuestClaimResponse(
                    result={
                        "quest": quest_response.model_dump(),
                        "coins_awarded": coins_awarded,
                        "xp_awarded": xp_awarded,
                        "message": "Rewards claimed successfully!",
                    }
                )

    async def reset_daily_quests(self, user_id: Optional[str] = None) -> int:
        """Reset daily quests for a user (or all users if user_id is None)."""
        pool = await self._require_pool()

        async with pool.acquire() as conn:
            if user_id:
                result = await conn.execute(
                    """
                    UPDATE user_quests
                    SET 
                        status = 'pending',
                        progress = 0,
                        last_progress_at = NULL,
                        completed_at = NULL,
                        claimed_at = NULL,
                        updated_at = NOW()
                    WHERE user_id = $1
                    AND quest_id IN (
                        SELECT id FROM quests WHERE quest_type = 'daily'
                    )
                    """,
                    user_id,
                )
            else:
                result = await conn.execute(
                    """
                    UPDATE user_quests
                    SET 
                        status = 'pending',
                        progress = 0,
                        last_progress_at = NULL,
                        completed_at = NULL,
                        claimed_at = NULL,
                        updated_at = NOW()
                    WHERE quest_id IN (
                        SELECT id FROM quests WHERE quest_type = 'daily'
                    )
                    """,
                )

            # Extract number of rows updated from result string like "UPDATE 5"
            try:
                return int(result.split()[-1])
            except (ValueError, IndexError):
                return 0

    def _row_to_user_quest(self, row: Dict[str, Any]) -> UserQuest:
        """Convert a database row to UserQuest domain model."""
        return UserQuest(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            quest_id=str(row["quest_id"]),
            status=QuestStatus(row["status"]),  # type: ignore[arg-type]
            progress=row["progress"],
            target_value=row["target_value"],
            last_progress_at=row.get("last_progress_at"),
            completed_at=row.get("completed_at"),
            claimed_at=row.get("claimed_at"),
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
        )
