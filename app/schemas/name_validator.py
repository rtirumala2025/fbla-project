"""
Pydantic schemas for name validation API.
"""

from __future__ import annotations

from typing import List, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class NameValidationRequest(BaseModel):
    """
    Request payload for name validation.
    """

    name: str = Field(..., min_length=1, max_length=50, description="The name to validate")
    name_type: Literal["pet", "account"] = Field(
        default="pet",
        description="Type of name: 'pet' for pet names, 'account' for usernames",
    )
    exclude_user_id: UUID | None = Field(
        default=None,
        description="Optional user ID to exclude from uniqueness check (for updates)",
    )


class NameValidationResponse(BaseModel):
    """
    Response payload for name validation.
    """

    status: Literal["success", "error"] = Field(
        ...,
        description="Status of the validation request",
    )
    valid: bool = Field(..., description="Whether the name is valid")
    suggestions: List[str] = Field(
        default_factory=list,
        description="List of suggested alternative names if invalid",
    )
    errors: List[str] = Field(
        default_factory=list,
        description="List of validation error messages",
    )

