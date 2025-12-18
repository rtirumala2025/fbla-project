"""Finance API endpoints for wallet operations."""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from asyncpg import Pool
from pydantic import BaseModel

from app.core.jwt import get_current_user_id
from app.utils.dependencies import get_db_pool

router = APIRouter(prefix="/finance", tags=["finance"])


class EarnRequest(BaseModel):
    amount: int
    reason: str
    care_score: Optional[int] = None


class DonationRequest(BaseModel):
    recipient_id: str
    amount: int
    message: Optional[str] = None


class GoalCreateRequest(BaseModel):
    name: str
    target_amount: int
    deadline: Optional[str] = None


class GoalContributionRequest(BaseModel):
    amount: int


async def get_or_create_wallet(pool: Pool, user_id: str) -> dict:
    """Get or create wallet for user."""
    async with pool.acquire() as conn:
        wallet = await conn.fetchrow(
            """
            SELECT * FROM finance_wallets
            WHERE user_id = $1
            """,
            user_id,
        )
        
        if not wallet:
            wallet = await conn.fetchrow(
                """
                INSERT INTO finance_wallets (user_id, balance, currency)
                VALUES ($1, 0, 'COIN')
                RETURNING *
                """,
                user_id,
            )
        
        return dict(wallet)


async def create_transaction(
    pool: Pool,
    wallet_id: str,
    user_id: str,
    amount: int,
    transaction_type: str,
    category: str,
    description: Optional[str] = None,
    related_goal_id: Optional[str] = None,
) -> dict:
    """Create a finance transaction."""
    async with pool.acquire() as conn:
        # Update wallet balance
        wallet = await conn.fetchrow(
            """
            UPDATE finance_wallets
            SET balance = balance + $1,
                lifetime_earned = CASE 
                    WHEN $1 > 0 THEN lifetime_earned + $1 
                    ELSE lifetime_earned 
                END,
                lifetime_spent = CASE 
                    WHEN $1 < 0 THEN lifetime_spent + ABS($1) 
                    ELSE lifetime_spent 
                END,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
            """,
            amount,
            wallet_id,
        )
        
        if not wallet:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Wallet not found")
        
        # Create transaction record
        transaction = await conn.fetchrow(
            """
            INSERT INTO finance_transactions (
                wallet_id, user_id, amount, transaction_type,
                category, description, balance_after, related_goal_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            """,
            wallet_id,
            user_id,
            amount,
            transaction_type,
            category,
            description,
            wallet["balance"],
            related_goal_id,
        )
        
        return dict(transaction)


@router.post("/earn")
async def earn_coins(
    payload: EarnRequest,
    pool: Pool = Depends(get_db_pool),
    user_id: str = Depends(get_current_user_id),
):
    """Earn coins for completing tasks or activities."""
    if payload.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Amount must be positive",
        )
    
    wallet = await get_or_create_wallet(pool, user_id)
    
    await create_transaction(
        pool=pool,
        wallet_id=str(wallet["id"]),
        user_id=user_id,
        amount=payload.amount,
        transaction_type="income",
        category="earnings",
        description=payload.reason,
    )
    
    # Return updated finance summary
    return await get_finance_summary_response(pool, user_id)


