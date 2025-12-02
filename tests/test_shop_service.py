"""
Unit tests for shop service
"""
from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from app.services.shop_service import ShopService, ITEM_EFFECTS
from app.schemas import ShopItem, PurchaseRequest, PurchaseLineItem, PurchaseResponse
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
def shop_service(mock_pool):
    """Shop service instance with mocked pool"""
    pool, _ = mock_pool
    return ShopService(pool=pool)


@pytest.mark.asyncio
async def test_list_items_success(shop_service, mock_pool):
    """Test listing shop items successfully"""
    _, conn = mock_pool
    
    # Mock shop items
    conn.fetch.return_value = [
        {
            "id": uuid4(),
            "sku": "food-1",
            "name": "Dog Food",
            "category": "food",
            "price": 10.0,
            "stock": 100,
            "description": "Nutritious dog food",
            "emoji": "🍖",
            "metadata": {},
        },
        {
            "id": uuid4(),
            "sku": "toy-1",
            "name": "Ball",
            "category": "toy",
            "price": 15.0,
            "stock": 50,
            "description": "Bouncy ball",
            "emoji": "⚽",
            "metadata": {},
        },
    ]
    
    # Mock inventory (empty)
    conn.fetchrow.return_value = None
    
    items = await shop_service.list_items()
    
    assert len(items) == 2
    assert items[0].sku == "food-1"
    assert items[0].category == "food"
    assert items[1].sku == "toy-1"
    assert items[1].category == "toy"


@pytest.mark.asyncio
async def test_list_items_with_inventory(shop_service, mock_pool):
    """Test listing items with user inventory"""
    _, conn = mock_pool
    user_id = str(uuid4())
    
    conn.fetch.return_value = [
        {
            "id": uuid4(),
            "sku": "food-1",
            "name": "Dog Food",
            "category": "food",
            "price": 10.0,
            "stock": 100,
            "description": "Nutritious dog food",
            "emoji": "🍖",
            "metadata": {},
        },
    ]
    
    # Mock user has 5 items in inventory
    conn.fetchrow.return_value = {"quantity": 5}
    
    items = await shop_service.list_items(user_id=user_id)
    
    assert len(items) == 1
    # Available stock should be reduced by user's inventory
    assert items[0].stock == 95


@pytest.mark.asyncio
async def test_purchase_items_success(shop_service, mock_pool):
    """Test successful item purchase"""
    _, conn = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock profile with coins
    conn.fetchrow.side_effect = [
        {"coins": 100},  # Profile coins
        {"id": uuid4(), "sku": "food-1", "price": 10.0, "stock": 100},  # Shop item
        {"id": uuid4(), "sku": "toy-1", "price": 15.0, "stock": 50},  # Shop item
    ]
    
    # Mock transaction
    conn.transaction.return_value.__aenter__.return_value = conn
    conn.transaction.return_value.__aexit__.return_value = None
    
    request = PurchaseRequest(
        items=[
            PurchaseLineItem(item_id="food-1", quantity=2),
            PurchaseLineItem(item_id="toy-1", quantity=1),
        ],
        pet_id=pet_id,
    )
    
    response = await shop_service.purchase_items(user_id, request)
    
    assert response.summary.balance == 65  # 100 - (2*10 + 1*15)
    assert len(response.items) == 2
    assert response.items[0].item_id == "food-1"
    assert response.items[0].quantity == 2


@pytest.mark.asyncio
async def test_purchase_items_insufficient_funds(shop_service, mock_pool):
    """Test purchase with insufficient funds"""
    _, conn = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock profile with insufficient coins
    conn.fetchrow.return_value = {"coins": 10}
    
    request = PurchaseRequest(
        items=[PurchaseLineItem(item_id="food-1", quantity=2)],
        pet_id=pet_id,
    )
    
    # Mock shop item
    conn.fetchrow.side_effect = [
        {"coins": 10},  # Profile
        {"id": uuid4(), "sku": "food-1", "price": 10.0, "stock": 100},  # Item
    ]
    
    with pytest.raises(HTTPException) as exc_info:
        await shop_service.purchase_items(user_id, request)
    
    assert exc_info.value.status_code == 400
    assert "insufficient" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_purchase_items_out_of_stock(shop_service, mock_pool):
    """Test purchase when item is out of stock"""
    _, conn = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    conn.fetchrow.side_effect = [
        {"coins": 1000},  # Profile
        {"id": uuid4(), "sku": "food-1", "price": 10.0, "stock": 0},  # Out of stock
    ]
    
    request = PurchaseRequest(
        items=[PurchaseLineItem(item_id="food-1", quantity=1)],
        pet_id=pet_id,
    )
    
    with pytest.raises(HTTPException) as exc_info:
        await shop_service.purchase_items(user_id, request)
    
    assert exc_info.value.status_code == 400
    assert "stock" in exc_info.value.detail.lower()


