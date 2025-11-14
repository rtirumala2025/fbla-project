"""
Name validation API endpoints.

Validates user-inputted names for pets or accounts with checks for:
- Uniqueness
- Profanity
- Character limits (3-15 chars)
- Formatting rules
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.name_validator import NameValidationRequest, NameValidationResponse
from app.services.name_validator_service import validate_name

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/validate-name", tags=["Name Validation"])


@router.post("", response_model=NameValidationResponse, status_code=status.HTTP_200_OK)
async def validate_name_endpoint(
    payload: NameValidationRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> NameValidationResponse:
    """
    Validate a name for pets or accounts.
    
    Checks:
    - Uniqueness (against existing pets/accounts)
    - Profanity filter
    - Character limits (3-15 characters)
    - Formatting rules (alphanumeric, spaces, hyphens, underscores)
    
    Returns validation result with suggestions if invalid.
    
    Args:
        payload: Name validation request
        session: Database session
        user_id: Current authenticated user ID
        
    Returns:
        NameValidationResponse with validation results
        
    Raises:
        HTTPException: If validation service encounters an error
    """
    try:
        logger.info(
            f"Validating {payload.name_type} name '{payload.name}' for user {user_id}"
        )
        
        result = await validate_name(
            session=session,
            name=payload.name,
            name_type=payload.name_type,
            exclude_user_id=payload.exclude_user_id,
        )
        
        return NameValidationResponse(
            status=result["status"],
            valid=result["valid"],
            suggestions=result["suggestions"],
            errors=result["errors"],
        )
    
    except Exception as e:
        logger.error(
            f"Error validating {payload.name_type} name '{payload.name}': {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while validating the name: {str(e)}",
        ) from e

