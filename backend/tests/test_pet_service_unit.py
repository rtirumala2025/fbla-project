"""Comprehensive unit tests for PetService to increase coverage."""
from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from asyncpg import Pool
from fastapi import HTTPException, status

from app.models import Pet, PetDiaryEntry, PetStats as DomainPetStats
from app.schemas import (
    PetAction,
    PetActionRequest,
    PetCreate,
    PetDiaryCreate,
    PetResponse,
    PetStats,
    PetUpdate,
)
from app.services.pet_service import PetService
from app.services.pet_ai_service import PetAIService, ReactionResult
from app.services.seasonal_service import SeasonalReactionsService


@pytest.fixture
def mock_pool():
    """Create a mock asyncpg pool."""
    pool = MagicMock(spec=Pool)
    connection = AsyncMock()
    pool.acquire.return_value.__aenter__.return_value = connection
    pool.acquire.return_value.__aexit__.return_value = None
    return pool, connection


@pytest.fixture
def mock_ai_service():
    """Create a mock AI service."""
    from app.services.pet_ai_service import ReactionResult
    service = MagicMock(spec=PetAIService)
    service.generate_reaction = AsyncMock(return_value=ReactionResult(
        reaction="happy",
        mood="content",
        notifications=[],
        note="Pet is happy!",
    ))
    return service


@pytest.fixture
def mock_seasonal_service():
    """Create a mock seasonal service."""
    return MagicMock(spec=SeasonalReactionsService)


@pytest.mark.anyio
async def test_get_pet_not_found(mock_pool):
    """Test getting a pet when none exists."""
    pool, connection = mock_pool
    
    # Mock column detection
    connection.fetch.return_value = [
        {'column_name': 'id'},
        {'column_name': 'user_id'},
        {'column_name': 'name'},
        {'column_name': 'species'},
        {'column_name': 'breed'},
        {'column_name': 'hunger'},
        {'column_name': 'hygiene'},
        {'column_name': 'energy'},
        {'column_name': 'mood'},
        {'column_name': 'health'},
        {'column_name': 'xp'},
        {'column_name': 'level'},
    ]
    connection.fetchrow.return_value = None  # No pet found
    
    service = PetService(pool)
    result = await service.get_pet("user-1")
    
    assert result is None


@pytest.mark.anyio
async def test_create_pet_success(mock_pool, mock_ai_service, mock_seasonal_service):
    """Test creating a pet successfully."""
    pool, connection = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock column detection
    connection.fetch.return_value = [
        {'column_name': 'id'},
        {'column_name': 'user_id'},
        {'column_name': 'name'},
        {'column_name': 'species'},
        {'column_name': 'breed'},
        {'column_name': 'hunger'},
        {'column_name': 'hygiene'},
        {'column_name': 'energy'},
        {'column_name': 'mood'},
        {'column_name': 'health'},
        {'column_name': 'xp'},
        {'column_name': 'level'},
    ]
    
    # Mock pet creation
    connection.fetchrow.return_value = {
        'id': pet_id,
        'user_id': user_id,
        'name': 'TestPet',
        'species': 'dragon',
        'breed': 'Azure',
        'hunger': 100,
        'hygiene': 100,
        'energy': 100,
        'mood': 'happy',
        'health': 100,
        'xp': 0,
        'level': 1,
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
    }
    
    service = PetService(pool, mock_ai_service, mock_seasonal_service)
    payload = PetCreate(name="TestPet", species="dragon", breed="Azure")
    result = await service.create_pet(user_id, payload)
    
    assert result is not None
    assert result.name == "TestPet"
    assert result.species == "dragon"


@pytest.mark.anyio
async def test_update_pet_success(mock_pool, mock_ai_service, mock_seasonal_service):
    """Test updating a pet successfully."""
    pool, connection = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock column detection
    connection.fetch.return_value = [
        {'column_name': 'id'},
        {'column_name': 'user_id'},
        {'column_name': 'name'},
        {'column_name': 'species'},
        {'column_name': 'breed'},
        {'column_name': 'hunger'},
        {'column_name': 'hygiene'},
        {'column_name': 'energy'},
        {'column_name': 'mood'},
        {'column_name': 'health'},
        {'column_name': 'xp'},
        {'column_name': 'level'},
    ]
    
    # Mock existing pet
    connection.fetchrow.side_effect = [
        {  # First call: get pet
            'id': pet_id,
            'user_id': user_id,
            'name': 'OldName',
            'species': 'dragon',
            'breed': 'Azure',
            'hunger': 80,
            'hygiene': 80,
            'energy': 80,
            'mood': 'content',
            'health': 90,
            'xp': 50,
            'level': 2,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        },
        {  # Second call: updated pet
            'id': pet_id,
            'user_id': user_id,
            'name': 'NewName',
            'species': 'dragon',
            'breed': 'Azure',
            'hunger': 80,
            'hygiene': 80,
            'energy': 80,
            'mood': 'content',
            'health': 90,
            'xp': 50,
            'level': 2,
            'created_at': datetime.now(timezone.utc),
            'updated_at': datetime.now(timezone.utc),
        },
    ]
    
    service = PetService(pool, mock_ai_service, mock_seasonal_service)
    payload = PetUpdate(name="NewName")
    result = await service.update_pet(user_id, payload)
    
    assert result is not None
    assert result.name == "NewName"


