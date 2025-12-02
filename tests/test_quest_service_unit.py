"""
Unit tests for quest service
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone, timedelta
from uuid import uuid4

from app.services.quest_service import QuestService
from app.models.quest import QuestType, QuestDifficulty, QuestStatus
from app.schemas.quest import QuestReward
from fastapi import HTTPException


@pytest.fixture
def mock_pool():
    """Mock database pool"""
    pool = AsyncMock()
    conn = AsyncMock()
    pool.acquire.return_value.__aenter__.return_value = conn
    pool.acquire.return_value.__aexit__.return_value = None
    return pool, conn


@pytest.fixture
def quest_service(mock_pool):
    """Quest service instance with mocked pool"""
    pool, _ = mock_pool
    return QuestService(pool=pool)


@pytest.mark.asyncio
async def test_get_active_quests_success(quest_service, mock_pool):
    """Test getting active quests successfully"""
    _, conn = mock_pool
    user_id = str(uuid4())
    quest_id = uuid4()
    
    now = datetime.now(timezone.utc)
    
    # Mock quests
    conn.fetch.side_effect = [
        [
            {
                "id": quest_id,
                "quest_key": "daily_feed",
                "description": "Feed your pet",
                "quest_type": "daily",
                "difficulty": "easy",
                "rewards": {"coins": 10, "xp": 5, "items": []},
                "target_value": 1,
                "icon": None,
                "start_at": None,
                "end_at": None,
                "created_at": now,
                "updated_at": now,
            }
        ],
        [],  # No user quests yet
    ]
    
    # Mock initialize_user_quest
    conn.fetchrow.return_value = {
        "id": uuid4(),
        "quest_id": quest_id,
        "status": "pending",
        "progress": 0,
        "target_value": 1,
        "last_progress_at": None,
        "completed_at": None,
        "claimed_at": None,
        "created_at": now,
        "updated_at": now,
    }
    
    response = await quest_service.get_active_quests(user_id)
    
    assert len(response.daily) == 1
    assert response.daily[0].quest_key == "daily_feed"
    assert response.daily[0].status == QuestStatus.PENDING


@pytest.mark.asyncio
async def test_complete_quest_success(quest_service, mock_pool):
    """Test completing a quest successfully"""
    _, conn = mock_pool
    user_id = str(uuid4())
    quest_id = uuid4()
    user_quest_id = uuid4()
    
    # Mock user quest
    conn.fetchrow.side_effect = [
        {
            "id": user_quest_id,
            "quest_id": quest_id,
            "status": "in_progress",
            "progress": 1,
            "target_value": 1,
        },
        {
            "id": quest_id,
            "quest_key": "daily_feed",
            "rewards": {"coins": 10, "xp": 5},
            "target_value": 1,
        },
        {"coins": 100, "total_xp": 50},  # Profile
    ]
    
    # Mock transaction
    conn.transaction.return_value.__aenter__.return_value = conn
    conn.transaction.return_value.__aexit__.return_value = None
    
    response = await quest_service.complete_quest(user_id, str(quest_id))
    
    assert response.result.coins_awarded == 10
    assert response.result.xp_awarded == 5
    assert response.result.new_balance == 110
    assert response.result.total_xp == 55


@pytest.mark.asyncio
async def test_complete_quest_already_completed(quest_service, mock_pool):
    """Test completing an already completed quest"""
    _, conn = mock_pool
    user_id = str(uuid4())
    quest_id = uuid4()
    
    conn.fetchrow.return_value = {
        "id": uuid4(),
        "quest_id": quest_id,
        "status": "completed",
        "progress": 1,
        "target_value": 1,
    }
    
    with pytest.raises(HTTPException) as exc_info:
        await quest_service.complete_quest(user_id, str(quest_id))
    
    assert exc_info.value.status_code == 409
    assert "already" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_complete_quest_not_ready(quest_service, mock_pool):
    """Test completing a quest that's not ready"""
    _, conn = mock_pool
    user_id = str(uuid4())
    quest_id = uuid4()
    
    conn.fetchrow.return_value = {
        "id": uuid4(),
        "quest_id": quest_id,
        "status": "in_progress",
        "progress": 0,
        "target_value": 3,
    }
    
    with pytest.raises(HTTPException) as exc_info:
        await quest_service.complete_quest(user_id, str(quest_id))
    
    assert exc_info.value.status_code == 400
    assert "not ready" in exc_info.value.detail.lower() or "progress" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_update_quest_progress(quest_service, mock_pool):
    """Test updating quest progress"""
    _, conn = mock_pool
    user_id = str(uuid4())
    quest_id = uuid4()
    user_quest_id = uuid4()
    
    conn.fetchrow.return_value = {
        "id": user_quest_id,
        "quest_id": quest_id,
        "status": "pending",
        "progress": 0,
        "target_value": 3,
    }
    
    response = await quest_service.update_progress(user_id, str(quest_id), 1)
    
    assert response.progress == 1
    assert response.status == QuestStatus.IN_PROGRESS


