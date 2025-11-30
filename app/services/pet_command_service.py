"""
Pet Command AI Service

This service processes natural language commands for virtual pets, supporting:
- Single and multi-step commands
- Graceful handling of invalid input
- Structured responses with suggestions
- Comprehensive logging
- Fail-safe fallback responses
- Database integration verification

Production-ready implementation with full error handling and logging.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.pet import Pet
from app.services import ai_service, pet_service

# Configure structured logging
logger = logging.getLogger(__name__)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(funcName)s:%(lineno)d] - %(message)s'
)


@dataclass
class CommandStep:
    """Represents a single action step within a multi-step command."""

    action: str
    parameters: Dict[str, Any]
    confidence: float
    original_text: str


@dataclass
class CommandResult:
    """Result of executing a single command step."""

    success: bool
    action: str
    message: str
    stat_changes: Optional[Dict[str, int]] = None
    pet_state: Optional[Dict[str, Any]] = None


@dataclass
class ParsedCommand:
    """Complete parsed command with all steps and metadata."""

    steps: List[CommandStep]
    confidence: float
    original_command: str
    suggestions: List[str]
    can_execute: bool


# Command patterns for NLP parsing
COMMAND_PATTERNS: Dict[str, List[Tuple[str, str]]] = {
    "feed": [
        (r"\b(feed|give|offer|provide)\s+(?:my\s+)?(?:pet|dog|cat|bird|rabbit)\s+(?:a\s+)?(?:some\s+)?", "feed"),
        (r"\b(feed|give|treat|snack|food|meal)\b", "feed"),
        (r"\b(eat|hungry|hunger|starving)\b", "feed"),
    ],
    "play": [
        (r"\b(play|game|fetch|tug|toy|fun|entertain)\s+(?:with\s+)?(?:my\s+)?(?:pet|dog|cat|bird|rabbit)\b", "play"),
        (r"\b(play|game|fetch|tug|toy|fun)\b", "play"),
        (r"\b(entertain|exercise|activity)\b", "play"),
    ],
    "sleep": [
        (r"\b(sleep|rest|nap|bedtime|sleepy|tired|energy)\s+(?:my\s+)?(?:pet|dog|cat|bird|rabbit)\b", "sleep"),
        (r"\b(sleep|rest|nap|bedtime|sleepy|tired)\b", "sleep"),
        (r"\b(recharge|recover|relax)\b", "sleep"),
    ],
    "bathe": [
        (r"\b(bathe|bath|clean|wash|groom|shower)\s+(?:my\s+)?(?:pet|dog|cat|bird|rabbit)\b", "bathe"),
        (r"\b(bathe|bath|clean|wash|groom)\b", "bathe"),
        (r"\b(hygiene|cleanliness|fresh)\b", "bathe"),
    ],
    "trick": [
        (r"\b(trick|perform|show|do)\s+(?:a\s+)?(?:trick|command)\b", "trick"),
        (r"\b(sit|stay|roll|shake|speak|fetch)\b", "trick"),
        (r"\b(learn|teach|train)\b", "trick"),
    ],
    "status": [
        (r"\b(status|stats|statistics|check|how|what)\s+(?:is|are|my|the)\s+(?:pet|health|happiness|energy|hunger|cleanliness)\b", "status"),
        (r"\b(how\s+is|what's|check)\s+(?:my\s+)?(?:pet|health|happiness|energy|hunger|cleanliness|stats)\b", "status"),
        (r"\b(show|display|view)\s+(?:pet\s+)?(?:status|stats|statistics)\b", "status"),
        (r"\b(pet\s+)?(status|stats|statistics|condition|state)\b", "status"),
    ],
    "analytics": [
        (r"\b(analytics|analyses|analysis|report|reports|insights|dashboard)\b", "analytics"),
        (r"\b(show|open|view|display|see)\s+(?:analytics|report|dashboard|insights)\b", "analytics"),
        (r"\b(how\s+am\s+i\s+doing|my\s+progress|my\s+performance|care\s+summary)\b", "analytics"),
    ],
    "quests": [
        (r"\b(quest|quests|challenge|challenges|mission|missions|task|tasks)\b", "quests"),
        (r"\b(show|open|view|display|see|check)\s+(?:my\s+)?(?:quest|quests|challenge|challenges|mission|missions)\b", "quests"),
        (r"\b(what\s+quest|active\s+quest|daily\s+quest|weekly\s+quest)\b", "quests"),
    ],
    "shop": [
        (r"\b(shop|store|buy|purchase|shopping|marketplace)\b", "shop"),
        (r"\b(show|open|view|display|see)\s+(?:shop|store|marketplace)\b", "shop"),
        (r"\b(i\s+want\s+to\s+)?(buy|purchase|get)\s+(?:something|item|toy|food|accessory)\b", "shop"),
    ],
    "budget": [
        (r"\b(budget|finance|financial|money|coins|balance|spending)\b", "budget"),
        (r"\b(show|open|view|display|see|check)\s+(?:budget|finance|financial|balance|spending)\b", "budget"),
        (r"\b(how\s+much|how\s+many\s+coins|what's\s+my\s+balance)\b", "budget"),
    ],
}

# Multi-step connectors
MULTI_STEP_CONNECTORS = [
    r"\bthen\b",
    r"\band\s+then\b",
    r"\bafter\s+that\b",
    r"\bnext\b",
    r"\bfollowed\s+by\b",
    r"\band\b",
    r"\b,\s*",
    r"\s+;\s*",
]

# Food type extraction patterns
FOOD_PATTERNS = {
    "premium": [r"\b(premium|deluxe|gourmet|special|fancy)\b"],
    "treat": [r"\b(treat|snack|cookie|biscuit|reward)\b"],
    "tuna": [r"\b(tuna|fish)\b"],
    "standard": [r"\b(food|meal|dinner|breakfast|lunch)\b"],
}

# Game type extraction patterns
GAME_PATTERNS = {
    "fetch": [r"\b(fetch|ball|retrieve)\b"],
    "puzzle": [r"\b(puzzle|brain|intelligence|smart)\b"],
    "tug": [r"\b(tug|rope|pull)\b"],
    "free_play": [r"\b(play|game|fun)\b"],
}

# Trick type extraction patterns
TRICK_PATTERNS = {
    "sit": [r"\b(sit|sitting)\b"],
    "stay": [r"\b(stay|wait)\b"],
    "roll": [r"\b(roll|rolling)\b"],
    "shake": [r"\b(shake|paw|handshake)\b"],
    "speak": [r"\b(speak|bark|meow|talk)\b"],
    "fetch": [r"\b(fetch|retrieve|get)\b"],
}


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
    action_count = sum(1 for patterns in COMMAND_PATTERNS.values() for pattern, _ in patterns if re.search(pattern[0], command, re.IGNORECASE))
    if action_count > 1:
        # Try to split on common separators
        parts = re.split(r"\s+(?:and|then|,)\s+", command, flags=re.IGNORECASE)
        if len(parts) > 1:
            return [part.strip() for part in parts if part.strip()]
    
    return [command]


def _parse_single_command(command_text: str) -> Optional[CommandStep]:
    """Parse a single command step from text."""
    normalized = _normalize_command(command_text)
    
    best_match = None
    best_confidence = 0.0
    best_action = None
    
    # Try to match against each action type
    for action, patterns in COMMAND_PATTERNS.items():
        for pattern, _ in patterns:
            match = re.search(pattern, normalized, re.IGNORECASE)
            if match:
                # Calculate confidence based on match position and specificity
                confidence = 0.7 if match.start() == 0 else 0.5
                if len(pattern) > 20:  # More specific patterns get higher confidence
                    confidence += 0.1
                
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


def _parse_command(command: str) -> ParsedCommand:
    """
    Parse a natural language command into actionable steps.
    
    Supports:
    - Single commands: "feed my pet"
    - Multi-step commands: "feed my pet then play fetch"
    - Invalid commands: gracefully handles with suggestions
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
            logger.debug(f"Parsed step: {parsed_step.action} with confidence {parsed_step.confidence:.2f}")
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
        
        # Generate contextual suggestions
        if confidence < 0.5:
            suggestions.append("Command parsed with low confidence. Please be more specific.")
        
        # Suggest related actions
        executed_actions = {step.action for step in steps}
        if "feed" not in executed_actions:
            suggestions.append("Your pet might be hungry. Try: 'feed my pet'")
        if "play" not in executed_actions:
            suggestions.append("Want to have fun? Try: 'play fetch with my pet'")
        if "sleep" not in executed_actions:
            suggestions.append("Is your pet tired? Try: 'let my pet sleep'")
    
    can_execute = len(steps) > 0 and all(step.confidence >= 0.3 for step in steps)
    
    return ParsedCommand(
        steps=steps,
        confidence=confidence,
        original_command=command,
        suggestions=suggestions,
        can_execute=can_execute,
    )