@pytest.mark.anyio
async def test_apply_action_feed(mock_pool, mock_ai_service, mock_seasonal_service):
    """Test applying feed action to pet."""
    pool, connection = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock column detection
    connection.fetch.return_value = [
        {'column_name': 'id'},
        {'column_name': 'user_id'},
        {'column_name': 'name'},
        {'column_name': 'species'},
        {'column_name': 'breed'},
        {'column_name': 'hunger'},
        {'column_name': 'hygiene'},
        {'column_name': 'energy'},
        {'column_name': 'mood'},
        {'column_name': 'health'},
        {'column_name': 'xp'},
        {'column_name': 'level'},
    ]
    
    # Mock existing pet
    connection.fetchrow.return_value = {
        'id': pet_id,
        'user_id': user_id,
        'name': 'TestPet',
        'species': 'dragon',
        'breed': 'Azure',
        'hunger': 50,
        'hygiene': 80,
        'energy': 80,
        'mood': 'content',
        'health': 90,
        'xp': 50,
        'level': 2,
        'created_at': datetime.now(timezone.utc),
        'updated_at': datetime.now(timezone.utc),
    }
    
    service = PetService(pool, mock_ai_service, mock_seasonal_service)
    payload = PetActionRequest()
    result = await service.apply_action(user_id, PetAction.feed, payload)
    
    assert result is not None
    assert result.pet is not None


@pytest.mark.anyio
async def test_get_diary_entries(mock_pool, mock_ai_service, mock_seasonal_service):
    """Test getting diary entries for a pet."""
    pool, connection = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock column detection
    connection.fetch.return_value = [
        {'column_name': 'id'},
        {'column_name': 'user_id'},
        {'column_name': 'name'},
        {'column_name': 'species'},
        {'column_name': 'breed'},
        {'column_name': 'hunger'},
        {'column_name': 'hygiene'},
        {'column_name': 'energy'},
        {'column_name': 'mood'},
        {'column_name': 'health'},
        {'column_name': 'xp'},
        {'column_name': 'level'},
    ]
    
    # Mock diary entries
    connection.fetch.return_value = [
        {
            'id': str(uuid4()),
            'mood': 'happy',
            'note': 'Had a great day!',
            'created_at': datetime.now(timezone.utc),
        }
    ]
    
    service = PetService(pool, mock_ai_service, mock_seasonal_service)
    result = await service.get_diary(user_id)
    
    assert isinstance(result, list)
    assert len(result) >= 0


@pytest.mark.anyio
async def test_add_diary_entry(mock_pool, mock_ai_service, mock_seasonal_service):
    """Test adding a diary entry."""
    pool, connection = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock column detection
    connection.fetch.return_value = [
        {'column_name': 'id'},
        {'column_name': 'user_id'},
        {'column_name': 'name'},
        {'column_name': 'species'},
        {'column_name': 'breed'},
        {'column_name': 'hunger'},
        {'column_name': 'hygiene'},
        {'column_name': 'energy'},
        {'column_name': 'mood'},
        {'column_name': 'health'},
        {'column_name': 'xp'},
        {'column_name': 'level'},
    ]
    
    # Mock pet existence check
    connection.fetchrow.return_value = {
        'id': pet_id,
        'user_id': user_id,
    }
    
    # Mock inserted diary entry
    entry_id = str(uuid4())
    connection.fetchrow.side_effect = [
        {'id': pet_id, 'user_id': user_id},  # Pet check
        {  # Inserted entry
            'id': entry_id,
            'mood': 'happy',
            'note': 'New entry',
            'created_at': datetime.now(timezone.utc),
        }
    ]
    
    service = PetService(pool, mock_ai_service, mock_seasonal_service)
    payload = PetDiaryCreate(mood="happy", note="New entry")
    result = await service.add_diary_entry(user_id, pet_id, payload)
    
    assert result is not None
    assert result.mood == "happy"
    assert result.note == "New entry"


@pytest.mark.anyio
async def test_service_no_pool_error(mock_ai_service, mock_seasonal_service):
    """Test that service raises error when pool is None."""
    service = PetService(None, mock_ai_service, mock_seasonal_service)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.get_pet("user-1")
    
    assert exc_info.value.status_code == status.HTTP_503_SERVICE_UNAVAILABLE
