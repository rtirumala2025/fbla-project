"""
Games service: handles mini-game lifecycle, adaptive difficulty, rewards, and leaderboards.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Iterable
from uuid import UUID

from sqlalchemy import Select, and_, desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.game import GameAchievement, GameLeaderboard, GameRound, GameSession
from app.models.pet import Pet
from app.schemas.finance import EarnRequest
from app.schemas.game import (
    AdaptiveDifficultyProfile,
    GameLeaderboardEntry,
    GamePlayResponse,
    GameReward,
    GameRewardHistory,
    GameRewardsResponse,
    GameScoreSubmission,
    GameStartRequest,
    GameStartResponse,
)
from app.services.finance_service import earn_coins

ACHIEVEMENT_THRESHOLDS = {
    "fetch_pro": {"game": "fetch", "score": 90},
    "memory_master": {"game": "memory", "score": 85},
    "puzzle_professor": {"game": "puzzle", "score": 95},
    "reaction_ace": {"game": "reaction", "score": 88},
    "clicker_champion": {"game": "clicker", "score": 82},
}

ROUND_TTL_MINUTES = 12
MAX_SCORE = 100
ALLOWED_DIFFICULTIES = ("easy", "normal", "hard")


class GameRuleError(ValueError):
    """Raised when an invalid game state or score is provided."""


def _now() -> datetime:
    return datetime.now(tz=timezone.utc)


def _ensure_aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _ensure_uuid(value: UUID | str) -> UUID:
    return value if isinstance(value, UUID) else UUID(value)


def _base_reward(score: int, difficulty: str) -> GameReward:
    diff_multiplier = 1.0
    if difficulty == "normal":
        diff_multiplier = 1.35
    elif difficulty == "hard":
        diff_multiplier = 1.75
    coins = max(5, int(score * 0.32 * diff_multiplier))
    happiness = min(40, int(score * 0.27 * diff_multiplier))
    return GameReward(coins=coins, happiness=happiness)


async def _get_or_create_leaderboard(
    session: AsyncSession,
    user_id: UUID,
    game_type: str,
    *,
    for_update: bool = False,
) -> GameLeaderboard:
    stmt = select(GameLeaderboard).where(
        GameLeaderboard.user_id == user_id,
        GameLeaderboard.game_type == game_type,
    )
    if for_update:
        stmt = stmt.with_for_update()
    result = await session.execute(stmt)
    record = result.scalar_one_or_none()
    if record is None:
        record = GameLeaderboard(
            user_id=user_id,
            game_type=game_type,
        )
        session.add(record)
        await session.flush()
    return record


async def _recent_scores(
    session: AsyncSession,
    user_id: UUID,
    game_type: str,
    limit: int = 5,
) -> list[int]:
    stmt = (
        select(GameSession.score)
        .where(GameSession.user_id == user_id, GameSession.game_type == game_type)
        .order_by(desc(GameSession.created_at))
        .limit(limit)
    )
    result = await session.execute(stmt)
    return [row[0] for row in result.all()]


def _calculate_skill_metrics(scores: Iterable[int]) -> tuple[float, float]:
    scores_list = list(scores)
    if not scores_list:
        return 45.0, 0.0
    recent_avg = sum(scores_list) / len(scores_list)
    best = max(scores_list)
    skill_rating = 0.65 * recent_avg + 0.35 * best
    return recent_avg, skill_rating


async def _fetch_pet_mood(session: AsyncSession, user_id: UUID) -> tuple[int | None, str | None]:
    stmt = select(Pet.happiness, Pet.mood).where(Pet.user_id == user_id)
    result = await session.execute(stmt)
    pet_row = result.first()
    if pet_row is None:
        return None, None
    happiness, mood = pet_row
    return happiness, mood


def _choose_difficulty(skill_rating: float, pet_happiness: int | None) -> str:
    if skill_rating >= 82:
        difficulty = "hard"
    elif skill_rating >= 55:
        difficulty = "normal"
    else:
        difficulty = "easy"

    if pet_happiness is not None:
        if pet_happiness < 40:
            difficulty = "easy"
        elif pet_happiness < 60 and difficulty == "hard":
            difficulty = "normal"
    return difficulty


async def _build_adaptive_profile(
    session: AsyncSession,
    user_id: UUID,
    game_type: str,
    preferred: str | None,
) -> tuple[AdaptiveDifficultyProfile, GameLeaderboard]:
    leaderboard = await _get_or_create_leaderboard(session, user_id, game_type)
    recent_scores = await _recent_scores(session, user_id, game_type)
    recent_average, skill_rating = _calculate_skill_metrics(recent_scores or [leaderboard.best_score])
    pet_happiness, pet_mood = await _fetch_pet_mood(session, user_id)
    recommended = _choose_difficulty(skill_rating, pet_happiness)

    confidence = min(0.95, max(0.2, leaderboard.games_played / 18 + 0.25))
    if preferred and preferred in ALLOWED_DIFFICULTIES and preferred != recommended:
        confidence *= 0.8
        recommended = preferred

    profile = AdaptiveDifficultyProfile(
        recommended_difficulty=recommended,
        confidence=round(confidence, 2),
        skill_rating=round(skill_rating, 2),
        recent_average=round(recent_average, 2),
        current_streak=leaderboard.current_streak,
        daily_streak=leaderboard.daily_streak,
        pet_mood=pet_mood,
    )
    return profile, leaderboard


def _build_round_expiry(practice_mode: bool) -> datetime:
    ttl = 5 if practice_mode else ROUND_TTL_MINUTES
    return _now() + timedelta(minutes=ttl)


async def invalidate_expired_rounds(session: AsyncSession) -> None:
    stmt = (
        select(GameRound)
        .where(GameRound.status == "pending", GameRound.expires_at < _now())
    )
    result = await session.execute(stmt)
    expired_rounds = result.scalars().all()
    if not expired_rounds:
        return
    for record in expired_rounds:
        record.status = "expired"
    await session.flush()


async def start_game(
    session: AsyncSession,
    user_id: UUID | str,
    payload: GameStartRequest,
) -> GameStartResponse:
    user_uuid = _ensure_uuid(user_id)

    await invalidate_expired_rounds(session)
    profile, leaderboard = await _build_adaptive_profile(session, user_uuid, payload.game_type, payload.preferred_difficulty)

    round_entry = GameRound(
        user_id=user_uuid,
        game_type=payload.game_type,
        recommended_difficulty=profile.recommended_difficulty,
        status="pending",
        ai_seed=profile.dict(),
        expires_at=_build_round_expiry(payload.practice_mode),
        metadata={
            "practice_mode": payload.practice_mode,
            "preferred_difficulty": payload.preferred_difficulty,
        },
    )
    session.add(round_entry)
    await session.flush()

    return GameStartResponse(
        session_id=round_entry.id,
        game_type=payload.game_type,
        difficulty=profile.recommended_difficulty,
        expires_at=round_entry.expires_at,
        ai_profile=profile,
        longest_streak=leaderboard.longest_streak,
    )


async def _check_round(session: AsyncSession, user_id: UUID, session_id: UUID) -> GameRound:
    stmt = select(GameRound).where(GameRound.id == session_id)
    result = await session.execute(stmt)
    round_entry = result.scalar_one_or_none()
    if round_entry is None:
        raise GameRuleError("Game session not found. Please start a new round.")
    if round_entry.user_id != user_id:
        raise GameRuleError("You cannot submit results for another player.")
    if round_entry.status != "pending":
        raise GameRuleError("This round has already been resolved. Start a new one.")
    expires_at = _ensure_aware(round_entry.expires_at)
    if expires_at is not None:
        round_entry.expires_at = expires_at
    if expires_at and expires_at < _now():
        round_entry.status = "expired"
        await session.flush()
        raise GameRuleError("Session expired. Start a new round to keep playing.")
    return round_entry


async def _update_streak(
    session: AsyncSession,
    user_id: UUID,
    game_type: str,
) -> tuple[int, int]:
    stmt = select(GameAchievement).where(
        GameAchievement.user_id == user_id,
        GameAchievement.achievement_key == f"streak_{game_type}",
    ).with_for_update()
    result = await session.execute(stmt)
    record = result.scalar_one_or_none()

    today = _now().date()

    if record is None:
        record = GameAchievement(
            user_id=user_id,
            achievement_key=f"streak_{game_type}",
            streak_days=1,
            last_played_at=_now(),
            metadata_json={"longest_streak": 1},
        )
        session.add(record)
        await session.flush()
        return 1, 1

    last_played_date = (record.last_played_at or _now()).date()
    record.metadata_json = record.metadata_json or {}
    if today - last_played_date == timedelta(days=1):
        record.streak_days += 1
    elif today != last_played_date:
        record.streak_days = 1

    record.last_played_at = _now()
    longest = max((record.metadata_json or {}).get("longest_streak", 1), record.streak_days)
    record.metadata_json["longest_streak"] = longest
    await session.flush()
    return record.streak_days, longest


def _check_achievements(game_type: str, score: int) -> str | None:
    for key, rule in ACHIEVEMENT_THRESHOLDS.items():
        if rule["game"] == game_type and score >= rule["score"]:
            return key
    return None


async def _unlock_achievement(session: AsyncSession, user_id: UUID, achievement_key: str) -> None:
    stmt = select(GameAchievement).where(
        GameAchievement.user_id == user_id,
        GameAchievement.achievement_key == achievement_key,
    ).with_for_update()
    result = await session.execute(stmt)
    record = result.scalar_one_or_none()
    now = _now()
    if record is None:
        record = GameAchievement(
            user_id=user_id,
            achievement_key=achievement_key,
            streak_days=0,
            last_played_at=now,
            metadata_json={"unlocked_at": now.isoformat()},
        )
        session.add(record)
    else:
        metadata = record.metadata_json or {}
        metadata.setdefault("unlocked_at", now.isoformat())
        record.metadata_json = metadata
        record.last_played_at = now
    await session.flush()


async def _record_game_session(
    session: AsyncSession,
    user_id: UUID,
    game_type: str,
    difficulty: str,
    score: int,
    duration_seconds: int,
    reward: GameReward,
    achievement: str | None,
    round_id: UUID,
    metadata: dict | None,
) -> GameSession:
    entry = GameSession(
        user_id=user_id,
        game_type=game_type,
        difficulty=difficulty,
        score=score,
        coins_earned=reward.coins,
        happiness_gain=reward.happiness,
        round_id=round_id,
        metadata_json={
            "duration": duration_seconds,
            "achievement": achievement,
            **(metadata or {}),
        },
    )
    session.add(entry)
    await session.flush()
    return entry


async def _update_leaderboard_metrics(
    session: AsyncSession,
    user_id: UUID,
    game_type: str,
    score: int,
    reward: GameReward,
    streak_days: int,
    longest_streak: int,
) -> GameLeaderboard:
    leaderboard = await _get_or_create_leaderboard(session, user_id, game_type, for_update=True)
    now = _now()
    today = now.date()
    previous_last_played = leaderboard.last_played_at

    leaderboard.games_played += 1
    leaderboard.total_score += score
    leaderboard.total_coins += reward.coins
    leaderboard.total_happiness += reward.happiness
    leaderboard.best_score = max(leaderboard.best_score, score)
    leaderboard.average_score = round(leaderboard.total_score / leaderboard.games_played, 2)
    leaderboard.current_streak = streak_days
    leaderboard.longest_streak = max(leaderboard.longest_streak, longest_streak)

    if previous_last_played is None:
        leaderboard.daily_streak = max(1, leaderboard.daily_streak)
    else:
        prev_date = previous_last_played.date()
        if prev_date == today:
            leaderboard.daily_streak = max(leaderboard.daily_streak, 1)
        elif prev_date == today - timedelta(days=1):
            leaderboard.daily_streak = max(1, leaderboard.daily_streak) + 1
        else:
            leaderboard.daily_streak = 1

    leaderboard.last_daily_reset = today
    leaderboard.last_played_at = now
    leaderboard.metadata_json = {
        **(leaderboard.metadata_json or {}),
        "last_reward": {
            "score": score,
            "coins": reward.coins,
            "happiness": reward.happiness,
            "timestamp": now.isoformat(),
        },
    }
    await session.flush()
    return leaderboard


def _reward_message(game_type: str, reward: GameReward, streak_days: int, daily_streak: int) -> str:
    base = f"Great job! You earned {reward.coins} coins and {reward.happiness} happiness."
    if streak_days > 1:
        base += f" Current streak: {streak_days} days."
    if daily_streak > 1:
        base += f" Daily streak: {daily_streak} days in a row."
    return base


async def submit_game_score(
    session: AsyncSession,
    user_id: UUID | str,
    payload: GameScoreSubmission,
) -> GamePlayResponse:
    if payload.score > MAX_SCORE:
        raise GameRuleError("Score exceeds the maximum allowed value.")

    user_uuid = _ensure_uuid(user_id)
    round_entry = await _check_round(session, user_uuid, payload.session_id)

    difficulty = payload.difficulty or round_entry.recommended_difficulty
    if difficulty not in ALLOWED_DIFFICULTIES:
        raise GameRuleError("Unsupported difficulty level submitted.")

    reward = _base_reward(payload.score, difficulty)
    streak_days, longest_streak = await _update_streak(session, user_uuid, round_entry.game_type)
    reward.streak_bonus = max(0, min(15, streak_days * 2))

    achievement_key = _check_achievements(round_entry.game_type, payload.score)
    if achievement_key:
        reward.coins += 25
        reward.achievement_unlocked = achievement_key
        await _unlock_achievement(session, user_uuid, achievement_key)

    reward.happiness += reward.streak_bonus

    session_entry = await _record_game_session(
        session,
        user_uuid,
        round_entry.game_type,
        difficulty,
        payload.score,
        payload.duration_seconds,
        reward,
        achievement_key,
        round_entry.id,
        payload.metadata,
    )

    # Update pet happiness from game rewards
    pet_stmt = select(Pet).where(Pet.user_id == user_uuid)
    pet_result = await session.execute(pet_stmt)
    pet = pet_result.scalar_one_or_none()
    if pet:
        pet.happiness = min(100, max(0, (pet.happiness or 70) + reward.happiness))
        await session.flush()

    earn_payload = EarnRequest(
        amount=reward.coins,
        reason=f"Mini-game reward: {round_entry.game_type}",
        care_score=payload.score if round_entry.game_type in {"fetch", "reaction"} else None,
    )
    finance_summary = await earn_coins(session, user_uuid, earn_payload)

    leaderboard = await _update_leaderboard_metrics(session, user_uuid, round_entry.game_type, payload.score, reward, streak_days, longest_streak)

    round_entry.status = "completed"
    round_entry.metadata_json = {
        **(round_entry.metadata_json or {}),
        "submitted_score": payload.score,
        "final_difficulty": difficulty,
        "session_record_id": str(session_entry.id),
    }
    await session.flush()

    return GamePlayResponse(
        reward=reward,
        finance=finance_summary,
        mood=None,
        message=_reward_message(round_entry.game_type, reward, streak_days, leaderboard.daily_streak),
        streak_days=streak_days,
        daily_streak=leaderboard.daily_streak,
    )


async def get_games_leaderboard(session: AsyncSession, game_type: str) -> list[GameLeaderboardEntry]:
    stmt: Select[Any] = (
        select(GameLeaderboard)
        .where(GameLeaderboard.game_type == game_type)
        .order_by(desc(GameLeaderboard.best_score), desc(GameLeaderboard.average_score))
        .limit(20)
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()
    entries: list[GameLeaderboardEntry] = []
    for row in rows:
        last_played = row.last_played_at or row.updated_at or _now()
        entries.append(
            GameLeaderboardEntry(
                user_id=row.user_id,
                game_type=row.game_type,
                best_score=row.best_score,
                total_wins=row.games_played,
                last_played_at=last_played,
                average_score=row.average_score,
                current_streak=row.current_streak,
                daily_streak=row.daily_streak,
            )
        )
    return entries


async def get_reward_summary(
    session: AsyncSession,
    user_id: UUID | str,
    game_type: str,
) -> GameRewardsResponse:
    user_uuid = _ensure_uuid(user_id)
    leaderboard = await _get_or_create_leaderboard(session, user_uuid, game_type)

    rank_stmt = (
        select(func.count())
        .where(
            and_(
                GameLeaderboard.game_type == game_type,
                GameLeaderboard.best_score > leaderboard.best_score,
            )
        )
    )
    rank_result = await session.execute(rank_stmt)
    higher_scores = rank_result.scalar_one()
    rank = higher_scores + 1 if leaderboard.best_score > 0 else None

    recent_stmt = (
        select(GameSession)
        .where(GameSession.user_id == user_uuid, GameSession.game_type == game_type)
        .order_by(desc(GameSession.created_at))
        .limit(5)
    )
    recent_result = await session.execute(recent_stmt)
    recent_sessions = recent_result.scalars().all()
    recent_rewards = [
        GameRewardHistory(
            session_id=session.id,
            game_type=session.game_type,
            difficulty=session.difficulty,
            score=session.score,
            coins=session.coins_earned,
            happiness=session.happiness_gain,
            played_at=session.created_at or session.updated_at or _now(),
        )
        for session in recent_sessions
    ]

    next_bonus = min(15, (leaderboard.current_streak + 1) * 2) if leaderboard.current_streak else 2

    return GameRewardsResponse(
        streak_days=leaderboard.current_streak,
        daily_streak=leaderboard.daily_streak,
        longest_streak=leaderboard.longest_streak,
        next_streak_bonus=next_bonus,
        leaderboard_rank=rank,
        average_score=leaderboard.average_score if leaderboard.games_played else None,
        recent_rewards=recent_rewards,
    )

