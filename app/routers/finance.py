"""
Finance API endpoints for wallet management, purchases, and leaderboards.
"""

from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.finance import (
    DonationRequest,
    EarnRequest,
    FinanceResponse,
    GoalContributionRequest,
    GoalCreateRequest,
    GoalSummary,
    PurchaseRequest,
    ShopItemEntry,
)
from app.services.finance_service import (
    AllowanceAlreadyClaimedError,
    GoalNotFoundError,
    InsufficientFundsError,
    InsufficientStockError,
    InvalidDonationError,
    claim_daily_allowance,
    contribute_to_goal,
    create_goal,
    donate_coins,
    earn_coins,
    get_finance_response,
    get_leaderboard_summary,
    get_shop_catalog,
    list_goals,
    purchase_items,
)

router = APIRouter(prefix="/api/finance", tags=["Finance"])


@router.get("", response_model=FinanceResponse)
async def get_finance_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve the authenticated user's finance summary (balance, recent transactions, recommendations).
    """

    return await get_finance_response(session, user_id)


@router.post("/earn", response_model=FinanceResponse, status_code=status.HTTP_201_CREATED)
async def earn_coins_endpoint(
    payload: EarnRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Add coins to the user's wallet (e.g., daily care reward).
    """

    summary = await earn_coins(session, user_id, payload)
    return FinanceResponse(summary=summary)


@router.post("/purchase", response_model=FinanceResponse, status_code=status.HTTP_201_CREATED)
async def purchase_items_endpoint(
    payload: PurchaseRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Spend coins on shop items and update inventory.
    """

    try:
        summary = await purchase_items(session, user_id, payload)
    except InsufficientFundsError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except InsufficientStockError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return FinanceResponse(summary=summary)


@router.get("/leaderboard")
async def finance_leaderboard_endpoint(
    metric: str = Query("balance", pattern="^(balance|care_score)$"),
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),  # ensures JWT auth
):
    """
    Retrieve the global finance leaderboard ordered by balance or care score.
    """

    return await get_leaderboard_summary(session, metric=metric)


@router.get("/shop", response_model=List[ShopItemEntry])
async def get_shop_items_endpoint(
    session: AsyncSession = Depends(get_db),
    _: str = Depends(get_current_user_id),
):
    """
    Retrieve the active shop catalog for purchases.
    """

    return await get_shop_catalog(session)


@router.post("/daily-allowance", response_model=FinanceResponse, status_code=status.HTTP_201_CREATED)
async def claim_daily_allowance_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Claim the once-per-day allowance reward.
    """

    try:
        summary = await claim_daily_allowance(session, user_id)
    except AllowanceAlreadyClaimedError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return FinanceResponse(summary=summary)


@router.post("/donate", response_model=FinanceResponse, status_code=status.HTTP_201_CREATED)
async def donate_coins_endpoint(
    payload: DonationRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Donate coins to another player's wallet.
    """

    try:
        summary = await donate_coins(session, user_id, payload)
    except (InvalidDonationError, InsufficientFundsError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return FinanceResponse(summary=summary)


@router.get("/goals", response_model=List[GoalSummary])
async def list_goals_endpoint(
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Retrieve all savings goals for the authenticated user.
    """

    return await list_goals(session, user_id)


@router.post("/goals", response_model=FinanceResponse, status_code=status.HTTP_201_CREATED)
async def create_goal_endpoint(
    payload: GoalCreateRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Create a new savings goal.
    """

    summary = await create_goal(session, user_id, payload)
    return FinanceResponse(summary=summary)


@router.post("/goals/{goal_id}/contribute", response_model=FinanceResponse, status_code=status.HTTP_201_CREATED)
async def contribute_goal_endpoint(
    payload: GoalContributionRequest,
    goal_id: str = Path(..., description="Goal identifier"),
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    """
    Contribute coins toward a specific goal.
    """

    try:
        summary = await contribute_to_goal(session, user_id, goal_id, payload)
    except (GoalNotFoundError, InsufficientFundsError) as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return FinanceResponse(summary=summary)

