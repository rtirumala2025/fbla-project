"""
Name Validator AI - Validation and Creative Name Suggestions

This module provides intelligent pet name validation with AI-powered creative suggestions.
It validates names against rules and generates contextually appropriate alternatives.

Features:
- Comprehensive name validation (length, format, profanity, uniqueness)
- AI-powered creative name generation
- Context-aware suggestions based on pet species
- Fallback rule-based suggestions
- Profanity filtering
- Database uniqueness checking support

Algorithm Overview:
1. Validates name against length, format, and character rules
2. Checks for profanity using word lists
3. Optionally validates uniqueness against database
4. Uses AI to generate creative, appropriate suggestions
5. Provides fallback suggestions based on input patterns

Example Usage:
    validator = NameValidatorAI()
    result = await validator.validate_and_suggest(
        input_name="Fluffy",
        pet_species="feline"
    )
    # Returns validation result with creative suggestions
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class NameValidatorAI:
    """
    AI-powered name validator with creative suggestion generation.
    
    Validates pet names against comprehensive rules and generates
    contextually appropriate, creative suggestions using AI.
    
    Validation Rules:
    - Length: 1-20 characters
    - Format: Alphanumeric, spaces, hyphens, apostrophes allowed
    - Profanity: Filtered against word list
    - Uniqueness: Optional database check
    """

    # Name length constraints
    MIN_LENGTH = 1
    MAX_LENGTH = 20

    # Basic profanity filter (in production, use comprehensive library)
    PROFANITY_WORDS = {
        "badword1",
        "badword2",
        # Add more as needed - production should use a library like better-profanity
    }

    # Character pattern: alphanumeric, spaces, hyphens, apostrophes
    VALID_CHAR_PATTERN = re.compile(r"^[a-zA-Z0-9]([a-zA-Z0-9\s\-\']*[a-zA-Z0-9])?$")

    # Species-specific name suggestions (fallback)
    SPECIES_SUGGESTIONS = {
        "canine": ["Buddy", "Max", "Charlie", "Rocky", "Luna", "Bella", "Daisy"],
        "feline": ["Whiskers", "Shadow", "Luna", "Bella", "Milo", "Oliver", "Leo"],
        "dragon": ["Spike", "Flame", "Aurelius", "Draco", "Saphira", "Ember", "Nova"],
        "default": ["Buddy", "Max", "Luna", "Bella", "Charlie", "Rocky", "Daisy"],
    }

    def __init__(self, client: Optional[httpx.AsyncClient] = None) -> None:
        """
        Initialize the Name Validator AI.
        
        Args:
            client: Optional HTTP client for API calls. If not provided,
                   a new client will be created per request.
        """
        self._client = client
        logger.info("NameValidatorAI initialized")

    async def validate_and_suggest(
        self,
        input_name: str,
        pet_species: Optional[str] = None,
        check_uniqueness: bool = False,
        existing_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Validate a pet name and generate AI-powered creative suggestions.
        
        Main validation method that:
        1. Validates name against all rules
        2. Generates creative AI suggestions
        3. Provides fallback suggestions if AI unavailable
        4. Returns comprehensive validation result
        
        Args:
            input_name: Name to validate
            pet_species: Optional pet species for contextual suggestions
                        (canine, feline, dragon, etc.)
            check_uniqueness: Whether to check against existing names
            existing_names: Optional list of existing names for uniqueness check
        
        Returns:
            Dictionary containing:
            - valid: Boolean indicating if name is valid
            - errors: List of validation error messages
            - suggestions: List of creative name suggestions (up to 5)
            - validation_details: Detailed validation breakdown
        
        Example:
            >>> result = await validator.validate_and_suggest(
            ...     input_name="Fluffy",
            ...     pet_species="feline"
            ... )
            >>> print(result["valid"])  # True
            >>> print(result["suggestions"])  # ["Fluffy", "Whiskers", ...]
        """
        input_name = input_name.strip() if input_name else ""
        
        # Perform validation
        validation_result = self._validate_name(input_name, existing_names if check_uniqueness else None)
        is_valid = validation_result["valid"]
        errors = validation_result["errors"]

        # Generate suggestions (always generate for variety)
        suggestions: List[str] = []
        try:
            if is_valid or True:  # Always generate suggestions
                suggestions = await self._generate_ai_suggestions(
                    input_name, is_valid, pet_species
                )
        except Exception as e:
            logger.warning(f"AI suggestion generation failed, using fallback: {e}")
            suggestions = self._generate_fallback_suggestions(input_name, pet_species)

        # Limit suggestions to 5
        suggestions = suggestions[:5]

        return {
            "valid": is_valid,
            "errors": errors,
            "suggestions": suggestions,
            "validation_details": validation_result.get("details", {}),
        }

    def _validate_name(self, name: str, existing_names: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Validate name against all rules.
        
        Validation algorithm:
        1. Checks if name is empty
        2. Validates length constraints
        3. Validates character format
        4. Checks for profanity
        5. Optionally checks uniqueness
        
        Args:
            name: Name to validate
            existing_names: Optional list to check uniqueness against
        
        Returns:
            Dictionary with validation results
        """
        errors = []
        details = {}

        # Empty check
        if not name:
            errors.append("Name cannot be empty")
            details["empty"] = True
            return {"valid": False, "errors": errors, "details": details}

        details["empty"] = False

        # Length validation
        length = len(name)
        details["length"] = length
        if length < self.MIN_LENGTH:
            errors.append(f"Name must be at least {self.MIN_LENGTH} character long")
        elif length > self.MAX_LENGTH:
            errors.append(f"Name must be no more than {self.MAX_LENGTH} characters long")
        else:
            details["length_valid"] = True

        # Format validation
        if not self.VALID_CHAR_PATTERN.match(name):
            errors.append(
                "Name can only contain letters, numbers, spaces, hyphens, and apostrophes. "
                "Must start and end with alphanumeric characters."
            )
            details["format_valid"] = False
        else:
            details["format_valid"] = True

        # Check for at least one letter
        if not any(c.isalpha() for c in name):
            errors.append("Name must contain at least one letter")
            details["has_letters"] = False
        else:
            details["has_letters"] = True

        # Profanity check
        name_lower = name.lower()
        for word in self.PROFANITY_WORDS:
            if word in name_lower:
                errors.append("Name contains inappropriate content")
                details["profanity"] = True
                return {"valid": False, "errors": errors, "details": details}

        details["profanity"] = False

        # Uniqueness check (if requested)
        if existing_names:
            if name.lower() in [n.lower() for n in existing_names]:
                errors.append("Name is already taken. Please choose a different name.")
                details["unique"] = False
            else:
                details["unique"] = True

        is_valid = len(errors) == 0
        return {"valid": is_valid, "errors": errors, "details": details}

    async def _generate_ai_suggestions(
        self,
        input_name: str,
        is_valid: bool,
        pet_species: Optional[str] = None,
    ) -> List[str]:
        """
        Generate creative name suggestions using AI.
        
        Uses AI to generate contextually appropriate, creative suggestions
        that match the pet species and input style.
        
        Args:
            input_name: Original input name
            is_valid: Whether the input name is valid
            pet_species: Optional pet species for context
        
        Returns:
            List of creative name suggestions
        """
        settings = get_settings()
        api_key = getattr(settings, "openrouter_api_key", None) or getattr(settings, "openai_api_key", None)

        if not api_key:
            return self._generate_fallback_suggestions(input_name, pet_species)

        # Build context-aware prompt
        species_context = ""
        if pet_species:
            species_context = f"The pet is a {pet_species}. "
            if pet_species.lower() == "feline":
                species_context += "Suggest names that fit cats - elegant, playful, or mysterious."
            elif pet_species.lower() == "canine":
                species_context += "Suggest names that fit dogs - friendly, energetic, or loyal."
            elif "dragon" in pet_species.lower():
                species_context += "Suggest names that fit dragons - powerful, majestic, or mystical."

        prompt = f"""Generate 5 creative and unique pet name suggestions.

Input name: "{input_name}"
Input is valid: {is_valid}
{species_context}

Requirements:
- Names should be 1-20 characters
- Appropriate and family-friendly
- Creative and memorable
- Suitable for a virtual pet companion
- If input is valid, suggest similar or alternative creative names
- If input is invalid, suggest completely new, appropriate names

Return only the names, one per line, without numbering, bullets, or extra text."""

        messages = [
            {
                "role": "system",
                "content": (
                    "You are a creative pet naming assistant. Generate fun, appropriate, "
                    "and memorable pet names that fit the context."
                ),
            },
            {"role": "user", "content": prompt},
        ]

        # Determine API endpoint
        api_url = getattr(settings, "openrouter_base_url", None) or getattr(settings, "openai_chat_api", None)
        model = getattr(settings, "openrouter_model", None) or getattr(settings, "openai_chat_model", "gpt-3.5-turbo")

        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.9,  # Higher temperature for creativity
            "max_tokens": 150,
        }

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        client = self._client or httpx.AsyncClient(timeout=30.0)
        close_client = self._client is None

        try:
            response = await client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()

            # Parse suggestions from response (one per line)
            suggestions = []
            for line in content.split("\n"):
                line = line.strip()
                # Remove numbering, bullets, quotes
                line = re.sub(r"^[\d\.\-\*\"\']+\s*", "", line)
                line = line.strip('"\'')
                if line and 1 <= len(line) <= self.MAX_LENGTH:
                    # Quick validation check
                    if self.VALID_CHAR_PATTERN.match(line) and any(c.isalpha() for c in line):
                        suggestions.append(line)

            # Remove duplicates and limit
            seen = set()
            unique_suggestions = []
            for suggestion in suggestions:
                suggestion_lower = suggestion.lower()
                if suggestion_lower not in seen:
                    seen.add(suggestion_lower)
                    unique_suggestions.append(suggestion)
                if len(unique_suggestions) >= 5:
                    break

            return unique_suggestions[:5]

        except Exception as e:
            logger.error(f"AI suggestion generation failed: {e}")
            return self._generate_fallback_suggestions(input_name, pet_species)
        finally:
            if close_client:
                await client.aclose()

    def _generate_fallback_suggestions(self, input_name: str, pet_species: Optional[str] = None) -> List[str]:
        """
        Generate fallback suggestions using rule-based pattern matching.
        
        Creates variations of the input name and adds species-appropriate
        suggestions when AI is unavailable.
        
        Algorithm:
        1. Creates variations of input name (suffixes, prefixes)
        2. Adds species-specific suggestions
        3. Adds generic popular names
        4. Filters to valid names only
        
        Args:
            input_name: Original input name
            pet_species: Optional pet species
        
        Returns:
            List of fallback suggestions
        """
        suggestions = []
        base_name = input_name.strip().lower() if input_name else ""

        # Generate variations of input name
        if base_name and len(base_name) < 15:
            # Add common suffixes
            for suffix in ["y", "ie", "o", "er", "y"]:
                variation = base_name + suffix
                if 1 <= len(variation) <= self.MAX_LENGTH:
                    suggestions.append(variation.capitalize())

            # Add common prefixes
            for prefix in ["Little ", "Big ", "Super "]:
                variation = prefix + base_name
                if 1 <= len(variation) <= self.MAX_LENGTH:
                    suggestions.append(variation.capitalize())

        # Add species-specific suggestions
        species_key = pet_species.lower() if pet_species else "default"
        if species_key not in self.SPECIES_SUGGESTIONS:
            species_key = "default"

        for name in self.SPECIES_SUGGESTIONS[species_key]:
            name_lower = name.lower()
            if name_lower != base_name and name not in suggestions:
                suggestions.append(name)
            if len(suggestions) >= 5:
                break

        # Add generic popular names if we don't have enough
        generic_names = ["Buddy", "Max", "Luna", "Bella", "Charlie", "Rocky", "Daisy", "Milo", "Oliver"]
        for name in generic_names:
            if name.lower() != base_name and name not in suggestions:
                suggestions.append(name)
            if len(suggestions) >= 5:
                break

        return suggestions[:5]
