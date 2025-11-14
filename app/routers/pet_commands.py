"""
Pet Command AI Router

This router provides a natural language interface for controlling virtual pets.
Supports single and multi-step commands with graceful error handling.

Production-ready endpoint with comprehensive logging and fail-safe responses.
"""

from __future__ import annotations

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.jwt import get_current_user_id
from app.schemas.pet import PetCommandAIRequest, PetCommandAIResponse
from app.services import pet_command_service
from app.services.pet_service import PetNotFoundError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pets/commands", tags=["Pet Commands"])


@router.post(
    "/execute",
    response_model=PetCommandAIResponse,
    status_code=status.HTTP_200_OK,
    summary="Execute Natural Language Pet Command",
    description=(
        "Process and execute natural language commands for virtual pets. "
        "Supports single commands (e.g., 'feed my pet') and multi-step commands "
        "(e.g., 'feed my pet then play fetch'). Returns structured results with "
        "suggestions and graceful handling of invalid input."
    ),
    responses={
        200: {
            "description": "Command processed successfully (may include partial failures)",
            "content": {
                "application/json": {
                    "example": {
                        "success": True,
                        "message": "That meal hit the spot! I'm ready for more adventures.",
                        "suggestions": ["Your pet might be getting hungry soon."],
                        "results": [
                            {
                                "action": "feed",
                                "success": True,
                                "message": "That meal hit the spot! I'm ready for more adventures.",
                                "stat_changes": {"hunger": 20, "happiness": 4},
                                "pet_state": {"hunger": 90, "happiness": 74, "health": 83, "mood": "happy"},
                            }
                        ],
                        "confidence": 0.8,
                        "original_command": "feed my pet",
                        "steps_executed": 1,
                    }
                }
            },
        },
        400: {
            "description": "Invalid request or command format",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Command cannot be empty"
                    }
                }
            },
        },
        404: {
            "description": "Pet not found for user",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Pet not found. Please create a pet first."
                    }
                }
            },
        },
        500: {
            "description": "Internal server error",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "An error occurred processing the command"
                    }
                }
            },
        },
    },
)
async def execute_pet_command(
    payload: PetCommandAIRequest,
    session: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
) -> PetCommandAIResponse:
    """
    Execute a natural language command for the authenticated user's pet.
    
    This endpoint accepts free-form text commands and processes them into
    actionable pet care steps. It supports:
    
    - **Single commands**: "feed my pet", "play fetch", "let my pet sleep"
    - **Multi-step commands**: "feed my pet then play fetch", "bathe and feed my pet"
    - **Invalid input**: Returns helpful suggestions when commands cannot be understood
    
    The endpoint includes:
    - Comprehensive logging for debugging and monitoring
    - Graceful error handling with fail-safe fallback responses
    - Structured JSON responses with execution results and suggestions
    - Confidence scoring for command parsing
    
    Args:
        payload: Request containing the natural language command
        session: Database session (injected)
        user_id: Authenticated user ID (injected)
        
    Returns:
        PetCommandAIResponse with execution results, suggestions, and metadata
        
    Raises:
        HTTPException: 400 if command is invalid, 404 if pet not found, 500 on server errors
    """
    logger.info(f"Received pet command request from user {user_id}: {payload.command[:100]}")
    
    # Validate command is not empty
    if not payload.command or not payload.command.strip():
        logger.warning(f"Empty command received from user {user_id}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Command cannot be empty. Please provide a command like 'feed my pet' or 'play fetch'.",
        )
    
    try:
        # Execute the command through the service layer
        result = await pet_command_service.execute_command(
            session=session,
            user_id=user_id,
            command=payload.command,
        )
        
        # Convert service result to response schema
        response = PetCommandAIResponse(
            success=result["success"],
            message=result["message"],
            suggestions=result.get("suggestions", []),
            results=result.get("results", []),
            confidence=result.get("confidence", 0.0),
            original_command=result.get("original_command", payload.command),
            steps_executed=result.get("steps_executed", 0),
        )
        
        logger.info(
            f"Command execution completed for user {user_id}. "
            f"Success: {response.success}, Steps: {response.steps_executed}, Confidence: {response.confidence:.2f}"
        )
        
        return response
        
    except PetNotFoundError as e:
        logger.warning(f"Pet not found for user {user_id}: {e}")
        # Return a structured response even when pet is not found
        return PetCommandAIResponse(
            success=False,
            message="Pet not found. Please create a pet first.",
            suggestions=[
                "Create a pet to start caring for your virtual companion.",
                "Visit the pet creation page to get started.",
            ],
            results=[],
            confidence=0.0,
            original_command=payload.command,
            steps_executed=0,
        )
    except ValueError as e:
        logger.warning(f"Invalid command from user {user_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid command: {str(e)}",
        )
    except Exception as e:
        logger.error(
            f"Unexpected error processing command for user {user_id}: {e}",
            exc_info=True,
        )
        # Fail-safe fallback response
        return PetCommandAIResponse(
            success=False,
            message="I encountered an error processing your command. Please try again or rephrase your request.",
            suggestions=[
                "Try simpler commands like 'feed my pet' or 'play fetch'",
                "Check that your pet exists and is accessible",
                "If the problem persists, contact support",
            ],
            results=[],
            confidence=0.0,
            original_command=payload.command,
            steps_executed=0,
        )

