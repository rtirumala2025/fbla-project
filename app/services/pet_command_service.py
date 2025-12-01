"""
Pet Command AI Service

This service processes natural language commands for virtual pets.
Refactored to use modular voice command processing.

This is a compatibility wrapper that maintains the original API while using
the new modular voice command system.
"""

from __future__ import annotations

from typing import Any, Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.services.voice import execute_command as voice_execute_command

# Re-export for backward compatibility
from app.services.voice import (
    CommandResult,
    CommandStep,
    ParsedCommand,
)

__all__ = [
    "CommandResult",
    "CommandStep",
    "ParsedCommand",
    "execute_command",
]


async def execute_command(
    session: AsyncSession,
    user_id: UUID | str,
    command: str,
) -> Dict[str, Any]:
    """
    Execute a natural language command for a pet.
    
    This is the main entry point for processing pet commands. It delegates
    to the modular voice command system.
    
    Args:
        session: Database session
        user_id: User ID
        command: Natural language command string
        
    Returns:
        Dictionary with execution results, suggestions, and metadata
    """
    return await voice_execute_command(session, user_id, command)

