"""Virtual shop endpoints."""
from __future__ import annotations

from fastapi import APIRouter, Depends, status

from app.schemas import PurchaseRequest, ShopItem
from app.services.shop_service import ShopService
from app.utils.dependencies import get_shop_service

router = APIRouter(prefix="/shop", tags=["shop"])


@router.get("/items", response_model=list[ShopItem], summary="List shop items")
async def list_items(service: ShopService = Depends(get_shop_service)) -> list[ShopItem]:
    return await service.list_items()


@router.post(
    "/purchase",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Purchase an item",
)
async def purchase_item(
    payload: PurchaseRequest,
    service: ShopService = Depends(get_shop_service),
) -> dict[str, str]:
    return await service.purchase_item(payload)