async def _execute_feed(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a feed command."""
    food_type = parameters.get("food_type", "standard")
    logger.info(f"Executing feed command with food_type: {food_type}")
    
    try:
        response = await pet_service.feed_pet(session, user_id, food_type)
        
        # Extract stat changes from diary entry
        stat_changes = {}
        if response.pet.stats:
            # Calculate changes (simplified - in production, track before/after)
            stat_changes = {
                "hunger": response.pet.stats.hunger - pet.hunger,
                "happiness": response.pet.stats.happiness - pet.happiness,
            }
        
        return CommandResult(
            success=True,
            action="feed",
            message=response.reaction,
            stat_changes=stat_changes,
            pet_state={
                "hunger": response.pet.stats.hunger,
                "happiness": response.pet.stats.happiness,
                "health": response.pet.stats.health,
                "mood": response.pet.mood,
            },
        )
    except Exception as e:
        logger.error(f"Error executing feed command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="feed",
            message=f"Failed to feed pet: {str(e)}",
        )


async def _execute_play(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a play command."""
    game_type = parameters.get("game_type", "free_play")
    logger.info(f"Executing play command with game_type: {game_type}")
    
    try:
        response = await pet_service.play_with_pet(session, user_id, game_type)
        
        stat_changes = {}
        if response.pet.stats:
            stat_changes = {
                "happiness": response.pet.stats.happiness - pet.happiness,
                "energy": response.pet.stats.energy - pet.energy,
            }
        
        return CommandResult(
            success=True,
            action="play",
            message=response.reaction,
            stat_changes=stat_changes,
            pet_state={
                "happiness": response.pet.stats.happiness,
                "energy": response.pet.stats.energy,
                "mood": response.pet.mood,
            },
        )
    except Exception as e:
        logger.error(f"Error executing play command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="play",
            message=f"Failed to play with pet: {str(e)}",
        )


async def _execute_sleep(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a sleep/rest command."""
    duration_hours = parameters.get("duration_hours", 4)
    logger.info(f"Executing sleep command with duration: {duration_hours} hours")
    
    try:
        response = await pet_service.rest_pet(session, user_id, duration_hours)
        
        stat_changes = {}
        if response.pet.stats:
            stat_changes = {
                "energy": response.pet.stats.energy - pet.energy,
                "health": response.pet.stats.health - pet.health,
            }
        
        return CommandResult(
            success=True,
            action="sleep",
            message=response.reaction,
            stat_changes=stat_changes,
            pet_state={
                "energy": response.pet.stats.energy,
                "health": response.pet.stats.health,
                "mood": response.pet.mood,
            },
        )
    except Exception as e:
        logger.error(f"Error executing sleep command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="sleep",
            message=f"Failed to let pet rest: {str(e)}",
        )


async def _execute_bathe(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a bathe/clean command."""
    logger.info("Executing bathe command")
    
    try:
        response = await pet_service.bathe_pet(session, user_id)
        
        stat_changes = {}
        if response.pet.stats:
            stat_changes = {
                "cleanliness": response.pet.stats.cleanliness - pet.cleanliness,
                "happiness": response.pet.stats.happiness - pet.happiness,
            }
        
        return CommandResult(
            success=True,
            action="bathe",
            message=response.reaction,
            stat_changes=stat_changes,
            pet_state={
                "cleanliness": response.pet.stats.cleanliness,
                "happiness": response.pet.stats.happiness,
                "mood": response.pet.mood,
            },
        )
    except Exception as e:
        logger.error(f"Error executing bathe command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="bathe",
            message=f"Failed to bathe pet: {str(e)}",
        )


async def _execute_status(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a status check command."""
    logger.info("Executing status check command")
    
    try:
        # Format pet status information
        stats = pet.stats if pet.stats else {}
        status_message = (
            f"{pet.name}'s current status:\n"
            f"Health: {stats.get('health', pet.health)}%\n"
            f"Happiness: {stats.get('happiness', pet.happiness)}%\n"
            f"Hunger: {stats.get('hunger', pet.hunger)}%\n"
            f"Energy: {stats.get('energy', pet.energy)}%\n"
            f"Cleanliness: {stats.get('cleanliness', pet.cleanliness)}%\n"
            f"Mood: {pet.mood}"
        )
        
        return CommandResult(
            success=True,
            action="status",
            message=status_message,
            pet_state={
                "health": stats.get('health', pet.health),
                "happiness": stats.get('happiness', pet.happiness),
                "hunger": stats.get('hunger', pet.hunger),
                "energy": stats.get('energy', pet.energy),
                "cleanliness": stats.get('cleanliness', pet.cleanliness),
                "mood": pet.mood,
            },
        )
    except Exception as e:
        logger.error(f"Error executing status command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="status",
            message=f"Failed to check status: {str(e)}",
        )


async def _execute_analytics(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute an analytics command."""
    logger.info("Executing analytics command")
    
    try:
        return CommandResult(
            success=True,
            action="analytics",
            message="Navigate to the analytics dashboard to view detailed reports, trends, and AI insights about your pet's care.",
        )
    except Exception as e:
        logger.error(f"Error executing analytics command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="analytics",
            message=f"Failed to access analytics: {str(e)}",
        )


async def _execute_quests(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a quests command."""
    logger.info("Executing quests command")
    
    try:
        return CommandResult(
            success=True,
            action="quests",
            message="Navigate to the quest dashboard to view your active challenges, daily quests, and weekly missions.",
        )
    except Exception as e:
        logger.error(f"Error executing quests command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="quests",
            message=f"Failed to access quests: {str(e)}",
        )


async def _execute_shop(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a shop command."""
    logger.info("Executing shop command")
    
    try:
        return CommandResult(
            success=True,
            action="shop",
            message="Navigate to the shop to browse items, toys, food, and accessories for your pet.",
        )
    except Exception as e:
        logger.error(f"Error executing shop command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="shop",
            message=f"Failed to access shop: {str(e)}",
        )


async def _execute_budget(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a budget command."""
    logger.info("Executing budget command")
    
    try:
        return CommandResult(
            success=True,
            action="budget",
            message="Navigate to the budget dashboard to view your finances, transactions, spending, and savings goals.",
        )
    except Exception as e:
        logger.error(f"Error executing budget command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="budget",
            message=f"Failed to access budget: {str(e)}",
        )


async def _execute_trick(
    session: AsyncSession,
    user_id: UUID | str,
    parameters: Dict[str, Any],
    pet: Pet,
) -> CommandResult:
    """Execute a trick command."""
    trick_type = parameters.get("trick_type", "sit")
    logger.info(f"Executing trick command with trick_type: {trick_type}")
    
    # Tricks are simulated - they boost happiness and XP
    # In a full implementation, this would interact with a tricks/training system
    try:
        # For now, tricks are treated as a form of play
        # This could be extended to a dedicated trick system
        response = await pet_service.play_with_pet(session, user_id, "trick")
        
        stat_changes = {}
        if response.pet.stats:
            stat_changes = {
                "happiness": response.pet.stats.happiness - pet.happiness,
            }
        
        trick_messages = {
            "sit": f"{pet.name} sits down obediently!",
            "stay": f"{pet.name} stays perfectly still!",
            "roll": f"{pet.name} rolls over with enthusiasm!",
            "shake": f"{pet.name} offers a paw for a handshake!",
            "speak": f"{pet.name} makes a happy sound!",
            "fetch": f"{pet.name} fetches the toy and brings it back!",
        }
        
        message = trick_messages.get(trick_type, f"{pet.name} performs the {trick_type} trick!")
        
        return CommandResult(
            success=True,
            action="trick",
            message=message,
            stat_changes=stat_changes,
            pet_state={
                "happiness": response.pet.stats.happiness,
                "mood": response.pet.mood,
            },
        )
    except Exception as e:
        logger.error(f"Error executing trick command: {e}", exc_info=True)
        return CommandResult(
            success=False,
            action="trick",
            message=f"Failed to perform trick: {str(e)}",
        )


async def execute_command(
    session: AsyncSession,
    user_id: UUID | str,
    command: str,
) -> Dict[str, Any]:
    """
    Execute a natural language command for a pet.
    
    This is the main entry point for processing pet commands. It:
    1. Parses the command into actionable steps
    2. Executes each step in sequence
    3. Returns structured results with suggestions
    4. Verifies database connectivity and pet existence
    
    Args:
        session: Database session
        user_id: User ID
        command: Natural language command string
        
    Returns:
        Dictionary with execution results, suggestions, and metadata
    """
    logger.info(
        f"Processing command for user {user_id} - "
        f"Command: '{command[:100]}', Session: {session is not None}"
    )
    
    # Validate input
    if not command or not command.strip():
        logger.warning(f"Empty command received from user {user_id}")
        return {
            "success": False,
            "message": "Command cannot be empty. Please provide a command like 'feed my pet' or 'play fetch'.",
            "suggestions": [
                "Try commands like: 'feed my pet', 'play fetch', 'let my pet sleep'",
                "You can combine commands: 'feed my pet then play fetch'",
            ],
            "results": [],
            "confidence": 0.0,
        }
    
    # Parse the command
    parsed = _parse_command(command)
    
    # Get pet for context - verify database connection
    try:
        logger.debug(f"Fetching pet from database for user {user_id}")
        pet = await pet_service.get_pet_by_user(session, user_id)
        if not pet:
            logger.warning(f"Pet not found for user {user_id} - user needs to create a pet")
            return {
                "success": False,
                "message": "Pet not found. Please create a pet first.",
                "suggestions": [
                    "Create a pet to start caring for your virtual companion.",
                    "Visit the pet creation page to get started.",
                ],
                "results": [],
                "confidence": 0.0,
            }
        logger.debug(f"Pet found: {pet.name} (ID: {pet.id}, Species: {pet.species})")
    except Exception as e:
        logger.error(
            f"Database error fetching pet for user {user_id}: {e}",
            exc_info=True
        )
        return {
            "success": False,
            "message": f"Error accessing pet: {str(e)}",
            "suggestions": [
                "Please try again later.",
                "If the problem persists, contact support.",
            ],
            "results": [],
            "confidence": 0.0,
        }
    
    # Fetch the actual pet model for stat tracking
    # Import here to avoid circular dependency
    try:
        from app.services.pet_service import _fetch_pet as fetch_pet_model
        logger.debug(f"Fetching pet model for stat tracking (user {user_id})")
        pet_model = await fetch_pet_model(session, user_id)
        logger.debug(
            f"Pet model loaded - Stats: hunger={pet_model.hunger}, "
            f"happiness={pet_model.happiness}, energy={pet_model.energy}, "
            f"health={pet_model.health}, mood={pet_model.mood}"
        )
    except Exception as e:
        logger.error(f"Error fetching pet model: {e}", exc_info=True)
        return {
            "success": False,
            "message": f"Error loading pet data: {str(e)}",
            "suggestions": ["Please try again later."],
            "results": [],
            "confidence": 0.0,
        }
    
    # Execute steps
    results: List[Dict[str, Any]] = []
    all_successful = True
    
    if not parsed.can_execute:
        logger.warning(f"Command cannot be executed: {command}")
        return {
            "success": False,
            "message": "I couldn't understand that command. Please try rephrasing.",
            "suggestions": parsed.suggestions,
            "results": [],
            "confidence": parsed.confidence,
            "original_command": command,
            "steps_executed": 0,
        }
    
    for step_idx, step in enumerate(parsed.steps, 1):
        logger.info(
            f"Executing step {step_idx}/{len(parsed.steps)}: {step.action} "
            f"with parameters {step.parameters} (confidence: {step.confidence:.2f})"
        )
        
        try:
            if step.action == "feed":
                result = await _execute_feed(session, user_id, step.parameters, pet_model)
            elif step.action == "play":
                result = await _execute_play(session, user_id, step.parameters, pet_model)
            elif step.action == "sleep":
                result = await _execute_sleep(session, user_id, step.parameters, pet_model)
            elif step.action == "bathe":
                result = await _execute_bathe(session, user_id, step.parameters, pet_model)
            elif step.action == "trick":
                result = await _execute_trick(session, user_id, step.parameters, pet_model)
            elif step.action == "status":
                result = await _execute_status(session, user_id, step.parameters, pet_model)
            elif step.action == "analytics":
                result = await _execute_analytics(session, user_id, step.parameters, pet_model)
            elif step.action == "quests":
                result = await _execute_quests(session, user_id, step.parameters, pet_model)
            elif step.action == "shop":
                result = await _execute_shop(session, user_id, step.parameters, pet_model)
            elif step.action == "budget":
                result = await _execute_budget(session, user_id, step.parameters, pet_model)
            else:
                logger.warning(f"Unknown action '{step.action}' in step {step_idx}")
                result = CommandResult(
                    success=False,
                    action=step.action,
                    message=f"Unknown action: {step.action}",
                )
            
            if not result.success:
                logger.warning(f"Step {step_idx} ({step.action}) failed: {result.message}")
                all_successful = False
            else:
                logger.debug(
                    f"Step {step_idx} ({step.action}) succeeded - "
                    f"Stat changes: {result.stat_changes}"
                )
            
            results.append({
                "action": result.action,
                "success": result.success,
                "message": result.message,
                "stat_changes": result.stat_changes,
                "pet_state": result.pet_state,
            })
            
            # Refresh pet model for next step to get updated stats
            try:
                pet_model = await fetch_pet_model(session, user_id)
                logger.debug(f"Pet model refreshed after step {step_idx}")
            except Exception as refresh_error:
                logger.error(
                    f"Error refreshing pet model after step {step_idx}: {refresh_error}",
                    exc_info=True
                )
                # Continue with previous pet_model state
            
        except Exception as e:
            logger.error(
                f"Error executing step {step_idx} ({step.action}): {e}",
                exc_info=True
            )
            all_successful = False
            results.append({
                "action": step.action,
                "success": False,
                "message": f"Error executing {step.action}: {str(e)}",
            })
    
    # Generate final message
    if all_successful and results:
        if len(results) == 1:
            message = results[0]["message"]
        else:
            message = f"Completed {len(results)} actions successfully!"
    elif results:
        successful_count = sum(1 for r in results if r.get("success"))
        message = f"Completed {successful_count} of {len(results)} actions."
    else:
        message = "No actions were executed."
    
    # Add contextual suggestions
    final_suggestions = parsed.suggestions.copy()
    if all_successful and pet_model:
        # Check pet stats and suggest care
        if pet_model.hunger < 50:
            final_suggestions.append("Your pet might be getting hungry soon.")
        if pet_model.energy < 50:
            final_suggestions.append("Your pet could use some rest.")
        if pet_model.cleanliness < 50:
            final_suggestions.append("Consider giving your pet a bath.")
    
    logger.info(
        f"Command execution completed for user {user_id} - "
        f"Success: {all_successful}, Steps executed: {len(results)}, "
        f"Confidence: {parsed.confidence:.2f}, Suggestions: {len(final_suggestions)}"
    )
    
    return {
        "success": all_successful,
        "message": message,
        "suggestions": final_suggestions,
        "results": results,
        "confidence": parsed.confidence,
        "original_command": command,
        "steps_executed": len(results),
    }

