"""
Pydantic schemas for platform statistics endpoints.
"""

from __future__ import annotations

from pydantic import BaseModel


class StatsSummary(BaseModel):
    """
    Platform-wide statistics summary.
    """

    active_users: int = 0
    pet_species: int = 0
    unique_breeds: int = 0
    satisfaction_rate: float = 0.0

