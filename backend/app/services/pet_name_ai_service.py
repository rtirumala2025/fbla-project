"""Service for AI-powered pet name validation and suggestions."""
from __future__ import annotations

import logging
from typing import List

import httpx

from app.core.config import get_settings
from app.schemas.ai import PetNameSuggestionRequest, PetNameSuggestionResponse

logger = logging.getLogger(__name__)

# List of offensive/inappropriate words (basic filter)
OFFENSIVE_WORDS = {
    "badword1",
    "badword2",
    # Add more as needed - in production, use a comprehensive profanity filter library
}


class PetNameAIService:
    """Service for validating pet names and generating AI-powered suggestions."""

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(timeout=30.0)

    async def validate_and_suggest(
        self,
        request: PetNameSuggestionRequest,
    ) -> PetNameSuggestionResponse:
        """
        Validate pet name and generate AI-powered suggestions.

        Args:
            request: Pet name suggestion request with input name

        Returns:
            PetNameSuggestionResponse with validation result and suggestions
        """
        input_name = request.input_name.strip()

        # Basic validation
        is_valid = self._validate_name(input_name)

        # Generate suggestions using AI
        suggestions: List[str] = []
        if not is_valid or True:  # Always generate suggestions for variety
            try:
                suggestions = await self._generate_ai_suggestions(input_name, is_valid)
            except Exception as e:
                logger.error(f"Failed to generate AI suggestions: {e}")
                suggestions = self._fallback_suggestions(input_name)

        # Limit to 5 suggestions
        suggestions = suggestions[:5]

        return PetNameSuggestionResponse(valid=is_valid, suggestions=suggestions)

    def _validate_name(self, name: str) -> bool:
        """
        Validate pet name against rules:
        - Length between 1 and 20 characters
        - No offensive words
        - Alphanumeric and basic special characters only
        """
        if not name:
            return False

        # Length check
        if len(name) < 1 or len(name) > 20:
            return False

        # Check for offensive words (case-insensitive)
        name_lower = name.lower()
        for word in OFFENSIVE_WORDS:
            if word in name_lower:
                return False

        # Basic character validation (allow letters, numbers, spaces, hyphens, apostrophes)
        if not all(c.isalnum() or c in (" ", "-", "'") for c in name):
            return False

        # Must contain at least one letter
        if not any(c.isalpha() for c in name):
            return False

        return True

    async def _generate_ai_suggestions(self, input_name: str, is_valid: bool) -> List[str]:
        """Generate creative pet name suggestions using OpenAI."""
        settings = get_settings()

        if not settings.openai_api_key:
            return self._fallback_suggestions(input_name)

        prompt = f"""Generate 5 creative and unique pet name suggestions. 
        
Input name: "{input_name}"
Valid: {is_valid}

If the input name is valid, suggest similar or alternative names that are creative and fun.
If the input name is invalid, suggest completely new, appropriate pet names.

Requirements:
- Names should be 1-20 characters
- Appropriate and family-friendly
- Creative and memorable
- Suitable for a virtual pet companion

Return only the names, one per line, without numbering or bullets."""

        messages = [
            {"role": "system", "content": "You are a creative pet naming assistant. Generate fun, appropriate pet names."},
            {"role": "user", "content": prompt},
        ]

        payload = {
            "model": settings.openai_chat_model,
            "messages": messages,
            "temperature": 0.9,
            "max_tokens": 150,
        }

        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }

        response = await self._client.post(
            settings.openai_chat_api,
            json=payload,
            headers=headers,
        )
        response.raise_for_status()

        result = response.json()
        content = result["choices"][0]["message"]["content"].strip()

        # Parse suggestions from response
        suggestions = [line.strip() for line in content.split("\n") if line.strip()]
        # Filter out any that are too long or invalid
        suggestions = [s for s in suggestions if 1 <= len(s) <= 20 and self._validate_name(s)]

        return suggestions[:5]

    def _fallback_suggestions(self, input_name: str) -> List[str]:
        """Generate fallback suggestions when AI is unavailable."""
        base_name = input_name.strip().lower()
        suggestions = []

        # Generate variations
        if base_name:
            # Add common suffixes
            for suffix in ["y", "ie", "o", "er"]:
                suggestion = base_name + suffix
                if len(suggestion) <= 20:
                    suggestions.append(suggestion.capitalize())

            # Add common prefixes
            for prefix in ["Little ", "Big ", "Super "]:
                suggestion = prefix + base_name
                if len(suggestion) <= 20:
                    suggestions.append(suggestion)

        # Add generic suggestions if we don't have enough
        generic_names = ["Buddy", "Max", "Luna", "Charlie", "Bella", "Daisy", "Rocky", "Milo"]
        for name in generic_names:
            if name.lower() != base_name and name not in suggestions:
                suggestions.append(name)
            if len(suggestions) >= 5:
                break

        return suggestions[:5]