@router.post("/daily-allowance")
async def claim_daily_allowance(
    pool: Pool = Depends(get_db_pool),
    user_id: str = Depends(get_current_user_id),
):
    """Claim daily allowance (once per 24 hours)."""
    wallet = await get_or_create_wallet(pool, user_id)
    
    # Check if allowance was claimed in last 24 hours
    last_allowance = wallet.get("last_allowance_at")
    if last_allowance:
        last_allowance_dt = last_allowance if isinstance(last_allowance, datetime) else datetime.fromisoformat(str(last_allowance))
        hours_since = (datetime.utcnow() - last_allowance_dt).total_seconds() / 3600
        if hours_since < 24:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Allowance already claimed. Next available in {24 - int(hours_since)} hours",
            )
    
    allowance_amount = 50  # Default daily allowance
    
    async with pool.acquire() as conn:
        # Update wallet with allowance
        await conn.execute(
            """
            UPDATE finance_wallets
            SET balance = balance + $1,
                lifetime_earned = lifetime_earned + $1,
                last_allowance_at = NOW(),
                updated_at = NOW()
            WHERE id = $2
            """,
            allowance_amount,
            wallet["id"],
        )
        
        # Create transaction
        wallet_after = await conn.fetchrow(
            "SELECT balance FROM finance_wallets WHERE id = $1",
            wallet["id"],
        )
        
        await conn.execute(
            """
            INSERT INTO finance_transactions (
                wallet_id, user_id, amount, transaction_type,
                category, description, balance_after
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            wallet["id"],
            user_id,
            allowance_amount,
            "allowance",
            "allowance",
            "Daily allowance",
            wallet_after["balance"],
        )
    
    return await get_finance_summary_response(pool, user_id)


@router.post("/donate")
async def donate_coins(
    payload: DonationRequest,
    pool: Pool = Depends(get_db_pool),
    user_id: str = Depends(get_current_user_id),
):
    """Donate coins to another user."""
    if payload.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Donation amount must be positive",
        )
    
    if payload.recipient_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot donate to yourself",
        )
    
    sender_wallet = await get_or_create_wallet(pool, user_id)
    
    if sender_wallet["balance"] < payload.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance",
        )
    
    recipient_wallet = await get_or_create_wallet(pool, payload.recipient_id)
    
    async with pool.acquire() as conn:
        # Deduct from sender
        await conn.execute(
            """
            UPDATE finance_wallets
            SET balance = balance - $1,
                donation_total = donation_total + $1,
                updated_at = NOW()
            WHERE id = $2
            """,
            payload.amount,
            sender_wallet["id"],
        )
        
        # Add to recipient
        await conn.execute(
            """
            UPDATE finance_wallets
            SET balance = balance + $1,
                lifetime_earned = lifetime_earned + $1,
                updated_at = NOW()
            WHERE id = $2
            """,
            payload.amount,
            recipient_wallet["id"],
        )
        
        # Create transactions
        sender_balance = await conn.fetchrow(
            "SELECT balance FROM finance_wallets WHERE id = $1",
            sender_wallet["id"],
        )
        
        recipient_balance = await conn.fetchrow(
            "SELECT balance FROM finance_wallets WHERE id = $1",
            recipient_wallet["id"],
        )
        
        await conn.execute(
            """
            INSERT INTO finance_transactions (
                wallet_id, user_id, amount, transaction_type,
                category, description, balance_after
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            sender_wallet["id"],
            user_id,
            -payload.amount,
            "donation",
            "donation",
            payload.message or f"Donation to user {payload.recipient_id}",
            sender_balance["balance"],
        )
        
        await conn.execute(
            """
            INSERT INTO finance_transactions (
                wallet_id, user_id, amount, transaction_type,
                category, description, balance_after
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            """,
            recipient_wallet["id"],
            payload.recipient_id,
            payload.amount,
            "income",
            "donation",
            payload.message or f"Donation from user {user_id}",
            recipient_balance["balance"],
        )
    
    return await get_finance_summary_response(pool, user_id)


@router.post("/goals")
async def create_goal(
    payload: GoalCreateRequest,
    pool: Pool = Depends(get_db_pool),
    user_id: str = Depends(get_current_user_id),
):
    """Create a savings goal."""
    if payload.target_amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Target amount must be positive",
        )
    
    wallet = await get_or_create_wallet(pool, user_id)
    
    deadline = None
    if payload.deadline:
        try:
            deadline = datetime.fromisoformat(payload.deadline.replace("Z", "+00:00"))
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid deadline format",
            )
    
    async with pool.acquire() as conn:
        goal = await conn.fetchrow(
            """
            INSERT INTO finance_goals (
                wallet_id, user_id, name, target_amount,
                current_amount, status, deadline
            )
            VALUES ($1, $2, $3, $4, 0, 'active', $5)
            RETURNING *
            """,
            wallet["id"],
            user_id,
            payload.name,
            payload.target_amount,
            deadline,
        )
    
    return await get_finance_summary_response(pool, user_id)


@router.post("/goals/{goal_id}/contribute")
async def contribute_to_goal(
    goal_id: str,
    payload: GoalContributionRequest,
    pool: Pool = Depends(get_db_pool),
    user_id: str = Depends(get_current_user_id),
):
    """Contribute coins to a savings goal."""
    if payload.amount <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contribution amount must be positive",
        )
    
    wallet = await get_or_create_wallet(pool, user_id)
    
    if wallet["balance"] < payload.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance",
        )
    
    async with pool.acquire() as conn:
        # Verify goal exists and belongs to user
        goal = await conn.fetchrow(
            """
            SELECT * FROM finance_goals
            WHERE id = $1 AND user_id = $2
            """,
            goal_id,
            user_id,
        )
        
        if not goal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Goal not found",
            )
        
        if goal["status"] != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Goal is not active",
            )
        
        # Deduct from wallet
        await conn.execute(
            """
            UPDATE finance_wallets
            SET balance = balance - $1,
                updated_at = NOW()
            WHERE id = $2
            """,
            payload.amount,
            wallet["id"],
        )
        
        # Update goal
        new_amount = goal["current_amount"] + payload.amount
        status_update = "completed" if new_amount >= goal["target_amount"] else "active"
        completed_at = datetime.utcnow() if status_update == "completed" else None
        
        await conn.execute(
            """
            UPDATE finance_goals
            SET current_amount = $1,
                status = $2,
                completed_at = $3,
                updated_at = NOW()
            WHERE id = $4
            """,
            new_amount,
            status_update,
            completed_at,
            goal_id,
        )
        
        # Create transaction
        wallet_after = await conn.fetchrow(
            "SELECT balance FROM finance_wallets WHERE id = $1",
            wallet["id"],
        )
        
        await conn.execute(
            """
            INSERT INTO finance_transactions (
                wallet_id, user_id, amount, transaction_type,
                category, description, balance_after, related_goal_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """,
            wallet["id"],
            user_id,
            -payload.amount,
            "expense",
            "goal_contribution",
            f"Contribution to goal: {goal['name']}",
            wallet_after["balance"],
            goal_id,
        )
    
    return await get_finance_summary_response(pool, user_id)


