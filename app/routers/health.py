"""
Health check API routes.

This module exposes lightweight endpoints that can be used by load balancers,
uptime monitors, or other services to verify that the backend is responsive.
"""

from fastapi import APIRouter, status

router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "",
    summary="API health check",
    status_code=status.HTTP_200_OK,
)
async def get_health_status() -> dict[str, str]:
    """
    Return the current health status of the service.

    Returns:
        dict[str, str]: A simple response dictionary indicating service health.
    """

    return {"status": "ok"}

