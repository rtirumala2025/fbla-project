"\"\"\"Unit tests for game service helper logic.\"\"\""

from __future__ import annotations

import pytest

from app.services import games_service


def test_base_reward_scales_with_difficulty():
    easy = games_service._base_reward(score=80, difficulty="easy")
    normal = games_service._base_reward(score=80, difficulty="normal")
    hard = games_service._base_reward(score=80, difficulty="hard")

    assert normal.coins > easy.coins
    assert hard.coins > normal.coins
    assert hard.happiness > normal.happiness > easy.happiness


def test_calculate_skill_metrics_handles_empty_scores():
    average, rating = games_service._calculate_skill_metrics([])
    assert average == 45.0
    assert rating == 0.0

    average, rating = games_service._calculate_skill_metrics([70, 80, 90])
    assert average == pytest.approx((70 + 80 + 90) / 3)
    assert rating > average


def test_choose_difficulty_responds_to_skill_and_happiness():
    difficulty = games_service._choose_difficulty(skill_rating=85, pet_happiness=80)
    assert difficulty == "hard"

    difficulty = games_service._choose_difficulty(skill_rating=85, pet_happiness=30)
    assert difficulty == "easy"

    difficulty = games_service._choose_difficulty(skill_rating=50, pet_happiness=70)
    assert difficulty == "easy"


def test_reward_message_includes_streaks():
    reward = games_service.GameReward(coins=20, happiness=10, streak_bonus=5)
    message = games_service._reward_message("fetch", reward, streak_days=3, daily_streak=2)
    assert "20" in message
    assert "3 days" in message
    assert "Daily streak" in message

