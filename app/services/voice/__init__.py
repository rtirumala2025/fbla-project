"""Voice command processing modules."""
from __future__ import annotations

from .command_patterns import (
    COMMAND_PATTERNS,
    FOOD_PATTERNS,
    GAME_PATTERNS,
    MULTI_STEP_CONNECTORS,
    TRICK_PATTERNS,
)
from .command_parser import CommandStep, ParsedCommand, parse_command
from .command_executor import CommandResult, execute_command

__all__ = [
    "COMMAND_PATTERNS",
    "FOOD_PATTERNS",
    "GAME_PATTERNS",
    "MULTI_STEP_CONNECTORS",
    "TRICK_PATTERNS",
    "CommandStep",
    "ParsedCommand",
    "CommandResult",
    "parse_command",
    "execute_command",
]
