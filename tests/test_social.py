"""
Integration tests for social layer endpoints.
"""

from __future__ import annotations

from datetime import date
import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.pet import Pet, SpeciesEnum
from app.models.social import FriendStatus, Friendship, PublicProfile
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_friend_request_lifecycle(client: AsyncClient, db_session: AsyncSession):
    """
    Verify sending, listing, and accepting friend requests.
    """

    user_a = User(email=f"alpha-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    user_b = User(email=f"beta-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add_all([user_a, user_b])
    await db_session.flush()

    headers_a = auth_headers(user_a.id)
    headers_b = auth_headers(user_b.id)

    send_response = await client.post(
        "/api/social/friends/request",
        json={"friend_id": str(user_b.id)},
        headers=headers_a,
    )
    assert send_response.status_code == 201, send_response.text
    data = send_response.json()
    assert data["pending_outgoing"]
    assert data["pending_outgoing"][0]["counterpart_user_id"] == str(user_b.id)

    list_b = await client.get("/api/social/friends", headers=headers_b)
    assert list_b.status_code == 200, list_b.text
    incoming = list_b.json()["pending_incoming"]
    assert incoming
    request_id = incoming[0]["id"]

    respond = await client.patch(
        "/api/social/friends/respond",
        json={"request_id": request_id, "action": "accept"},
        headers=headers_b,
    )
    assert respond.status_code == 200, respond.text
    friends_after = respond.json()["friends"]
    assert len(friends_after) == 1
    assert friends_after[0]["status"] == FriendStatus.ACCEPTED.value

    list_a = await client.get("/api/social/friends", headers=headers_a)
    assert list_a.status_code == 200
    assert list_a.json()["friends"][0]["counterpart_user_id"] == str(user_b.id)

    await db_session.execute(delete(Friendship).where(Friendship.user_id == user_a.id))
    await db_session.execute(delete(Friendship).where(Friendship.user_id == user_b.id))
    await db_session.execute(delete(User).where(User.id.in_([user_a.id, user_b.id])))
    await db_session.commit()


@pytest.mark.asyncio
async def test_social_leaderboard_and_public_profiles(client: AsyncClient, db_session: AsyncSession):
    """
    Ensure leaderboard and profile listing endpoints surface friend data.
    """

    user_a = User(email=f"leader-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    user_b = User(email=f"trailing-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add_all([user_a, user_b])
    await db_session.flush()

    pet_a = Pet(
        user_id=user_a.id,
        name="Nova",
        species=SpeciesEnum.CAT,
        breed="Siamese",
        color_pattern="Midnight",
        birthday=date(2022, 5, 1),
    )
    pet_b = Pet(
        user_id=user_b.id,
        name="Bolt",
        species=SpeciesEnum.DOG,
        breed="Beagle",
        color_pattern="Sunset",
        birthday=date(2021, 8, 15),
    )
    db_session.add_all([pet_a, pet_b])
    await db_session.flush()

    profile_a = PublicProfile(
        user_id=user_a.id,
        pet_id=pet_a.id,
        display_name="Nova & Co",
        bio="Galactic explorers.",
        achievements=[{"name": "Galaxy Tamer"}],
        total_xp=3500,
        total_coins=1200,
    )
    profile_b = PublicProfile(
        user_id=user_b.id,
        pet_id=pet_b.id,
        display_name="Bolt Brigade",
        bio="Speed runners unite.",
        achievements=[{"name": "Speedster"}, {"name": "Trailblazer"}],
        total_xp=2800,
        total_coins=900,
    )
    db_session.add_all([profile_a, profile_b])
    await db_session.flush()

    friendship = Friendship(
        user_id=user_a.id,
        friend_id=user_b.id,
        status=FriendStatus.ACCEPTED,
    )
    db_session.add(friendship)
    await db_session.commit()

    headers_a = auth_headers(user_a.id)

    profiles_resp = await client.get("/api/social/public_profiles", headers=headers_a)
    assert profiles_resp.status_code == 200, profiles_resp.text
    profiles_data = profiles_resp.json()["profiles"]
    ids = {item["user_id"] for item in profiles_data}
    assert str(user_a.id) in ids
    assert str(user_b.id) in ids

    leaderboard_resp = await client.get("/api/social/leaderboard?metric=xp", headers=headers_a)
    assert leaderboard_resp.status_code == 200, leaderboard_resp.text
    leaderboard_entries = leaderboard_resp.json()["entries"]
    assert leaderboard_entries
    assert leaderboard_entries[0]["metric_value"] >= leaderboard_entries[-1]["metric_value"]

    coins_resp = await client.get("/api/social/leaderboard?metric=coins", headers=headers_a)
    assert coins_resp.status_code == 200
    assert coins_resp.json()["metric"] == "coins"

    await db_session.execute(delete(Friendship).where(Friendship.id == friendship.id))
    await db_session.execute(delete(PublicProfile).where(PublicProfile.user_id.in_([user_a.id, user_b.id])))
    await db_session.execute(delete(Pet).where(Pet.user_id.in_([user_a.id, user_b.id])))
    await db_session.execute(delete(User).where(User.id.in_([user_a.id, user_b.id])))
    await db_session.commit()


