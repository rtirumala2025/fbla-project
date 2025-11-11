"""
Profile service functions built on SQLAlchemy.
"""

from __future__ import annotations

from typing import Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.profile import Profile, UserPreferences
from app.schemas.profile import Preferences, ProfileCreate, ProfileResponse, ProfileUpdate


class ProfileNotFoundError(ValueError):
    """Raised when profile records are not present for the given user."""


async def _coerce_user_id(user_id: UUID | str) -> UUID:
    if isinstance(user_id, UUID):
        return user_id
    return UUID(user_id)


async def _fetch_profile(session: AsyncSession, user_id: UUID | str) -> Optional[Profile]:
    uuid = await _coerce_user_id(user_id)
    stmt = (
        select(Profile)
        .options(selectinload(Profile.preferences))
        .where(Profile.user_id == uuid)
    )
    result = await session.execute(stmt)
    return result.scalar_one_or_none()


def _as_preferences(model: Optional[UserPreferences]) -> Preferences:
    if model is None:
        return Preferences()
    return Preferences(
        sound=model.sound,
        music=model.music,
        notifications=model.notifications,
        reduced_motion=model.reduced_motion,
        high_contrast=model.high_contrast,
    )


def _to_response(profile: Profile) -> ProfileResponse:
    return ProfileResponse(
        user_id=str(profile.user_id),
        username=profile.username,
        avatar_url=profile.avatar_url,
        title=profile.title,
        bio=profile.bio,
    badges=list(profile.badges or []),
        coins=profile.coins,
        created_at=profile.created_at,
        updated_at=profile.updated_at,
        preferences=_as_preferences(profile.preferences),
    )


async def get_profile(session: AsyncSession, user_id: UUID | str) -> Optional[ProfileResponse]:
    profile = await _fetch_profile(session, user_id)
    if profile is None:
        return None
    return _to_response(profile)


async def create_profile(session: AsyncSession, user_id: UUID | str, payload: ProfileCreate) -> ProfileResponse:
    uuid = await _coerce_user_id(user_id)
    profile = await _fetch_profile(session, uuid)

    if profile is None:
        profile = Profile(
            user_id=uuid,
            username=payload.username,
            avatar_url=payload.avatar_url,
            title=payload.title,
            bio=payload.bio,
        )
        session.add(profile)
    else:
        profile.username = payload.username
        profile.avatar_url = payload.avatar_url
        profile.title = payload.title
        profile.bio = payload.bio
        if payload.badges is not None:
            profile.badges = payload.badges
    if payload.badges is not None:
        profile.badges = payload.badges

    if payload.preferences is not None:
        prefs = profile.preferences or UserPreferences(user_id=uuid)
        prefs.sound = payload.preferences.sound
        prefs.music = payload.preferences.music
        prefs.notifications = payload.preferences.notifications
        prefs.reduced_motion = payload.preferences.reduced_motion
        prefs.high_contrast = payload.preferences.high_contrast
        profile.preferences = prefs

    await session.flush()
    await session.refresh(profile)
    return _to_response(profile)


async def update_profile(session: AsyncSession, user_id: UUID | str, payload: ProfileUpdate) -> ProfileResponse:
    profile = await _fetch_profile(session, user_id)
    if profile is None:
        raise ProfileNotFoundError("Profile not found.")

    if payload.username is not None:
        profile.username = payload.username
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url
    if payload.title is not None:
        profile.title = payload.title
    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.coins is not None:
        profile.coins = payload.coins
    if payload.badges is not None:
        profile.badges = payload.badges

    if payload.preferences is not None:
        prefs = profile.preferences or UserPreferences(user_id=profile.user_id)
        prefs.sound = payload.preferences.sound
        prefs.music = payload.preferences.music
        prefs.notifications = payload.preferences.notifications
        prefs.reduced_motion = payload.preferences.reduced_motion
        prefs.high_contrast = payload.preferences.high_contrast
        profile.preferences = prefs

    await session.flush()
    await session.refresh(profile)
    return _to_response(profile)


async def delete_profile(session: AsyncSession, user_id: UUID | str) -> None:
    profile = await _fetch_profile(session, user_id)
    if profile is None:
        raise ProfileNotFoundError("Profile not found.")
    await session.delete(profile)


async def set_avatar_url(session: AsyncSession, user_id: UUID | str, avatar_url: str) -> ProfileResponse:
    profile = await _fetch_profile(session, user_id)
    if profile is None:
        raise ProfileNotFoundError("Profile not found.")
    profile.avatar_url = avatar_url
    await session.flush()
    await session.refresh(profile)
    return _to_response(profile)