async def get_finance_summary_response(pool: Pool, user_id: str) -> dict:
    """Get finance summary for response."""
    wallet = await get_or_create_wallet(pool, user_id)
    
    async with pool.acquire() as conn:
        # Get today's transactions
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_txs = await conn.fetch(
            """
            SELECT * FROM finance_transactions
            WHERE user_id = $1 AND created_at >= $2
            ORDER BY created_at DESC
            """,
            user_id,
            today_start,
        )
        
        income_today = sum(tx["amount"] for tx in today_txs if tx["amount"] > 0)
        expenses_today = sum(abs(tx["amount"]) for tx in today_txs if tx["amount"] < 0)
        
        # Get recent transactions
        recent_txs = await conn.fetch(
            """
            SELECT * FROM finance_transactions
            WHERE user_id = $1
            ORDER BY created_at DESC
            LIMIT 50
            """,
            user_id,
        )
        
        # Get goals
        goals = await conn.fetch(
            """
            SELECT * FROM finance_goals
            WHERE user_id = $1
            ORDER BY created_at DESC
            """,
            user_id,
        )
        
        # Get inventory
        inventory = await conn.fetch(
            """
            SELECT * FROM finance_inventory
            WHERE user_id = $1
            """,
            user_id,
        )
        
        # Check daily allowance availability
        last_allowance = wallet.get("last_allowance_at")
        daily_allowance_available = False
        if last_allowance:
            last_allowance_dt = last_allowance if isinstance(last_allowance, datetime) else datetime.fromisoformat(str(last_allowance))
            hours_since = (datetime.utcnow() - last_allowance_dt).total_seconds() / 3600
            daily_allowance_available = hours_since >= 24
        else:
            daily_allowance_available = True
    
    return {
        "summary": {
            "currency": wallet.get("currency", "COIN"),
            "balance": wallet.get("balance", 0),
            "donation_total": wallet.get("donation_total", 0),
            "lifetime_earned": wallet.get("lifetime_earned", 0),
            "lifetime_spent": wallet.get("lifetime_spent", 0),
            "income_today": income_today,
            "expenses_today": expenses_today,
            "budget_warning": None,
            "recommendations": [],
            "notifications": ["Daily allowance available!"] if daily_allowance_available else [],
            "daily_allowance_available": daily_allowance_available,
            "allowance_amount": 50,
            "goals": [
                {
                    "id": str(goal["id"]),
                    "name": goal["name"],
                    "target_amount": goal["target_amount"],
                    "current_amount": goal["current_amount"],
                    "status": goal["status"],
                    "deadline": goal["deadline"].isoformat() if goal["deadline"] else None,
                    "completed_at": goal["completed_at"].isoformat() if goal["completed_at"] else None,
                    "progress_percent": int((goal["current_amount"] / goal["target_amount"]) * 100) if goal["target_amount"] > 0 else 0,
                }
                for goal in goals
            ],
            "transactions": [
                {
                    "id": str(tx["id"]),
                    "amount": tx["amount"],
                    "transaction_type": "income" if tx["amount"] > 0 else "expense",
                    "category": tx["category"],
                    "description": tx["description"],
                    "created_at": tx["created_at"].isoformat(),
                    "balance_after": tx["balance_after"],
                    "related_goal_id": str(tx["related_goal_id"]) if tx["related_goal_id"] else None,
                    "related_shop_item_id": str(tx["related_shop_item_id"]) if tx["related_shop_item_id"] else None,
                }
                for tx in recent_txs
            ],
            "inventory": [
                {
                    "item_id": inv["item_id"],
                    "item_name": inv["item_name"],
                    "category": inv["category"],
                    "quantity": inv["quantity"],
                    "shop_item_id": str(inv["shop_item_id"]) if inv["shop_item_id"] else None,
                }
                for inv in inventory
            ],
            "leaderboard": [],  # Would need separate query for leaderboard
        }
    }

