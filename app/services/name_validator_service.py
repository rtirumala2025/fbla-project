"""
Name validation service for pets and accounts.

Validates user-inputted names for uniqueness, profanity, character limits,
and formatting. Provides suggestions for invalid names.

Enhanced with:
- Comprehensive logging for production debugging
- Edge case handling for empty/invalid data
- Database integration verification
"""

from __future__ import annotations

import logging
import re
from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pet import Pet
from app.models.profile import Profile

# Configure structured logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
)

# Minimum and maximum character limits
MIN_LENGTH = 3
MAX_LENGTH = 15

# Profanity filter - basic list (can be extended)
PROFANITY_WORDS = {
    "badword",
    "curse",
    "inappropriate",
    # Add more as needed - this is a basic implementation
}

# Allowed characters: alphanumeric, spaces, hyphens, underscores
# No leading/trailing spaces, no consecutive spaces
ALLOWED_PATTERN = re.compile(r"^[a-zA-Z0-9]([a-zA-Z0-9\s_-]*[a-zA-Z0-9])?$")


class NameValidationError(ValueError):
    """Raised when name validation fails."""


def _normalize_name(name: str) -> str:
    """
    Normalize name by trimming whitespace and converting to lowercase for comparison.
    
    Args:
        name: The name to normalize
        
    Returns:
        Normalized name
    """
    return name.strip().lower()


def _check_length(name: str) -> tuple[bool, Optional[str]]:
    """
    Check if name meets length requirements.
    
    Args:
        name: The name to check
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    length = len(name)
    if length < MIN_LENGTH:
        return False, f"Name must be at least {MIN_LENGTH} characters long."
    if length > MAX_LENGTH:
        return False, f"Name must be no more than {MAX_LENGTH} characters long."
    return True, None


def _check_formatting(name: str) -> tuple[bool, Optional[str]]:
    """
    Check if name has valid formatting.
    
    Args:
        name: The name to check
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check for leading/trailing spaces
    if name != name.strip():
        return False, "Name cannot have leading or trailing spaces."
    
    # Check for consecutive spaces
    if "  " in name:
        return False, "Name cannot contain consecutive spaces."
    
    # Check allowed characters pattern
    if not ALLOWED_PATTERN.match(name):
        return False, "Name can only contain letters, numbers, spaces, hyphens, and underscores."
    
    # Must start and end with alphanumeric
    if not name[0].isalnum() or not name[-1].isalnum():
        return False, "Name must start and end with a letter or number."
    
    return True, None


