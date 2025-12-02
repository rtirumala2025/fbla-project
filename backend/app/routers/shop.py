"""Virtual shop endpoints."""
from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status

from app.models import AuthenticatedUser
from app.schemas import (
    InventoryItem,
    PurchaseRequest,
    PurchaseResponse,
    ShopItem,
    UseItemRequest,
    UseItemResponse,
)
from app.services.shop_service import ShopService
from app.utils.dependencies import get_current_user, get_db_pool, get_shop_service

router = APIRouter(prefix="/shop", tags=["shop"])


@router.get("/items", response_model=List[ShopItem], summary="List shop items")
async def list_items(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: ShopService = Depends(get_shop_service),
) -> List[ShopItem]:
    """List all active shop items with user-specific stock calculations."""
    return await service.list_items(user_id=current_user.id)


@router.post(
    "/purchase",
    response_model=PurchaseResponse,
    status_code=status.HTTP_200_OK,
    summary="Purchase items",
)
async def purchase_items(
    payload: PurchaseRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: ShopService = Depends(get_shop_service),
) -> PurchaseResponse:
    """Purchase items: validates balance, deducts coins, adds to inventory."""
    return await service.purchase_items(current_user.id, payload)


@router.get("/inventory", response_model=List[InventoryItem], summary="Get user inventory")
async def get_inventory(
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: ShopService = Depends(get_shop_service),
) -> List[InventoryItem]:
    """Get user's inventory items."""
    return await service.get_inventory(current_user.id)


@router.post(
    "/use",
    response_model=UseItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Use an item from inventory",
)
async def use_item(
    payload: UseItemRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    service: ShopService = Depends(get_shop_service),
) -> UseItemResponse:
    """Use an item from inventory and apply effects to pet."""
    return await service.use_item(current_user.id, payload)
