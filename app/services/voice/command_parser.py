"""
Command parsing logic for voice commands.

Handles natural language parsing with confidence scoring and error handling.
"""
from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .command_patterns import (
    COMMAND_PATTERNS,
    FOOD_PATTERNS,
    GAME_PATTERNS,
    MULTI_STEP_CONNECTORS,
    TRICK_PATTERNS,
    MIN_CONFIDENCE_THRESHOLD,
)

logger = logging.getLogger(__name__)


@dataclass
class CommandStep:
    """Represents a single action step within a multi-step command."""

    action: str
    parameters: Dict[str, Any]
    confidence: float
    original_text: str


@dataclass
class ParsedCommand:
    """Complete parsed command with all steps and metadata."""

    steps: List[CommandStep]
    confidence: float
    original_command: str
    suggestions: List[str]
    can_execute: bool


def _normalize_command(command: str) -> str:
    """Normalize command text for parsing."""
    # Remove extra whitespace and convert to lowercase
    normalized = re.sub(r"\s+", " ", command.strip().lower())
    return normalized


def _extract_food_type(text: str) -> str:
    """Extract food type from command text."""
    for food_type, patterns in FOOD_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return food_type
    return "standard"


def _extract_game_type(text: str) -> str:
    """Extract game type from command text."""
    for game_type, patterns in GAME_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return game_type
    return "free_play"


def _extract_trick_type(text: str) -> str:
    """Extract trick type from command text."""
    for trick_type, patterns in TRICK_PATTERNS.items():
        for pattern in patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return trick_type
    return "sit"  # Default trick


def _extract_duration(text: str) -> int:
    """Extract duration in hours from command text."""
    # Look for explicit numbers
    duration_match = re.search(r"(\d+)\s*(?:hour|hr|h)", text, re.IGNORECASE)
    if duration_match:
        return min(max(1, int(duration_match.group(1))), 12)

    # Look for keywords
    if re.search(r"\b(long|extended|overnight|full)\b", text, re.IGNORECASE):
        return 8
    if re.search(r"\b(short|quick|brief|nap)\b", text, re.IGNORECASE):
        return 2
    if re.search(r"\b(medium|normal|regular)\b", text, re.IGNORECASE):
        return 4

    return 4  # Default duration


def _split_multi_step_command(command: str) -> List[str]:
    """Split a command into individual steps based on connectors."""
    # First, try to split on explicit connectors
    for connector in MULTI_STEP_CONNECTORS:
        parts = re.split(connector, command, flags=re.IGNORECASE)
        if len(parts) > 1:
            return [part.strip() for part in parts if part.strip()]

    # If no explicit connector, check if it's a compound command
    # Look for multiple action keywords
    action_count = sum(
        1
        for patterns in COMMAND_PATTERNS.values()
        for pattern, _ in patterns
        if re.search(pattern[0], command, re.IGNORECASE)
    )
    if action_count > 1:
        # Try to split on common separators
        parts = re.split(r"\s+(?:and|then|,)\s+", command, flags=re.IGNORECASE)
        if len(parts) > 1:
            return [part.strip() for part in parts if part.strip()]

    return [command]


def _parse_single_command(command_text: str) -> Optional[CommandStep]:
    """Parse a single command step from text with enhanced confidence scoring."""
    normalized = _normalize_command(command_text)

    best_match = None
    best_confidence = 0.0
    best_action = None

    # Try to match against each action type
    for action, patterns in COMMAND_PATTERNS.items():
        for pattern, _ in patterns:
            match = re.search(pattern, normalized, re.IGNORECASE)
            if match:
                # Enhanced confidence calculation
                confidence = 0.7 if match.start() == 0 else 0.5
                if len(pattern) > 20:  # More specific patterns get higher confidence
                    confidence += 0.15
                # Boost confidence for exact word matches
                if re.search(rf"\b{action}\b", normalized, re.IGNORECASE):
                    confidence += 0.1
                # Boost for multiple keyword matches
                keyword_matches = sum(
                    1
                    for p, _ in patterns
                    if re.search(p, normalized, re.IGNORECASE)
                )
                if keyword_matches > 1:
                    confidence += 0.05 * min(keyword_matches - 1, 2)

                if confidence > best_confidence:
                    best_confidence = confidence
                    best_action = action
                    best_match = match

    if not best_action:
        return None

    # Extract parameters based on action type
    parameters: Dict[str, Any] = {}

    if best_action == "feed":
        parameters["food_type"] = _extract_food_type(normalized)
    elif best_action == "play":
        parameters["game_type"] = _extract_game_type(normalized)
    elif best_action == "sleep":
        parameters["duration_hours"] = _extract_duration(normalized)
    elif best_action == "trick":
        parameters["trick_type"] = _extract_trick_type(normalized)

    return CommandStep(
        action=best_action,
        parameters=parameters,
        confidence=min(best_confidence, 1.0),
        original_text=command_text,
    )


def parse_command(command: str) -> ParsedCommand:
    """
    Parse a natural language command into actionable steps.

    Supports:
    - Single commands: "feed my pet"
    - Multi-step commands: "feed my pet then play fetch"
    - Invalid commands: gracefully handles with suggestions

    Enhanced with improved confidence scoring and error handling.
    """
    logger.info(f"Parsing command: {command[:100]}")

    normalized = _normalize_command(command)
    if not normalized:
        logger.warning("Empty command received")
        return ParsedCommand(
            steps=[],
            confidence=0.0,
            original_command=command,
            suggestions=[
                "Try commands like: 'feed my pet', 'play fetch', 'let my pet sleep'",
                "You can combine commands: 'feed my pet then play fetch'",
            ],
            can_execute=False,
        )

    # Split into potential steps
    step_texts = _split_multi_step_command(normalized)
    logger.debug(f"Split command into {len(step_texts)} potential steps")

    steps: List[CommandStep] = []
    for step_text in step_texts:
        parsed_step = _parse_single_command(step_text)
        if parsed_step:
            steps.append(parsed_step)
            logger.debug(
                f"Parsed step: {parsed_step.action} with confidence {parsed_step.confidence:.2f}"
            )
        else:
            logger.warning(f"Could not parse step: {step_text}")

    # Calculate overall confidence
    if not steps:
        confidence = 0.0
        suggestions = [
            "I didn't understand that command. Try:",
            "- 'feed my pet' to give food",
            "- 'play fetch' to play a game",
            "- 'let my pet sleep' for rest",
            "- 'teach my pet a trick' for training",
            "- 'bathe my pet' for cleaning",
        ]
    else:
        confidence = sum(step.confidence for step in steps) / len(steps)
        suggestions = []

        # Generate contextual suggestions based on confidence
        if confidence < MIN_CONFIDENCE_THRESHOLD:
            suggestions.append(
                "Command parsed with low confidence. Please be more specific."
            )
        elif confidence < 0.5:
            suggestions.append(
                "Command understood, but please confirm if this is correct."
            )

        # Suggest related actions
        executed_actions = {step.action for step in steps}
        if "feed" not in executed_actions:
            suggestions.append("Your pet might be hungry. Try: 'feed my pet'")
        if "play" not in executed_actions:
            suggestions.append("Want to have fun? Try: 'play fetch with my pet'")
        if "sleep" not in executed_actions:
            suggestions.append("Is your pet tired? Try: 'let my pet sleep'")

    can_execute = len(steps) > 0 and all(
        step.confidence >= MIN_CONFIDENCE_THRESHOLD for step in steps
    )

    return ParsedCommand(
        steps=steps,
        confidence=confidence,
        original_command=command,
        suggestions=suggestions,
        can_execute=can_execute,
    )
