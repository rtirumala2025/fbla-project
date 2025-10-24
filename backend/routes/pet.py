"""
Pet Interaction Endpoints

Handles all pet-related interactions including feeding, playing, and status checks.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging

# Import services
from ..services.pet_intelligence import pet_intelligence
from ..mcp.context_manager import context_manager, PetState, PetMood
from ..services.ai_service import ai_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/pet", tags=["Pet"])

# Request/Response Models
class PetInteractionRequest(BaseModel):
    session_id: str = Field(..., description="Unique session identifier")
    action: str = Field(..., description="Action to perform (feed, play, sleep, pet, train, clean, talk, status)")
    message: Optional[str] = Field(None, description="Message for talk action")

class PetInteractionResponse(BaseModel):
    success: bool = Field(..., description="Whether the interaction was successful")
    message: str = Field(..., description="Response message from the pet")
    pet_state: Optional[Dict[str, Any]] = Field(None, description="Updated pet state")
    action: Optional[str] = Field(None, description="The action that was performed")

class PetStatusResponse(BaseModel):
    status: str = Field(..., description="Current status of the pet")
    mood: str = Field(..., description="Current mood of the pet")
    stats: Dict[str, float] = Field(..., description="Pet statistics")
    last_updated: Optional[datetime] = Field(None, description="When the pet's state was last updated")

# Helper function to get default pet state
def get_default_pet_state() -> PetState:
    return PetState(
        mood=PetMood.NEUTRAL,
        happiness=50.0,
        energy=80.0,
        hunger=30.0,
        cleanliness=75.0,
        last_fed=None,
        last_played=None,
        last_slept=None,
        last_cleaned=datetime.utcnow().isoformat(),
        created_at=datetime.utcnow().isoformat(),
        updated_at=datetime.utcnow().isoformat()
    )

@router.post("/interact", response_model=PetInteractionResponse)
async def interact_with_pet(request: PetInteractionRequest):
    """
    Interact with the virtual pet.
    
    Available actions:
    - feed: Feed the pet
    - play: Play with the pet
    - sleep: Put the pet to sleep
    - pet: Pet the animal
    - train: Train the pet
    - clean: Clean the pet
    - talk: Send a message to the pet
    - status: Get current pet status
    """
    try:
        # Get or create session
        session = await context_manager.get_or_create_session(request.session_id)
        
        # Initialize pet state if it doesn't exist
        if 'pet_state' not in session.metadata:
            session.metadata['pet_state'] = get_default_pet_state().dict()
        
        # Get current pet state
        current_state = PetState(**session.metadata['pet_state'])
        
        # Handle different actions
        action = request.action.lower()
        
        if action == 'status':
            return {
                "success": True,
                "message": f"Your pet is currently {current_state.mood.value}.",
                "pet_state": current_state.dict(),
                "action": "status"
            }
            
        elif action == 'feed':
            # Update pet state
            current_state.hunger = max(0, current_state.hunger - 30)  # Reduce hunger
            current_state.happiness = min(100, current_state.happiness + 10)  # Increase happiness
            current_state.energy = min(100, current_state.energy + 5)  # Slight energy boost
            current_state.last_fed = datetime.utcnow().isoformat()
            current_state.updated_at = datetime.utcnow().isoformat()
            
            # Update mood based on stats
            if current_state.hunger < 20:
                current_state.mood = PetMood.HAPPY
            
            # Save updated state
            session.metadata['pet_state'] = current_state.dict()
            await context_manager.update_session(
                session_id=request.session_id,
                role="system",
                content=f"User fed the pet. Hunger: {current_state.hunger}%"
            )
            
            return {
                "success": True,
                "message": "Yum! That was delicious! 🍖",
                "pet_state": current_state.dict(),
                "action": "feed"
            }
            
        elif action == 'play':
            # Check if pet has enough energy
            if current_state.energy < 20:
                return {
                    "success": False,
                    "message": "Your pet is too tired to play right now. Maybe let them rest? 😴",
                    "pet_state": current_state.dict(),
                    "action": "play"
                }
            
            # Update pet state
            current_state.energy = max(0, current_state.energy - 20)  # Decrease energy
            current_state.happiness = min(100, current_state.happiness + 15)  # Increase happiness
            current_state.hunger = min(100, current_state.hunger + 10)  # Increase hunger
            current_state.last_played = datetime.utcnow().isoformat()
            current_state.updated_at = datetime.utcnow().isoformat()
            
            # Update mood
            if current_state.happiness > 70:
                current_state.mood = PetMood.EXCITED
            
            # Save updated state
            session.metadata['pet_state'] = current_state.dict()
            await context_manager.update_session(
                session_id=request.session_id,
                role="system",
                content=f"User played with the pet. Energy: {current_state.energy}%"
            )
            
            return {
                "success": True,
                "message": "Woo-hoo! That was fun! 🎾",
                "pet_state": current_state.dict(),
                "action": "play"
            }
            
        elif action == 'sleep':
            # Update pet state
            current_state.energy = min(100, current_state.energy + 40)  # Restore energy
            current_state.happiness = min(100, current_state.happiness + 5)  # Slight happiness boost
            current_state.last_slept = datetime.utcnow().isoformat()
            current_state.updated_at = datetime.utcnow().isoformat()
            
            # Update mood
            if current_state.energy > 80:
                current_state.mood = PetMood.HAPPY
            
            # Save updated state
            session.metadata['pet_state'] = current_state.dict()
            await context_manager.update_session(
                session_id=request.session_id,
                role="system",
                content=f"Pet went to sleep. Energy: {current_state.energy}%"
            )
            
            return {
                "success": True,
                "message": "Zzz... *gentle snoring* 😴",
                "pet_state": current_state.dict(),
                "action": "sleep"
            }
            
        elif action == 'pet':
            # Update pet state
            current_state.happiness = min(100, current_state.happiness + 10)  # Increase happiness
            current_state.updated_at = datetime.utcnow().isoformat()
            
            # Update mood
            if current_state.happiness > 60:
                current_state.mood = PetMood.HAPPY
            
            # Save updated state
            session.metadata['pet_state'] = current_state.dict()
            
            return {
                "success": True,
                "message": "*purrs happily* 😊",
                "pet_state": current_state.dict(),
                "action": "pet"
            }
            
        elif action == 'clean':
            # Update pet state
            current_state.cleanliness = 100  # Max cleanliness
            current_state.happiness = min(100, current_state.happiness + 5)  # Slight happiness boost
            current_state.last_cleaned = datetime.utcnow().isoformat()
            current_state.updated_at = datetime.utcnow().isoformat()
            
            # Save updated state
            session.metadata['pet_state'] = current_state.dict()
            await context_manager.update_session(
                session_id=request.session_id,
                role="system",
                content="Pet was cleaned"
            )
            
            return {
                "success": True,
                "message": "*shakes off water* All clean now! 🛁",
                "pet_state": current_state.dict(),
                "action": "clean"
            }
            
        elif action == 'talk':
            if not request.message:
                return {
                    "success": False,
                    "message": "Please provide a message to say to your pet.",
                    "action": "talk"
                }
            
            # Generate a response using the AI service
            try:
                # Prepare the prompt with pet's current state
                prompt = (
                    f"You are a virtual pet with a {current_state.mood.value} mood. "
                    f"Your current stats: {current_state.dict()}\n\n"
                    f"User: {request.message}\n"
                    "Respond naturally as the pet would, keeping it brief and in character."
                )
                
                # Get AI response
                response = ""
                async for chunk in ai_service.get_ai_response(
                    message=prompt,
                    model="meta-llama/llama-3-70b-instruct",
                    temperature=0.7,
                    max_tokens=150
                ):
                    response += chunk
                
                # Update session with the conversation
                await context_manager.update_session(
                    session_id=request.session_id,
                    role="user",
                    content=request.message
                )
                
                await context_manager.update_session(
                    session_id=request.session_id,
                    role="assistant",
                    content=response
                )
                
                # Slight happiness boost from interaction
                current_state.happiness = min(100, current_state.happiness + 5)
                current_state.updated_at = datetime.utcnow().isoformat()
                session.metadata['pet_state'] = current_state.dict()
                
                return {
                    "success": True,
                    "message": response,
                    "pet_state": current_state.dict(),
                    "action": "talk"
                }
                
            except Exception as e:
                logger.error(f"Error generating AI response: {e}")
                return {
                    "success": False,
                    "message": "*confused pet noises* I'm having trouble understanding right now.",
                    "pet_state": current_state.dict(),
                    "action": "talk"
                }
        else:
            return {
                "success": False,
                "message": f"Unknown action: {action}. Try feed, play, sleep, pet, train, clean, or talk.",
                "pet_state": current_state.dict(),
                "action": action
            }
            
    except Exception as e:
        logger.error(f"Error in pet interaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your request"
        )

@router.get("/status/{session_id}", response_model=PetStatusResponse)
async def get_pet_status(session_id: str):
    """Get the current status of a pet by session ID"""
    try:
        session = await context_manager.get_or_create_session(session_id)
        
        # Initialize pet state if it doesn't exist
        if 'pet_state' not in session.metadata:
            session.metadata['pet_state'] = get_default_pet_state().dict()
        
        current_state = PetState(**session.metadata['pet_state'])
        
        return {
            "status": "active",
            "mood": current_state.mood.value,
            "stats": {
                "happiness": current_state.happiness,
                "energy": current_state.energy,
                "hunger": current_state.hunger,
                "cleanliness": current_state.cleanliness
            },
            "last_updated": current_state.updated_at
        }
        
    except Exception as e:
        logger.error(f"Error getting pet status: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve pet status"
        )
