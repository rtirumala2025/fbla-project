"""
Service layer for social graph interactions.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Iterable, Literal
from uuid import UUID

from sqlalchemy import and_, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.social import FriendStatus, Friendship, PublicProfile
from app.schemas.social import (
    FriendsListResponse,
    FriendListEntry,
    LeaderboardEntry,
    LeaderboardResponse,
    PublicProfileSummary,
)


class SocialServiceError(RuntimeError):
    """Base class for social service errors."""


class FriendRequestExistsError(SocialServiceError):
    """Raised when attempting to duplicate a friend request."""


class FriendRequestNotFoundError(SocialServiceError):
    """Raised when a friend request cannot be located."""


class FriendRequestPermissionError(SocialServiceError):
    """Raised when the current user cannot act on the request."""


def _ensure_uuid(value: UUID | str) -> UUID:
    return value if isinstance(value, UUID) else UUID(str(value))


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


async def _load_profiles(session: AsyncSession, user_ids: Iterable[UUID]) -> dict[UUID, PublicProfileSummary]:
    if not user_ids:
        return {}

    stmt = select(PublicProfile).where(PublicProfile.user_id.in_(set(user_ids)))
    result = await session.execute(stmt)
    profiles: dict[UUID, PublicProfileSummary] = {}
    for row in result.scalars():
        achievements = row.achievements or []
        profiles[row.user_id] = PublicProfileSummary(
            id=row.id,
            user_id=row.user_id,
            pet_id=row.pet_id,
            display_name=row.display_name,
            bio=row.bio,
            achievements=achievements,
            total_xp=row.total_xp,
            total_coins=row.total_coins,
            is_visible=row.is_visible,
        )
    return profiles


async def list_friendships(session: AsyncSession, user_id: UUID | str) -> FriendsListResponse:
    user_uuid = _ensure_uuid(user_id)
    stmt = select(Friendship).where(
        or_(Friendship.user_id == user_uuid, Friendship.friend_id == user_uuid)
    )
    result = await session.execute(stmt)
    records = result.scalars().all()

    counterpart_ids: set[UUID] = set()
    entries: list[FriendListEntry] = []

    for record in records:
        if record.user_id == user_uuid and record.status == FriendStatus.PENDING:
            direction: Literal["incoming", "outgoing", "friend"] = "outgoing"
            counterpart = record.friend_id
        elif record.friend_id == user_uuid and record.status == FriendStatus.PENDING:
            direction = "incoming"
            counterpart = record.user_id
        else:
            direction = "friend"
            counterpart = record.friend_id if record.user_id == user_uuid else record.user_id

        counterpart_ids.add(counterpart)
        entries.append(
            FriendListEntry(
                id=record.id,
                status=record.status,
                direction=direction,
                counterpart_user_id=counterpart,
                requested_at=record.requested_at,
                responded_at=record.responded_at,
            )
        )

    profiles = await _load_profiles(session, counterpart_ids)

    enriched_entries: list[FriendListEntry] = []
    for entry in entries:
        entry_data = entry.dict(exclude={"profile"})
        enriched_entries.append(
            FriendListEntry(
                **entry_data,
                profile=profiles.get(entry.counterpart_user_id),
            )
        )

    friends = [entry for entry in enriched_entries if entry.status == FriendStatus.ACCEPTED]
    incoming = [
        entry for entry in enriched_entries if entry.direction == "incoming" and entry.status == FriendStatus.PENDING
    ]
    outgoing = [
        entry for entry in enriched_entries if entry.direction == "outgoing" and entry.status == FriendStatus.PENDING
    ]

    return FriendsListResponse(
        friends=friends,
        pending_incoming=incoming,
        pending_outgoing=outgoing,
        total_count=len(enriched_entries),
    )


async def send_friend_request(session: AsyncSession, user_id: UUID | str, friend_id: UUID | str) -> FriendListEntry:
    requester = _ensure_uuid(user_id)
    recipient = _ensure_uuid(friend_id)

    if requester == recipient:
        raise FriendRequestExistsError("Cannot befriend yourself.")

    async with session.begin_nested():
        stmt_existing = select(Friendship).where(
            or_(
                and_(Friendship.user_id == requester, Friendship.friend_id == recipient),
                and_(Friendship.user_id == recipient, Friendship.friend_id == requester),
            )
        )
        result = await session.execute(stmt_existing)
        existing = result.scalars().first()

        if existing:
            if existing.status == FriendStatus.ACCEPTED:
                raise FriendRequestExistsError("You are already friends.")

            if existing.user_id == requester and existing.friend_id == recipient:
                if existing.status == FriendStatus.PENDING:
                    raise FriendRequestExistsError("Friend request already pending.")
                existing.status = FriendStatus.PENDING
                existing.requested_at = _now()
                existing.responded_at = None
                record = existing
            elif existing.user_id == recipient and existing.friend_id == requester and existing.status == FriendStatus.PENDING:
                existing.status = FriendStatus.ACCEPTED
                existing.responded_at = _now()
                record = existing
            else:
                raise FriendRequestExistsError("Friend request already exists.")
        else:
            record = Friendship(
                user_id=requester,
                friend_id=recipient,
                status=FriendStatus.PENDING,
                requested_at=_now(),
            )
            session.add(record)

        try:
            await session.flush()
        except IntegrityError as exc:
            raise FriendRequestExistsError("Could not create friend request.") from exc

    direction: Literal["incoming", "outgoing", "friend"]
    counterpart: UUID

    if record.status == FriendStatus.ACCEPTED:
        direction = "friend"
        counterpart = record.friend_id if record.user_id == requester else record.user_id
    else:
        if record.user_id == requester:
            direction = "outgoing"
            counterpart = record.friend_id
        else:
            direction = "friend" if record.status == FriendStatus.ACCEPTED else "incoming"
            counterpart = record.user_id

    profile_map = await _load_profiles(session, [counterpart])
    return FriendListEntry(
        id=record.id,
        status=record.status,
        direction=direction,
        counterpart_user_id=counterpart,
        requested_at=record.requested_at,
        responded_at=record.responded_at,
        profile=profile_map.get(counterpart),
    )


async def respond_to_friend_request(
    session: AsyncSession, request_id: UUID | str, responder_id: UUID | str, action: Literal["accept", "decline"]
) -> FriendListEntry:
    request_uuid = _ensure_uuid(request_id)
    responder_uuid = _ensure_uuid(responder_id)

    stmt = select(Friendship).where(Friendship.id == request_uuid)
    result = await session.execute(stmt)
    record = result.scalar_one_or_none()
    if record is None:
        raise FriendRequestNotFoundError("Friend request not found.")

    if record.friend_id != responder_uuid:
        raise FriendRequestPermissionError("Only the recipient can respond to this request.")

    if record.status != FriendStatus.PENDING:
        raise FriendRequestExistsError("Request already resolved.")

    record.status = FriendStatus.ACCEPTED if action == "accept" else FriendStatus.DECLINED
    record.responded_at = _now()
    await session.flush()

    direction: Literal["incoming", "outgoing", "friend"]
    counterpart = record.user_id
    direction = "friend" if record.status == FriendStatus.ACCEPTED else "incoming"

    profile_map = await _load_profiles(session, [counterpart])
    return FriendListEntry(
        id=record.id,
        status=record.status,
        direction=direction,
        counterpart_user_id=counterpart,
        requested_at=record.requested_at,
        responded_at=record.responded_at,
        profile=profile_map.get(counterpart),
    )


async def fetch_public_profiles(
    session: AsyncSession,
    current_user_id: UUID | str | None,
    search: str | None = None,
    limit: int = 20,
) -> list[PublicProfileSummary]:
    current_uuid = _ensure_uuid(current_user_id) if current_user_id else None

    if search:
        query = select(PublicProfile).where(
            PublicProfile.is_visible.is_(True),
            PublicProfile.display_name.ilike(f"%{search}%"),
        ).order_by(PublicProfile.total_xp.desc()).limit(limit)
    else:
        query = (
            select(PublicProfile)
            .where(PublicProfile.is_visible.is_(True))
            .order_by(PublicProfile.total_xp.desc())
            .limit(limit)
        )

    result = await session.execute(query)
    records = list(result.scalars())

    if current_uuid:
        own_stmt = select(PublicProfile).where(PublicProfile.user_id == current_uuid)
        own_result = await session.execute(own_stmt)
        own_profile = own_result.scalar_one_or_none()
        if own_profile and own_profile not in records:
            records.insert(0, own_profile)

    summaries: list[PublicProfileSummary] = []
    seen: set[UUID] = set()
    for profile in records:
        if profile.user_id in seen:
            continue
        seen.add(profile.user_id)
        summaries.append(
            PublicProfileSummary(
                id=profile.id,
                user_id=profile.user_id,
                pet_id=profile.pet_id,
                display_name=profile.display_name,
                bio=profile.bio,
                achievements=profile.achievements or [],
                total_xp=profile.total_xp,
                total_coins=profile.total_coins,
                is_visible=profile.is_visible,
            )
        )
    return summaries[:limit]


async def fetch_leaderboard(
    session: AsyncSession,
    user_id: UUID | str,
    metric: Literal["xp", "coins", "achievements"] = "xp",
    limit: int = 20,
) -> LeaderboardResponse:
    user_uuid = _ensure_uuid(user_id)
    stmt = select(Friendship).where(
        or_(
            and_(Friendship.user_id == user_uuid, Friendship.status == FriendStatus.ACCEPTED),
            and_(Friendship.friend_id == user_uuid, Friendship.status == FriendStatus.ACCEPTED),
        )
    )
    result = await session.execute(stmt)
    friend_rows = result.scalars().all()
    friend_ids = {user_uuid}
    for row in friend_rows:
        friend_ids.add(row.user_id)
        friend_ids.add(row.friend_id)

    profiles_stmt = select(PublicProfile).where(PublicProfile.user_id.in_(friend_ids))
    profiles_result = await session.execute(profiles_stmt)
    profiles = profiles_result.scalars().all()

    def metric_value(profile: PublicProfile) -> int:
        if metric == "xp":
            return profile.total_xp
        if metric == "coins":
            return profile.total_coins
        return len(profile.achievements or [])

    sorted_profiles = sorted(
        profiles,
        key=lambda profile: (metric_value(profile), profile.total_xp, profile.total_coins),
        reverse=True,
    )[:limit]

    entries: list[LeaderboardEntry] = []
    for rank, profile in enumerate(sorted_profiles, start=1):
        entries.append(
            LeaderboardEntry(
                user_id=profile.user_id,
                display_name=profile.display_name,
                pet_id=profile.pet_id,
                total_xp=profile.total_xp,
                total_coins=profile.total_coins,
                achievements_count=len(profile.achievements or []),
                rank=rank,
                metric_value=metric_value(profile),
            )
        )

    return LeaderboardResponse(metric=metric, entries=entries)