@pytest.mark.asyncio
async def test_apply_item_effects_food(shop_service, mock_pool):
    """Test applying food item effects to pet"""
    _, conn = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock pet stats
    conn.fetchrow.return_value = {
        "health": 50,
        "hunger": 30,
        "happiness": 50,
        "cleanliness": 50,
        "energy": 50,
    }
    
    # Apply food effect
    await shop_service._apply_item_effects(conn, user_id, pet_id, "food", 1)
    
    # Verify pet stats were updated
    update_calls = [call for call in conn.execute.call_args_list if "UPDATE pets" in str(call)]
    assert len(update_calls) > 0


@pytest.mark.asyncio
async def test_apply_item_effects_medicine(shop_service, mock_pool):
    """Test applying medicine item effects"""
    _, conn = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    conn.fetchrow.return_value = {
        "health": 50,
        "hunger": 50,
        "happiness": 50,
        "cleanliness": 50,
        "energy": 50,
    }
    
    await shop_service._apply_item_effects(conn, user_id, pet_id, "medicine", 1)
    
    update_calls = [call for call in conn.execute.call_args_list if "UPDATE pets" in str(call)]
    assert len(update_calls) > 0


@pytest.mark.asyncio
async def test_get_inventory(shop_service, mock_pool):
    """Test getting user inventory"""
    _, conn = mock_pool
    user_id = str(uuid4())
    
    conn.fetch.return_value = [
        {
            "item_id": "food-1",
            "item_name": "Dog Food",
            "category": "food",
            "quantity": 5,
        },
        {
            "item_id": "toy-1",
            "item_name": "Ball",
            "category": "toy",
            "quantity": 2,
        },
    ]
    
    inventory = await shop_service.get_inventory(user_id)
    
    assert len(inventory) == 2
    assert inventory[0].item_id == "food-1"
    assert inventory[0].quantity == 5


@pytest.mark.asyncio
async def test_use_item_success(shop_service, mock_pool):
    """Test using an item from inventory"""
    _, conn = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    # Mock inventory item
    conn.fetchrow.side_effect = [
        {"item_id": "food-1", "quantity": 5, "category": "food"},  # Inventory
        {"health": 50, "hunger": 30, "happiness": 50, "cleanliness": 50, "energy": 50},  # Pet stats
    ]
    
    response = await shop_service.use_item(user_id, pet_id, "food-1", 1)
    
    assert response.success is True
    assert response.remaining_quantity == 4


@pytest.mark.asyncio
async def test_use_item_not_in_inventory(shop_service, mock_pool):
    """Test using item that doesn't exist in inventory"""
    _, conn = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    conn.fetchrow.return_value = None  # Item not in inventory
    
    with pytest.raises(HTTPException) as exc_info:
        await shop_service.use_item(user_id, pet_id, "food-1", 1)
    
    assert exc_info.value.status_code == 404


@pytest.mark.asyncio
async def test_use_item_insufficient_quantity(shop_service, mock_pool):
    """Test using more items than available"""
    _, conn = mock_pool
    user_id = str(uuid4())
    pet_id = str(uuid4())
    
    conn.fetchrow.return_value = {"item_id": "food-1", "quantity": 2, "category": "food"}
    
    with pytest.raises(HTTPException) as exc_info:
        await shop_service.use_item(user_id, pet_id, "food-1", 5)
    
    assert exc_info.value.status_code == 400


@pytest.mark.asyncio
async def test_shop_service_no_pool():
    """Test shop service raises error when pool is not configured"""
    service = ShopService(pool=None)
    
    with pytest.raises(HTTPException) as exc_info:
        await service.list_items()
    
    assert exc_info.value.status_code == 503
