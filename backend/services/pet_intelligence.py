"""
Pet Intelligence Service

Handles the AI-driven emotional states, behaviors, and interactions of virtual pets.
Integrates with the AI service to generate contextual responses and update pet states.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, AsyncGenerator
from enum import Enum
import random
import json

from fastapi import HTTPException, status
from pydantic import BaseModel, Field, validator

# Import the AI service and context manager
from .ai_service import ai_service
from ..mcp.context_manager import context_manager, MessageRole, PetState, PetMood

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PetAction(str, Enum):
    """Actions that can be performed on/with the pet"""
    FEED = "feed"
    PLAY = "play"
    SLEEP = "sleep"
    PET = "pet"
    TRAIN = "train"
    CLEAN = "clean"
    TALK = "talk"

class PetResponse(BaseModel):
    """Response from a pet interaction"""
    action: PetAction
    message: str
    state_changes: Dict[str, Any] = {}
    mood_impact: int = 0  # -10 to 10
    energy_cost: int = 0
    cooldown: int = 0  # seconds until this action can be performed again

class PetIntelligence:
    """Manages the AI-driven behavior of virtual pets"""
    
    def __init__(self):
        self.action_cooldowns: Dict[str, datetime] = {}
        self.action_effects = {
            PetAction.FEED: self._handle_feed,
            PetAction.PLAY: self._handle_play,
            PetAction.SLEEP: self._handle_sleep,
            PetAction.PET: self._handle_pet,
            PetAction.TRAIN: self._handle_train,
            PetAction.CLEAN: self._handle_clean,
            PetAction.TALK: self._handle_talk,
        }
    
    async def process_interaction(
        self,
        session_id: str,
        action: PetAction,
        message: Optional[str] = None,
        **kwargs
    ) -> PetResponse:
        """
        Process an interaction with the pet
        
        Args:
            session_id: The session ID
            action: The action to perform
            message: Optional message for TALK action
            **kwargs: Additional parameters for the action
            
        Returns:
            PetResponse with the result of the interaction
        """
        # Check cooldown
        if self._is_on_cooldown(session_id, action):
            return PetResponse(
                action=action,
                message="I need a break! Try again later.",
                mood_impact=-2
            )
        
        # Get the handler for this action
        handler = self.action_effects.get(action)
        if not handler:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid action: {action}"
            )
        
        # Get the session
        session = await context_manager.get_or_create_session(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Session not found"
            )
        
        # Process the action
        try:
            response = await handler(session, message=message, **kwargs)
            
            # Update the session with the new state
            if response.state_changes:
                session.update_pet_state(**response.state_changes)
            
            # Add to chat history if this was a TALK action
            if action == PetAction.TALK and message:
                await context_manager.update_session(
                    session_id=session_id,
                    role=MessageRole.USER,
                    content=message,
                    action="talk"
                )
                
                # Generate AI response
                ai_response = await self._generate_ai_response(session, message)
                
                # Add AI response to chat history
                await context_manager.update_session(
                    session_id=session_id,
                    role=MessageRole.ASSISTANT,
                    content=ai_response,
                    action="respond"
                )
                
                response.message = ai_response
            
            # Set cooldown
            if response.cooldown > 0:
                self._set_cooldown(session_id, action, response.cooldown)
            
            return response
            
        except Exception as e:
            logger.error(f"Error processing {action} action: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to process {action} action"
            )
    
    async def _generate_ai_response(
        self, 
        session: Any,  # SessionContext
        message: str
    ) -> str:
        """Generate an AI response based on the current context"""
        try:
            # Get the current pet state
            pet_state = session.metadata.get('pet_state', {})
            mood = pet_state.get('mood', 'neutral')
            
            # Prepare the prompt
            prompt = (
                f"You are a virtual pet with a {mood} mood. "
                f"Your current stats: {json.dumps(pet_state, indent=2)}\n\n"
                f"User: {message}\n"
                "Respond naturally as the pet would, keeping it brief and in character."
            )
            
            # Generate response using the AI service
            response_parts = []
            async for chunk in ai_service.get_ai_response(
                message=prompt,
                model="meta-llama/llama-3-70b-instruct",
                temperature=0.7,
                max_tokens=150
            ):
                response_parts.append(chunk)
            
            return "".join(response_parts).strip()
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}", exc_info=True)
            return "*happy noises*"  # Fallback response
    
    # Action handlers
    async def _handle_feed(self, session: Any, **kwargs) -> PetResponse:
        pet_state = session.metadata.get('pet_state', {})
        hunger = pet_state.get('hunger', 50)
        happiness = pet_state.get('happiness', 50)
        
        # Calculate effects
        hunger_change = -random.randint(15, 25)
        happiness_change = random.randint(5, 10)
        
        return PetResponse(
            action=PetAction.FEED,
            message="Yum! That was delicious!",
            state_changes={
                'hunger': max(0, hunger + hunger_change),
                'happiness': min(100, happiness + happiness_change),
                'last_fed': datetime.utcnow().isoformat()
            },
            mood_impact=2,
            energy_cost=5,
            cooldown=300  # 5 minutes
        )
    
    async def _handle_play(self, session: Any, **kwargs) -> PetResponse:
        pet_state = session.metadata.get('pet_state', {})
        energy = pet_state.get('energy', 50)
        happiness = pet_state.get('happiness', 50)
        
        # Calculate effects
        energy_change = -random.randint(10, 20)
        happiness_change = random.randint(10, 20)
        
        # Different responses based on energy level
        if energy + energy_change < 20:
            message = "*pants* I'm getting tired..."
            happiness_change = max(5, happiness_change // 2)  # Reduced happiness when tired
        else:
            messages = [
                "This is fun! Let's play more!",
                "Wheee! I love playing!",
                "*excited noises*",
                "Can we do that again?"
            ]
            message = random.choice(messages)
        
        return PetResponse(
            action=PetAction.PLAY,
            message=message,
            state_changes={
                'energy': max(0, energy + energy_change),
                'happiness': min(100, happiness + happiness_change),
                'last_played': datetime.utcnow().isoformat()
            },
            mood_impact=3,
            energy_cost=15,
            cooldown=180  # 3 minutes
        )
    
    async def _handle_sleep(self, session: Any, **kwargs) -> PetResponse:
        pet_state = session.metadata.get('pet_state', {})
        energy = pet_state.get('energy', 50)
        
        # Calculate energy recovery (more if very tired)
        energy_recovery = 30 if energy < 30 else 15
        
        return PetResponse(
            action=PetAction.SLEEP,
            message="Zzz... *gentle snoring*",
            state_changes={
                'energy': min(100, energy + energy_recovery),
                'last_slept': datetime.utcnow().isoformat()
            },
            mood_impact=1,
            cooldown=600  # 10 minutes
        )
    
    async def _handle_pet(self, session: Any, **kwargs) -> PetResponse:
        pet_state = session.metadata.get('pet_state', {})
        happiness = pet_state.get('happiness', 50)
        
        return PetResponse(
            action=PetAction.PET,
            message="*purrs happily*",
            state_changes={
                'happiness': min(100, happiness + 5)
            },
            mood_impact=2,
            cooldown=30  # 30 seconds
        )
    
    async def _handle_train(self, session: Any, **kwargs) -> PetResponse:
        pet_state = session.metadata.get('pet_state', {})
        happiness = pet_state.get('happiness', 50)
        energy = pet_state.get('energy', 50)
        
        # Training is mentally taxing
        energy_cost = 20
        
        # Success chance based on happiness
        success = random.random() < (happiness / 100)
        
        if success:
            message = "*does a trick* Did I do it right?"
            happiness_change = 5
        else:
            message = "*tilts head* I'm not sure what you want me to do..."
            happiness_change = -5
        
        return PetResponse(
            action=PetAction.TRAIN,
            message=message,
            state_changes={
                'happiness': max(0, happiness + happiness_change),
                'energy': max(0, energy - energy_cost)
            },
            mood_impact=1 if success else -1,
            energy_cost=energy_cost,
            cooldown=300  # 5 minutes
        )
    
    async def _handle_clean(self, session: Any, **kwargs) -> PetResponse:
        pet_state = session.metadata.get('pet_state', {})
        happiness = pet_state.get('happiness', 50)
        
        # Cleaning is a basic need
        return PetResponse(
            action=PetAction.CLEAN,
            message="*shakes off water* All clean now!",
            state_changes={
                'happiness': min(100, happiness + 3)
            },
            mood_impact=1,
            cooldown=300  # 5 minutes
        )
    
    async def _handle_talk(self, session: Any, message: Optional[str] = None, **kwargs) -> PetResponse:
        # The actual response will be generated in process_interaction
        return PetResponse(
            action=PetAction.TALK,
            message="*listening attentively*",
            mood_impact=0,
            cooldown=5  # Short cooldown for talking
        )
    
    # Helper methods
    def _is_on_cooldown(self, session_id: str, action: PetAction) -> bool:
        """Check if an action is on cooldown for a session"""
        key = f"{session_id}:{action}"
        if key not in self.action_cooldowns:
            return False
        
        cooldown_until = self.action_cooldowns[key]
        return datetime.utcnow() < cooldown_until
    
    def _set_cooldown(self, session_id: str, action: PetAction, seconds: int) -> None:
        """Set a cooldown for an action"""
        key = f"{session_id}:{action}"
        self.action_cooldowns[key] = datetime.utcnow() + timedelta(seconds=seconds)
    
    async def cleanup_expired_cooldowns(self) -> None:
        """Remove expired cooldowns"""
        now = datetime.utcnow()
        expired = [
            key for key, cooldown_until in self.action_cooldowns.items()
            if now >= cooldown_until
        ]
        for key in expired:
            self.action_cooldowns.pop(key, None)

# Global instance
pet_intelligence = PetIntelligence()

# Background task to clean up expired cooldowns
async def _cleanup_cooldowns_task():
    while True:
        try:
            await asyncio.sleep(300)  # Run every 5 minutes
            await pet_intelligence.cleanup_expired_cooldowns()
        except Exception as e:
            logger.error(f"Error in cooldown cleanup task: {e}")
            await asyncio.sleep(60)  # Wait before retrying on error

# Start the background task
import asyncio
asyncio.create_task(_cleanup_cooldowns_task())
