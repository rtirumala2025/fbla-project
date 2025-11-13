"""
Virtual shop endpoints.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.models.finance import ShopItem
from app.schemas.finance import FinanceSummary, PurchaseRequest, ShopItemEntry
from app.services import purchase_items

router = APIRouter(prefix="/api/shop", tags=["Shop"])


@router.get("/items", response_model=List[ShopItemEntry])
async def list_shop_items(session: AsyncSession = Depends(get_db)) -> List[ShopItemEntry]:
    stmt = (
        select(ShopItem)
        .where(ShopItem.is_active.is_(True))
        .order_by(ShopItem.category.asc(), ShopItem.name.asc())
    )
    result = await session.execute(stmt)
    items = result.scalars().all()
    return [
        ShopItemEntry(
            id=item.id,
            sku=item.sku,
            name=item.name,
            category=item.category,
            price=item.price,
            stock=item.stock,
            description=item.description,
            metadata=item.metadata_json,
        )
        for item in items
    ]


@router.post("/purchase", response_model=FinanceSummary, status_code=status.HTTP_202_ACCEPTED)
async def purchase_shop_items(
    payload: PurchaseRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> FinanceSummary:
    return await purchase_items(session, user_id, payload)
