"""
Integration tests for mini-game endpoints.
"""

from __future__ import annotations

import uuid

import pytest
from httpx import AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.jwt import create_access_token
from app.models.finance import Wallet
from app.models.game import GameAchievement, GameSession
from app.models.user import User, hash_password


def auth_headers(user_id: uuid.UUID) -> dict[str, str]:
    token = create_access_token(str(user_id))
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_game_round_lifecycle(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"games-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)

    start_payload = {
        "game_type": "reaction",
        "preferred_difficulty": "normal",
    }
    start_response = await client.post("/api/games/start", json=start_payload, headers=headers)
    assert start_response.status_code == 201, start_response.text
    start_data = start_response.json()
    assert start_data["game_type"] == "reaction"
    assert start_data["difficulty"] in ("easy", "normal", "hard")
    assert start_data["ai_profile"]["recommended_difficulty"] == start_data["difficulty"]

    submit_payload = {
        "session_id": start_data["session_id"],
        "score": 92,
        "duration_seconds": 25,
        "difficulty": "normal",
        "metadata": {"rounds": 3, "hits": 3},
    }

    response = await client.post("/api/games/submit-score", json=submit_payload, headers=headers)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["reward"]["coins"] > 0
    assert data["finance"]["balance"] >= data["reward"]["coins"]
    assert data["reward"]["streak_bonus"] >= 0
    assert data["daily_streak"] >= 1

    # Ensure session persisted
    session_stmt = select(GameSession).where(GameSession.user_id == user.id)
    result = await db_session.execute(session_stmt)
    session_record = result.scalar_one()
    assert session_record.score == submit_payload["score"]
    assert session_record.round_id is not None

    # Wallet should reflect earnings
    wallet_stmt = select(Wallet).where(Wallet.user_id == user.id)
    wallet_result = await db_session.execute(wallet_stmt)
    wallet = wallet_result.scalar_one()
    assert wallet.balance >= data["reward"]["coins"]

    # Achievements should unlock for high score
    achievement_stmt = select(GameAchievement).where(GameAchievement.user_id == user.id)
    achievement_result = await db_session.execute(achievement_stmt)
    achievements = achievement_result.scalars().all()
    assert achievements  # streak entry at minimum

    # Leaderboard endpoint
    leaderboard_response = await client.get("/api/games/leaderboard?game_type=reaction", headers=headers)
    assert leaderboard_response.status_code == 200
    leaderboard = leaderboard_response.json()
    assert len(leaderboard["entries"]) >= 1
    assert leaderboard["entries"][0]["best_score"] >= submit_payload["score"]

    # Rewards summary endpoint
    rewards_response = await client.get("/api/games/rewards?game_type=reaction", headers=headers)
    assert rewards_response.status_code == 200
    rewards_data = rewards_response.json()
    assert rewards_data["streak_days"] >= 1
    assert rewards_data["recent_rewards"]

    # Invalid score should fail
    invalid_start = await client.post("/api/games/start", json=start_payload, headers=headers)
    assert invalid_start.status_code == 201
    invalid_payload = {
        "session_id": invalid_start.json()["session_id"],
        "score": 120,
        "duration_seconds": 10,
        "difficulty": "hard",
    }
    invalid_response = await client.post("/api/games/submit-score", json=invalid_payload, headers=headers)
    assert invalid_response.status_code == 400

    await db_session.delete(wallet)
    await db_session.delete(session_record)
    for achievement in achievements:
        await db_session.delete(achievement)
    await db_session.delete(user)
    await db_session.commit()


@pytest.mark.asyncio
async def test_adaptive_difficulty_and_rewards_summary(client: AsyncClient, db_session: AsyncSession):
    user = User(email=f"adaptive-{uuid.uuid4()}@example.com", password_hash=hash_password("SecretPass1!"))
    db_session.add(user)
    await db_session.flush()

    headers = auth_headers(user.id)

    start_easy = await client.post("/api/games/start", json={"game_type": "memory"}, headers=headers)
    assert start_easy.status_code == 201
    assert start_easy.json()["difficulty"] in ("easy", "normal")

    submit_payload = {
        "session_id": start_easy.json()["session_id"],
        "score": 95,
        "duration_seconds": 18,
        "difficulty": "hard",
    }
    submit_response = await client.post("/api/games/submit-score", json=submit_payload, headers=headers)
    assert submit_response.status_code == 201
    body = submit_response.json()
    assert body["reward"]["coins"] >= 5
    assert body["reward"]["happiness"] >= body["reward"]["streak_bonus"]

    start_hard = await client.post("/api/games/start", json={"game_type": "memory"}, headers=headers)
    assert start_hard.status_code == 201
    assert start_hard.json()["difficulty"] == "hard"

    rewards_summary = await client.get("/api/games/rewards?game_type=memory", headers=headers)
    assert rewards_summary.status_code == 200
    summary_body = rewards_summary.json()
    assert summary_body["streak_days"] >= 1
    assert summary_body["recent_rewards"]

    leaderboard_response = await client.get("/api/games/leaderboard?game_type=memory", headers=headers)
    assert leaderboard_response.status_code == 200
    leaderboard_body = leaderboard_response.json()
    assert leaderboard_body["entries"][0]["average_score"] >= 90

    await db_session.execute(delete(GameSession).where(GameSession.user_id == user.id))
    await db_session.execute(delete(Wallet).where(Wallet.user_id == user.id))
    await db_session.execute(delete(GameAchievement).where(GameAchievement.user_id == user.id))
    await db_session.delete(user)
    await db_session.commit()

