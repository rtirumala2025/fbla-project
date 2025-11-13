"""Health check endpoints."""
from __future__ import annotations

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health", summary="Health probe")
async def healthcheck() -> dict[str, str]:
    """Simple health probe used by monitoring and tests."""
    return {"status": "ok"}
