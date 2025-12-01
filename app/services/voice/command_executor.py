"""
Command execution logic for voice commands.

Handles execution of parsed commands with error handling and result tracking.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, List
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.pet import Pet
from app.services import pet_service

from .command_parser import CommandStep, ParsedCommand, parse_command

logger = logging.getLogger(__name__)


@dataclass
class CommandResult:
    """Result of executing a single command step."""

    success: bool
    action: str
    message: str
    stat_changes: Dict[str, int] | None = None
    pet_state: Dict[str, Any] | None = None


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
                "health": stats.get("health", pet.health),
                "happiness": stats.get("happiness", pet.happiness),
                "hunger": stats.get("hunger", pet.hunger),
                "energy": stats.get("energy", pet.energy),
                "cleanliness": stats.get("cleanliness", pet.cleanliness),
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
    parsed = parse_command(command)

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