def _check_profanity(name: str) -> tuple[bool, Optional[str]]:
    """
    Check if name contains profanity.
    
    Args:
        name: The name to check (will be normalized)
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    normalized = _normalize_name(name)
    words = normalized.split()
    
    for word in words:
        # Check exact matches
        if word in PROFANITY_WORDS:
            return False, "Name contains inappropriate content."
        
        # Check if any profanity word is contained in the name
        for profanity in PROFANITY_WORDS:
            if profanity in word or word in profanity:
                return False, "Name contains inappropriate content."
    
    return True, None


async def _check_uniqueness(
    session: AsyncSession,
    name: str,
    name_type: str,
    exclude_user_id: Optional[UUID] = None,
) -> tuple[bool, Optional[str]]:
    """
    Check if name is unique in the database.
    
    Args:
        session: Database session
        name: The name to check
        name_type: Either "pet" or "account"
        exclude_user_id: Optional user ID to exclude from uniqueness check (for updates)
        
    Returns:
        Tuple of (is_unique, error_message)
    """
    normalized = _normalize_name(name)
    
    logger.debug(
        f"Checking uniqueness for {name_type} name '{name}' "
        f"(normalized: '{normalized}', exclude_user_id: {exclude_user_id})"
    )
    
    try:
        if name_type == "pet":
            # Check pets table
            logger.debug(f"Querying pets table for name '{normalized}'")
            stmt = select(Pet).where(Pet.name.ilike(normalized))
            if exclude_user_id:
                logger.debug(f"Excluding user_id {exclude_user_id} from uniqueness check")
                stmt = stmt.where(Pet.user_id != exclude_user_id)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                logger.info(f"Pet name '{name}' is already taken (existing pet ID: {existing.id})")
                return False, "This pet name is already taken."
            else:
                logger.debug(f"Pet name '{name}' is available")
        
        elif name_type == "account":
            # Check profiles table
            logger.debug(f"Querying profiles table for username '{normalized}'")
            stmt = select(Profile).where(Profile.username.ilike(normalized))
            if exclude_user_id:
                logger.debug(f"Excluding user_id {exclude_user_id} from uniqueness check")
                stmt = stmt.where(Profile.user_id != exclude_user_id)
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()
            
            if existing:
                logger.info(f"Username '{name}' is already taken (existing profile ID: {existing.id})")
                return False, "This username is already taken."
            else:
                logger.debug(f"Username '{name}' is available")
        else:
            logger.error(f"Invalid name_type: {name_type}. Expected 'pet' or 'account'")
            raise NameValidationError(f"Invalid name_type: {name_type}")
        
        return True, None
    
    except NameValidationError:
        raise
    except Exception as e:
        logger.error(
            f"Database error checking uniqueness for {name_type} name '{name}': {e}",
            exc_info=True
        )
        raise NameValidationError(f"Database error while checking uniqueness: {str(e)}") from e


def _generate_suggestions(invalid_name: str, issues: List[str]) -> List[str]:
    """
    Generate alternative name suggestions based on validation issues.
    
    Args:
        invalid_name: The invalid name
        issues: List of validation error messages
        
    Returns:
        List of suggested alternative names
    """
    suggestions = []
    normalized = invalid_name.strip()
    
    # If too short, suggest adding characters
    if len(normalized) < MIN_LENGTH:
        base = normalized if normalized else "Pet"
        while len(base) < MIN_LENGTH:
            base += "1"
        suggestions.append(base)
        suggestions.append(f"{base}123")
    
    # If too long, suggest truncation
    if len(normalized) > MAX_LENGTH:
        truncated = normalized[:MAX_LENGTH].rstrip()
        if len(truncated) >= MIN_LENGTH:
            suggestions.append(truncated)
        suggestions.append(normalized[:MAX_LENGTH - 3] + "123")
    
    # If formatting issues, suggest cleaned version
    cleaned = re.sub(r"[^a-zA-Z0-9\s_-]", "", normalized)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if cleaned and MIN_LENGTH <= len(cleaned) <= MAX_LENGTH:
        if cleaned != normalized:
            suggestions.append(cleaned)
    
    # Generate variations
    if normalized:
        # Add numbers
        if len(normalized) < MAX_LENGTH:
            suggestions.append(f"{normalized}1")
            suggestions.append(f"{normalized}2024")
        
        # Capitalize first letter
        capitalized = normalized.capitalize()
        if capitalized != normalized and MIN_LENGTH <= len(capitalized) <= MAX_LENGTH:
            suggestions.append(capitalized)
    
    # Remove duplicates and limit to 5 suggestions
    unique_suggestions = []
    seen = set()
    for sug in suggestions:
        sug_lower = sug.lower()
        if sug_lower not in seen and MIN_LENGTH <= len(sug) <= MAX_LENGTH:
            unique_suggestions.append(sug)
            seen.add(sug_lower)
            if len(unique_suggestions) >= 5:
                break
    
    # If no suggestions generated, provide defaults
    if not unique_suggestions:
        unique_suggestions = ["Pet123", "MyPet", "Friend1", "Buddy", "Companion"]
    
    return unique_suggestions[:5]


async def validate_name(
    session: AsyncSession,
    name: str,
    name_type: str = "pet",
    exclude_user_id: Optional[UUID] = None,
) -> dict:
    """
    Validate a name for pets or accounts.
    
    Args:
        session: Database session
        name: The name to validate
        name_type: Either "pet" or "account"
        exclude_user_id: Optional user ID to exclude from uniqueness check
        
    Returns:
        Dictionary with validation results:
        {
            "status": "success" | "error",
            "valid": bool,
            "suggestions": List[str],
            "errors": List[str]
        }
    """
    logger.info(
        f"Validating {name_type} name '{name}' "
        f"(exclude_user_id: {exclude_user_id}, session: {session is not None})"
    )
    
    errors = []
    suggestions = []
    
    # Check if name is empty or None
    if not name or not name.strip():
        logger.warning(f"Empty name provided for {name_type} validation")
        errors.append("Name cannot be empty.")
        suggestions = _generate_suggestions("", ["empty"])
        logger.debug(f"Generated {len(suggestions)} suggestions for empty name")
        return {
            "status": "error",
            "valid": False,
            "suggestions": suggestions,
            "errors": errors,
        }
    
    # Validate name_type
    if name_type not in ["pet", "account"]:
        logger.error(f"Invalid name_type: {name_type}. Expected 'pet' or 'account'")
        errors.append(f"Invalid name type: {name_type}")
        return {
            "status": "error",
            "valid": False,
            "suggestions": [],
            "errors": errors,
        }
    
    # Normalize for validation
    normalized = name.strip()
    
    # Check length
    length_valid, length_error = _check_length(normalized)
    if not length_valid:
        errors.append(length_error)
    
    # Check formatting
    format_valid, format_error = _check_formatting(normalized)
    if not format_valid:
        errors.append(format_error)
    
    # Check profanity
    profanity_valid, profanity_error = _check_profanity(normalized)
    if not profanity_valid:
        errors.append(profanity_error)
    
    # Check uniqueness (only if other validations pass)
    if length_valid and format_valid and profanity_valid:
        try:
            logger.debug("All basic validations passed, checking uniqueness in database")
            unique_valid, uniqueness_error = await _check_uniqueness(
                session, normalized, name_type, exclude_user_id
            )
            if not unique_valid:
                logger.info(f"Name '{name}' failed uniqueness check: {uniqueness_error}")
                errors.append(uniqueness_error)
        except NameValidationError as e:
            logger.error(f"NameValidationError during uniqueness check: {e}")
            errors.append(str(e))
        except Exception as e:
            logger.error(
                f"Unexpected error during uniqueness check for '{name}': {e}",
                exc_info=True
            )
            errors.append("Unable to verify name uniqueness. Please try again.")
    else:
        logger.debug(
            f"Skipping uniqueness check - basic validations failed: "
            f"length={length_valid}, format={format_valid}, profanity={profanity_valid}"
        )
    
    # Generate suggestions if invalid
    if errors:
        suggestions = _generate_suggestions(normalized, errors)
        logger.info(
            f"Name '{name}' failed validation for {name_type} - Errors: {errors}, "
            f"Generated {len(suggestions)} suggestions: {suggestions[:3]}"
        )
        return {
            "status": "error",
            "valid": False,
            "suggestions": suggestions,
            "errors": errors,
        }
    
    # All validations passed
    logger.info(f"Name '{name}' passed all validations for {name_type}")
    return {
        "status": "success",
        "valid": True,
        "suggestions": [],
        "errors": [],
    }

