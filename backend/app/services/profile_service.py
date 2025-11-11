"""Service layer for profile and user preference management."""
from __future__ import annotations

from typing import Optional

from asyncpg import Pool
from fastapi import HTTPException, status

from app.schemas import Preferences, ProfileCreate, ProfileResponse, ProfileUpdate


class ProfileService:
    def __init__(self, pool: Optional[Pool]) -> None:
        self._pool = pool

    def _require_pool(self) -> Pool:
        if self._pool is None:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database connection is not configured.")
        return self._pool

    async def get_profile(self, user_id: str) -> ProfileResponse | None:
        pool = self._require_pool()
        query = """
            SELECT p.user_id,
                   p.username,
                   p.avatar_url,
                   p.coins,
                   p.created_at,
                   p.updated_at,
                   COALESCE(jsonb_build_object(
                       'sound', pref.sound,
                       'music', pref.music,
                       'notifications', pref.notifications,
                       'reduced_motion', pref.reduced_motion,
                       'high_contrast', pref.high_contrast
                   ), '{}'::jsonb) AS preferences
            FROM profiles p
            LEFT JOIN user_preferences pref ON pref.user_id = p.user_id
            WHERE p.user_id = $1
        """
        async with pool.acquire() as connection:
            row = await connection.fetchrow(query, user_id)
        if not row:
            return None
        return self._row_to_response(row)

    async def create_profile(self, user_id: str, payload: ProfileCreate) -> ProfileResponse:
        pool = self._require_pool()
        async with pool.acquire() as connection:
            async with connection.transaction():
                row = await connection.fetchrow(
                    """
                    INSERT INTO profiles (user_id, username, avatar_url)
                    VALUES ($1, $2, $3)
                    ON CONFLICT (user_id)
                    DO UPDATE SET username = EXCLUDED.username, avatar_url = EXCLUDED.avatar_url
                    RETURNING user_id, username, avatar_url, coins, created_at, updated_at
                    """,
                    user_id,
                    payload.username,
                    payload.avatar_url,
                )
                if payload.preferences:
                    await self._upsert_preferences(connection, user_id, payload.preferences)
        profile = await self.get_profile(user_id)
        assert profile is not None
        return profile

    async def update_profile(self, user_id: str, payload: ProfileUpdate) -> ProfileResponse:
        pool = self._require_pool()
        async with pool.acquire() as connection:
            async with connection.transaction():
                if payload.username is not None:
                    await connection.execute(
                        """UPDATE profiles SET username = $2 WHERE user_id = $1""",
                        user_id,
                        payload.username,
                    )
                if payload.avatar_url is not None:
                    await connection.execute(
                        """UPDATE profiles SET avatar_url = $2 WHERE user_id = $1""",
                        user_id,
                        payload.avatar_url,
                    )
                if payload.coins is not None:
                    await connection.execute(
                        """UPDATE profiles SET coins = $2 WHERE user_id = $1""",
                        user_id,
                        payload.coins,
                    )
                if payload.preferences is not None:
                    await self._upsert_preferences(connection, user_id, payload.preferences)
        profile = await self.get_profile(user_id)
        if profile is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found.")
        return profile

    async def delete_profile(self, user_id: str) -> None:
        pool = self._require_pool()
        async with pool.acquire() as connection:
            async with connection.transaction():
                await connection.execute("DELETE FROM user_preferences WHERE user_id = $1", user_id)
                await connection.execute("DELETE FROM profiles WHERE user_id = $1", user_id)

    async def set_avatar_url(self, user_id: str, avatar_url: str) -> ProfileResponse:
        pool = self._require_pool()
        async with pool.acquire() as connection:
            await connection.execute("UPDATE profiles SET avatar_url = $2 WHERE user_id = $1", user_id, avatar_url)
        profile = await self.get_profile(user_id)
        if profile is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Profile not found.")
        return profile

    async def _upsert_preferences(self, connection, user_id: str, preferences: Preferences) -> None:
        await connection.execute(
            """
            INSERT INTO user_preferences (user_id, sound, music, notifications, reduced_motion, high_contrast)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (user_id)
            DO UPDATE SET
                sound = EXCLUDED.sound,
                music = EXCLUDED.music,
                notifications = EXCLUDED.notifications,
                reduced_motion = EXCLUDED.reduced_motion,
                high_contrast = EXCLUDED.high_contrast
            """,
            user_id,
            preferences.sound,
            preferences.music,
            preferences.notifications,
            preferences.reduced_motion,
            preferences.high_contrast,
        )

    def _row_to_response(self, row) -> ProfileResponse:
        prefs_data = row["preferences"] or {}
        prefs_dict = {
            "sound": prefs_data.get("sound", True),
            "music": prefs_data.get("music", True),
            "notifications": prefs_data.get("notifications", True),
            "reduced_motion": prefs_data.get("reduced_motion", False),
            "high_contrast": prefs_data.get("high_contrast", False),
        }
        return ProfileResponse(
            user_id=row["user_id"],
            username=row["username"],
            avatar_url=row["avatar_url"],
            coins=row["coins"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            preferences=Preferences(**prefs_dict),
        )