@pytest.mark.asyncio
async def test_update_quest_progress_completes_quest(quest_service, mock_pool):
    """Test that updating progress completes quest when target is reached"""
    _, conn = mock_pool
    user_id = str(uuid4())
    quest_id = uuid4()
    user_quest_id = uuid4()
    
    conn.fetchrow.side_effect = [
        {
            "id": user_quest_id,
            "quest_id": quest_id,
            "status": "in_progress",
            "progress": 2,
            "target_value": 3,
        },
        {
            "id": quest_id,
            "quest_key": "daily_feed",
            "rewards": {"coins": 10, "xp": 5},
            "target_value": 3,
        },
        {"coins": 100, "total_xp": 50},  # Profile
    ]
    
    conn.transaction.return_value.__aenter__.return_value = conn
    conn.transaction.return_value.__aexit__.return_value = None
    
    response = await quest_service.update_progress(user_id, str(quest_id), 1)
    
    assert response.progress == 3
    assert response.status == QuestStatus.COMPLETED


@pytest.mark.asyncio
async def test_claim_quest_rewards(quest_service, mock_pool):
    """Test claiming quest rewards"""
    _, conn = mock_pool
    user_id = str(uuid4())
    quest_id = uuid4()
    user_quest_id = uuid4()
    
    conn.fetchrow.side_effect = [
        {
            "id": user_quest_id,
            "quest_id": quest_id,
            "status": "completed",
            "progress": 1,
            "target_value": 1,
            "claimed_at": None,
        },
        {
            "id": quest_id,
            "quest_key": "daily_feed",
            "rewards": {"coins": 10, "xp": 5},
        },
        {"coins": 100, "total_xp": 50},  # Profile
    ]
    
    conn.transaction.return_value.__aenter__.return_value = conn
    conn.transaction.return_value.__aexit__.return_value = None
    
    response = await quest_service.claim_rewards(user_id, str(quest_id))
    
    assert response.result.coins_awarded == 10
    assert response.result.xp_awarded == 5
    assert response.result.new_balance == 110


@pytest.mark.asyncio
async def test_claim_quest_rewards_already_claimed(quest_service, mock_pool):
    """Test claiming rewards for already claimed quest"""
    _, conn = mock_pool
    user_id = str(uuid4())
    quest_id = uuid4()
    
    conn.fetchrow.return_value = {
        "id": uuid4(),
        "quest_id": quest_id,
        "status": "completed",
        "progress": 1,
        "target_value": 1,
        "claimed_at": datetime.now(timezone.utc),
    }
    
    with pytest.raises(HTTPException) as exc_info:
        await quest_service.claim_rewards(user_id, str(quest_id))
    
    assert exc_info.value.status_code == 409
    assert "already" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_quest_service_no_pool():
    """Test quest service raises error when pool is not configured"""
    service = QuestService(pool=None)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.get_active_quests("user-1")
    
    assert exc_info.value.status_code == 503
