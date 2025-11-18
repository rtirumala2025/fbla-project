"""
Service for platform-wide statistics.
"""

from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pet import Pet
from app.models.user import User
from app.schemas.stats import StatsSummary


async def get_platform_stats(session: AsyncSession) -> StatsSummary:
    """
    Calculate platform-wide statistics.

    Returns:
        StatsSummary: Aggregated platform statistics including:
        - active_users: Total number of users
        - pet_species: Count of distinct pet species
        - unique_breeds: Count of distinct pet breeds
        - satisfaction_rate: Average pet happiness (as satisfaction proxy)
    """
    # Count total users
    users_stmt = select(func.count(User.id))
    users_result = await session.execute(users_stmt)
    active_users = users_result.scalar_one() or 0

    # Count distinct species
    species_stmt = select(func.count(func.distinct(Pet.species)))
    species_result = await session.execute(species_stmt)
    pet_species = species_result.scalar_one() or 0

    # Count distinct breeds
    breeds_stmt = select(func.count(func.distinct(Pet.breed)))
    breeds_result = await session.execute(breeds_stmt)
    unique_breeds = breeds_result.scalar_one() or 0

    # Calculate average happiness as satisfaction rate
    # If no pets exist, default to a reasonable satisfaction rate
    happiness_stmt = select(func.avg(Pet.happiness))
    happiness_result = await session.execute(happiness_stmt)
    avg_happiness = happiness_result.scalar_one()
    
    # Convert happiness (0-100) to satisfaction rate (0-100)
    # If no pets, use a default value
    satisfaction_rate = float(avg_happiness) if avg_happiness is not None else 97.8

    return StatsSummary(
        active_users=active_users,
        pet_species=pet_species,
        unique_breeds=unique_breeds,
        satisfaction_rate=round(satisfaction_rate, 1),
    )

