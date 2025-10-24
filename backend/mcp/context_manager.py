from typing import Dict, List, Optional, Any, AsyncGenerator, Tuple
from datetime import datetime, timedelta
from pydantic import BaseModel, Field, validator
import json
import logging
import asyncio
from uuid import uuid4
from enum import Enum
import hashlib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"

class PetMood(str, Enum):
    HAPPY = "happy"
    SAD = "sad"
    ANGRY = "angry"
    TIRED = "tired"
    HUNGRY = "hungry"
    EXCITED = "excited"
    RELAXED = "relaxed"
    DEFAULT = "default"

class PetState(BaseModel):
    mood: PetMood = PetMood.DEFAULT
    health: int = Field(100, ge=0, le=100)
    hunger: int = Field(50, ge=0, le=100)
    happiness: int = Field(75, ge=0, le=100)
    energy: int = Field(80, ge=0, le=100)
    last_fed: Optional[datetime] = None
    last_played: Optional[datetime] = None
    last_slept: Optional[datetime] = None

class Message(BaseModel):
    """Represents a single message in the conversation"""
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}
    
    class Config:
        use_enum_values = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        
    @validator('content')
    def content_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Message content cannot be empty')
        return v.strip()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert message to dictionary for storage"""
        return {
            'role': self.role,
            'content': self.content,
            'timestamp': self.timestamp.isoformat(),
            'metadata': self.metadata
        }

class SessionContext(BaseModel):
    """Represents a user's conversation session with context"""
    session_id: str
    user_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    messages: List[Message] = []
    metadata: Dict[str, Any] = {
        'pet_state': PetState().dict(),
        'last_activity': datetime.utcnow().isoformat(),
        'message_count': 0,
        'topics': [],
        'sentiment': 'neutral'
    }
    ttl: int = 86400  # 24 hours in seconds
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

    def add_message(self, role: MessageRole, content: str, **metadata) -> Message:
        """Add a message to the context with optional metadata"""
        message = Message(
            role=role,
            content=content,
            metadata=metadata or {}
        )
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        self.metadata['last_activity'] = self.updated_at.isoformat()
        self.metadata['message_count'] = len(self.messages)
        
        # Keep only the last 20 messages to manage context size
        if len(self.messages) > 20:
            self.messages = self.messages[-20:]
            
        return message
    
    def update_pet_state(self, **updates) -> None:
        """Update the pet's state with new values"""
        if 'pet_state' not in self.metadata:
            self.metadata['pet_state'] = {}
        
        current_state = self.metadata.get('pet_state', {})
        current_state.update(updates)
        
        # Ensure values are within bounds
        for key in ['health', 'hunger', 'happiness', 'energy']:
            if key in current_state:
                current_state[key] = max(0, min(100, current_state[key]))
        
        self.metadata['pet_state'] = current_state
        self.updated_at = datetime.utcnow()
    
    def get_context_summary(self, max_messages: int = 5) -> str:
        """Generate a summary of the conversation context"""
        recent_messages = self.messages[-max_messages:]
        return "\n".join(
            f"{msg.role}: {msg.content[:100]}{'...' if len(msg.content) > 100 else ''}"
            for msg in recent_messages
        )
    
    def to_openai_format(self) -> List[Dict[str, str]]:
        """Convert messages to OpenAI API format"""
        return [{"role": msg.role, "content": msg.content} for msg in self.messages]
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary for storage"""
        return {
            'session_id': self.session_id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'messages': [msg.to_dict() for msg in self.messages],
            'metadata': self.metadata,
            'ttl': self.ttl
        }

class ContextManager:
    """Manages user sessions and conversation context with persistence"""
    
    def __init__(self, db_client=None):
        self.sessions: Dict[str, SessionContext] = {}
        self.db_client = db_client
        self._cleanup_task = None
        self._running = False
    
    async def start(self) -> None:
        """Start background tasks"""
        if not self._running:
            self._running = True
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())
    
    async def stop(self) -> None:
        """Stop background tasks"""
        if self._cleanup_task:
            self._cleanup_task.cancel()
            try:
                await self._cleanup_task
            except asyncio.CancelledError:
                pass
        self._running = False
    
    async def _periodic_cleanup(self, interval: int = 3600) -> None:
        """Periodically clean up expired sessions"""
        while self._running:
            try:
                await self.cleanup_expired_sessions()
                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in periodic cleanup: {e}")
                await asyncio.sleep(60)  # Wait before retrying on error
    
    def _generate_session_id(self, user_id: Optional[str] = None) -> str:
        """Generate a unique session ID"""
        unique_str = f"{user_id or ''}{datetime.utcnow().timestamp()}"
        return hashlib.sha256(unique_str.encode()).hexdigest()
    
    async def get_or_create_session(
        self, 
        session_id: str = None, 
        user_id: str = None,
        create_if_missing: bool = True
    ) -> Optional[SessionContext]:
        """
        Get existing session or create a new one
        
        Args:
            session_id: Existing session ID (optional)
            user_id: User ID (optional)
            create_if_missing: Whether to create a new session if not found
            
        Returns:
            SessionContext if found or created, None otherwise
        """
        # Try to load from memory first
        if session_id and session_id in self.sessions:
            return self.sessions[session_id]
            
        # Try to load from database if available
        if session_id and self.db_client:
            session_data = await self._load_from_db(session_id)
            if session_data:
                session = SessionContext(**session_data)
                self.sessions[session_id] = session
                return session
        
        # Create new session if requested
        if create_if_missing:
            new_id = session_id or self._generate_session_id(user_id)
            session = SessionContext(
                session_id=new_id,
                user_id=user_id,
                metadata={
                    'pet_state': PetState().dict(),
                    'created_at': datetime.utcnow().isoformat(),
                    'message_count': 0
                }
            )
            self.sessions[new_id] = session
            
            # Persist to database if available
            if self.db_client:
                await self._save_to_db(session)
                
            return session
            
        return None
    
    async def update_session(
        self, 
        session_id: str, 
        role: MessageRole,
        content: str,
        **metadata
    ) -> Optional[SessionContext]:
        """
        Update session with a new message
        
        Args:
            session_id: The session ID
            role: Message role (user/assistant/system)
            content: Message content
            **metadata: Additional metadata for the message
            
        Returns:
            Updated SessionContext or None if not found
        """
        session = await self.get_or_create_session(session_id)
        if not session:
            return None
            
        # Add the message
        message = session.add_message(role, content, **metadata)
        
        # Update pet state based on message content (example)
        self._update_pet_state_based_on_message(session, message)
        
        # Persist changes
        if self.db_client:
            await self._save_to_db(session)
            
        return session
    
    def _update_pet_state_based_on_message(self, session: SessionContext, message: Message) -> None:
        """Update pet state based on message content (example implementation)"""
        content = message.content.lower()
        state_updates = {}
        
        # Simple keyword-based state updates
        if any(word in content for word in ['play', 'game', 'fun']):
            state_updates.update({
                'happiness': min(100, session.metadata.get('pet_state', {}).get('happiness', 0) + 10),
                'energy': max(0, session.metadata.get('pet_state', {}).get('energy', 100) - 5)
            })
        
        if any(word in content for word in ['food', 'eat', 'hungry']):
            state_updates.update({
                'hunger': max(0, session.metadata.get('pet_state', {}).get('hunger', 50) - 20),
                'happiness': min(100, session.metadata.get('pet_state', {}).get('happiness', 0) + 5)
            })
        
        if any(word in content for word in ['sleep', 'tired']):
            state_updates.update({
                'energy': min(100, session.metadata.get('pet_state', {}).get('energy', 0) + 30),
                'happiness': min(100, session.metadata.get('pet_state', {}).get('happiness', 0) + 5)
            })
        
        if state_updates:
            session.update_pet_state(**state_updates)
    
    async def get_session_summary(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get a summary of the session"""
        session = await self.get_or_create_session(session_id, create_if_missing=False)
        if not session:
            return None
            
        return {
            'session_id': session.session_id,
            'user_id': session.user_id,
            'message_count': len(session.messages),
            'last_activity': session.updated_at.isoformat(),
            'pet_state': session.metadata.get('pet_state', {})
        }
    
    async def cleanup_expired_sessions(self, max_age_hours: int = 24) -> int:
        """
        Remove expired sessions
        
        Args:
            max_age_hours: Maximum session age in hours
            
        Returns:
            Number of sessions removed
        """
        now = datetime.utcnow()
        expired = []
        
        # Find expired sessions
        for session_id, session in self.sessions.items():
            age = now - session.updated_at
            if age > timedelta(hours=max_age_hours):
                expired.append(session_id)
        
        # Remove from memory
        count = len(expired)
        for session_id in expired:
            self.sessions.pop(session_id, None)
            
        # Remove from database if available
        if self.db_client and expired:
            await self._delete_from_db(expired)
            
        if count > 0:
            logger.info(f"Cleaned up {count} expired sessions")
            
        return count
    
    async def _save_to_db(self, session: SessionContext) -> bool:
        """Save session to database"""
        if not self.db_client:
            return False
            
        try:
            # Convert session to dict and save to database
            session_data = session.to_dict()
            await self.db_client.upsert('sessions', session_data, 'session_id')
            return True
        except Exception as e:
            logger.error(f"Error saving session to database: {e}")
            return False
    
    async def _load_from_db(self, session_id: str) -> Optional[Dict]:
        """Load session from database"""
        if not self.db_client:
            return None
            
        try:
            result = await self.db_client.fetch_one(
                'SELECT * FROM sessions WHERE session_id = $1',
                session_id
            )
            return dict(result) if result else None
        except Exception as e:
            logger.error(f"Error loading session from database: {e}")
            return None
    
    async def _delete_from_db(self, session_ids: List[str]) -> None:
        """Delete sessions from database"""
        if not self.db_client or not session_ids:
            return
            
        try:
            await self.db_client.execute(
                'DELETE FROM sessions WHERE session_id = ANY($1::text[])',
                session_ids
            )
        except Exception as e:
            logger.error(f"Error deleting sessions from database: {e}")


# Global instance with database integration
try:
    from ..database import get_db  # Assuming you have a database module
    db_client = get_db()
    context_manager = ContextManager(db_client=db_client)
except ImportError:
    logger.warning("Database client not available, using in-memory storage only")
    context_manager = ContextManager()

# Start the cleanup task when the module is imported
import asyncio
loop = asyncio.get_event_loop()
loop.create_task(context_manager.start())
