"""Service layer for social features (friends, leaderboard, public profiles)."""
from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from asyncpg import Pool
from fastapi import HTTPException, status

from app.schemas.social import (
    AchievementBadge,
    FriendListEntry,
    FriendsListResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    PublicProfileSummary,
    PublicProfilesResponse,
)


class SocialService:
    """Orchestrates social features: friends, leaderboard, and public profiles."""

    def __init__(self, pool: Optional[Pool]) -> None:
        self._pool = pool

    def _require_pool(self) -> Pool:
        if self._pool is None:
            raise HTTPException(
                status.HTTP_503_SERVICE_UNAVAILABLE,
                "Database connection is not configured."
            )
        return self._pool

    async def list_friendships(self, user_id: str) -> FriendsListResponse:
        """List all friendships for a user, categorized by status."""
        pool = self._require_pool()
        
        async with pool.acquire() as connection:
            # Get all friendships where user is involved
            rows = await connection.fetch(
                """
                SELECT 
                    f.id,
                    f.user_id,
                    f.friend_id,
                    f.status,
                    f.requested_at,
                    f.responded_at,
                    CASE 
                        WHEN f.user_id = $1 THEN f.friend_id
                        ELSE f.user_id
                    END as counterpart_user_id,
                    CASE
                        WHEN f.status = 'accepted' THEN 'friend'
                        WHEN f.user_id = $1 THEN 'outgoing'
                        ELSE 'incoming'
                    END as direction
                FROM friends f
                WHERE f.user_id = $1 OR f.friend_id = $1
                ORDER BY f.requested_at DESC
                """,
                user_id
            )
            
            friends: List[FriendListEntry] = []
            pending_incoming: List[FriendListEntry] = []
            pending_outgoing: List[FriendListEntry] = []
            
            # Get profile data for all counterpart users
            counterpart_ids = [str(row['counterpart_user_id']) for row in rows]
            profiles_map = {}
            if counterpart_ids:
                profile_rows = await connection.fetch(
                    """
                    SELECT 
                        pp.id,
                        pp.user_id,
                        pp.pet_id,
                        pp.display_name,
                        pp.bio,
                        pp.achievements,
                        pp.total_xp,
                        pp.total_coins,
                        pp.is_visible
                    FROM public_profiles pp
                    WHERE pp.user_id = ANY($1::uuid[])
                    """,
                    counterpart_ids
                )
                for profile_row in profile_rows:
                    profiles_map[str(profile_row['user_id'])] = PublicProfileSummary(
                        id=str(profile_row['id']),
                        user_id=str(profile_row['user_id']),
                        pet_id=str(profile_row['pet_id']),
                        display_name=profile_row['display_name'],
                        bio=profile_row['bio'],
                        achievements=[
                            AchievementBadge(**ach) if isinstance(ach, dict) else AchievementBadge(name=str(ach))
                            for ach in (profile_row['achievements'] or [])
                        ],
                        total_xp=profile_row['total_xp'],
                        total_coins=profile_row['total_coins'],
                        is_visible=profile_row['is_visible'],
                    )
            
            # Categorize friendships
            for row in rows:
                counterpart_id = str(row['counterpart_user_id'])
                entry = FriendListEntry(
                    id=str(row['id']),
                    status=row['status'],
                    direction=row['direction'],
                    counterpart_user_id=counterpart_id,
                    requested_at=row['requested_at'].isoformat() if row['requested_at'] else '',
                    responded_at=row['responded_at'].isoformat() if row['responded_at'] else None,
                    profile=profiles_map.get(counterpart_id),
                )
                
                if row['status'] == 'accepted':
                    friends.append(entry)
                elif row['direction'] == 'incoming':
                    pending_incoming.append(entry)
                else:
                    pending_outgoing.append(entry)
            
            return FriendsListResponse(
                friends=friends,
                pending_incoming=pending_incoming,
                pending_outgoing=pending_outgoing,
                total_count=len(friends),
            )

    async def send_friend_request(self, user_id: str, friend_id: str) -> FriendsListResponse:
        """Send a friend request to another user."""
        if user_id == friend_id:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Cannot send friend request to yourself."
            )
        
        pool = self._require_pool()
        
        async with pool.acquire() as connection:
            async with connection.transaction():
                # Check if friendship already exists
                existing = await connection.fetchrow(
                    """
                    SELECT id, status
                    FROM friends
                    WHERE (user_id = $1 AND friend_id = $2)
                       OR (user_id = $2 AND friend_id = $1)
                    """,
                    user_id,
                    friend_id
                )
                
                if existing:
                    if existing['status'] == 'accepted':
                        raise HTTPException(
                            status.HTTP_400_BAD_REQUEST,
                            "Users are already friends."
                        )
                    elif existing['status'] == 'pending':
                        raise HTTPException(
                            status.HTTP_400_BAD_REQUEST,
                            "Friend request already pending."
                        )
                    # If declined, update to pending
                    await connection.execute(
                        """
                        UPDATE friends
                        SET status = 'pending',
                            requested_at = NOW(),
                            responded_at = NULL,
                            user_id = $1,
                            friend_id = $2
                        WHERE id = $3
                        """,
                        user_id,
                        friend_id,
                        existing['id']
                    )
                else:
                    # Create new friendship
                    await connection.execute(
                        """
                        INSERT INTO friends (user_id, friend_id, status, requested_at)
                        VALUES ($1, $2, 'pending', NOW())
                        ON CONFLICT (user_id, friend_id) DO NOTHING
                        """,
                        user_id,
                        friend_id
                    )
        
        return await self.list_friendships(user_id)

    async def respond_to_friend_request(
        self, user_id: str, request_id: str, action: str
    ) -> FriendsListResponse:
        """Accept or decline a friend request."""
        if action not in ['accept', 'decline']:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Action must be 'accept' or 'decline'."
            )
        
        pool = self._require_pool()
        
        async with pool.acquire() as connection:
            async with connection.transaction():
                # Get the friendship
                friendship = await connection.fetchrow(
                    """
                    SELECT id, user_id, friend_id, status
                    FROM friends
                    WHERE id = $1
                    """,
                    request_id
                )
                
                if not friendship:
                    raise HTTPException(
                        status.HTTP_404_NOT_FOUND,
                        "Friend request not found."
                    )
                
                # Verify user is the recipient
                if str(friendship['friend_id']) != user_id:
                    raise HTTPException(
                        status.HTTP_403_FORBIDDEN,
                        "You can only respond to requests sent to you."
                    )
                
                if friendship['status'] != 'pending':
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST,
                        "Friend request is not pending."
                    )
                
                # Update friendship status
                new_status = 'accepted' if action == 'accept' else 'declined'
                await connection.execute(
                    """
                    UPDATE friends
                    SET status = $1,
                        responded_at = NOW()
                    WHERE id = $2
                    """,
                    new_status,
                    request_id
                )
        
        return await self.list_friendships(user_id)

    async def fetch_public_profiles(
        self, user_id: str, search: Optional[str] = None, limit: int = 20
    ) -> PublicProfilesResponse:
        """Fetch public profiles with optional search."""
        pool = self._require_pool()
        
        async with pool.acquire() as connection:
            query = """
                SELECT 
                    pp.id,
                    pp.user_id,
                    pp.pet_id,
                    pp.display_name,
                    pp.bio,
                    pp.achievements,
                    pp.total_xp,
                    pp.total_coins,
                    pp.is_visible
                FROM public_profiles pp
                WHERE pp.is_visible = TRUE
            """
            params = []
            
            if search:
                query += " AND (pp.display_name ILIKE $1 OR pp.bio ILIKE $1)"
                params.append(f"%{search}%")
            
            query += " ORDER BY pp.total_xp DESC LIMIT $" + str(len(params) + 1)
            params.append(limit)
            
            rows = await connection.fetch(query, *params)
            
            profiles = []
            for row in rows:
                profiles.append(PublicProfileSummary(
                    id=str(row['id']),
                    user_id=str(row['user_id']),
                    pet_id=str(row['pet_id']),
                    display_name=row['display_name'],
                    bio=row['bio'],
                    achievements=[
                        AchievementBadge(**ach) if isinstance(ach, dict) else AchievementBadge(name=str(ach))
                        for ach in (row['achievements'] or [])
                    ],
                    total_xp=row['total_xp'],
                    total_coins=row['total_coins'],
                    is_visible=row['is_visible'],
                ))
            
            return PublicProfilesResponse(profiles=profiles)

    async def get_leaderboard(
        self, user_id: str, metric: str = 'xp', limit: int = 20
    ) -> LeaderboardResponse:
        """Get leaderboard for a specific metric."""
        if metric not in ['xp', 'coins', 'achievements']:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                "Metric must be 'xp', 'coins', or 'achievements'."
            )
        
        pool = self._require_pool()
        
        async with pool.acquire() as connection:
            # Determine metric column
            if metric == 'xp':
                metric_column = 'total_xp'
            elif metric == 'coins':
                metric_column = 'total_coins'
            else:  # achievements
                metric_column = "jsonb_array_length(achievements)"
            
            query = f"""
                SELECT 
                    pp.user_id,
                    pp.display_name,
                    pp.pet_id,
                    pp.total_xp,
                    pp.total_coins,
                    jsonb_array_length(COALESCE(pp.achievements, '[]'::jsonb)) as achievements_count,
                    {metric_column} as metric_value,
                    ROW_NUMBER() OVER (ORDER BY {metric_column} DESC) as rank
                FROM public_profiles pp
                WHERE pp.is_visible = TRUE
                ORDER BY {metric_column} DESC
                LIMIT $1
            """
            
            rows = await connection.fetch(query, limit)
            
            entries = []
            for row in rows:
                entries.append(LeaderboardEntry(
                    user_id=str(row['user_id']),
                    display_name=row['display_name'],
                    pet_id=str(row['pet_id']),
                    total_xp=row['total_xp'],
                    total_coins=row['total_coins'],
                    achievements_count=row['achievements_count'],
                    rank=row['rank'],
                    metric_value=row['metric_value'],
                ))
            
            return LeaderboardResponse(metric=metric, entries=entries)
