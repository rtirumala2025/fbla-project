"""Enhanced NLP command service with context-aware, multi-turn conversation support."""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class NLPCommandService:
    """Enhanced NLP service with context-aware command processing and OpenAI fallback."""

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(timeout=30.0)
        self._conversation_context: Dict[str, List[Dict[str, str]]] = {}

    async def process_command(
        self,
        command: str,
        user_id: str,
        session_id: Optional[str] = None,
        pet_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process a natural language command with context awareness.

        Args:
            command: User's natural language command
            user_id: User ID for context tracking
            session_id: Optional session ID for conversation continuity
            pet_context: Optional pet state context

        Returns:
            Dict with parsed command, confidence, and error recovery info
        """
        session_id = session_id or f"nlp-{user_id}"
        
        # Get or initialize conversation context
        if session_id not in self._conversation_context:
            self._conversation_context[session_id] = []

        # Add user command to context
        self._conversation_context[session_id].append({"role": "user", "content": command})

        # Try OpenAI for better understanding if available
        settings = get_settings()
        if settings.openai_api_key:
            try:
                return await self._process_with_openai(
                    command, session_id, pet_context, settings
                )
            except Exception as e:
                logger.warning(f"OpenAI processing failed, using fallback: {e}")

        # Fallback to rule-based parsing
        return await self._process_with_fallback(command, session_id, pet_context)

    async def _process_with_openai(
        self,
        command: str,
        session_id: str,
        pet_context: Optional[Dict[str, Any]],
        settings: Any,
    ) -> Dict[str, Any]:
        """Process command using OpenAI for better context understanding."""
        # Build context-aware prompt
        system_prompt = """You are a virtual pet assistant that understands natural language commands for pet care.

Available actions:
- feed: Feed the pet (increases hunger)
- play: Play with the pet (increases happiness, decreases energy)
- bathe: Clean the pet (increases cleanliness)
- rest: Let the pet rest (increases energy)
- status: Check pet's current stats
- shop: Open the shop
- budget: Check financial status

Parse the user's command and return a JSON response with:
{
  "action": "action_name",
  "confidence": 0.0-1.0,
  "parameters": {},
  "intent": "clear description of what user wants",
  "needs_clarification": false,
  "suggestions": []
}

If the command is unclear, set needs_clarification to true and provide helpful suggestions."""

        # Add pet context if available
        context_info = ""
        if pet_context:
            context_info = f"\nPet Context:\n- Name: {pet_context.get('name', 'Unknown')}\n"
            context_info += f"- Hunger: {pet_context.get('hunger', 70)}/100\n"
            context_info += f"- Happiness: {pet_context.get('happiness', 70)}/100\n"
            context_info += f"- Energy: {pet_context.get('energy', 70)}/100\n"
            context_info += f"- Cleanliness: {pet_context.get('cleanliness', 70)}/100\n"

        # Build conversation history
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add recent conversation history (last 5 exchanges)
        recent_history = self._conversation_context[session_id][-10:]
        messages.extend(recent_history)

        user_message = f"{context_info}\nUser command: {command}"
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": settings.openai_chat_model,
            "messages": messages,
            "temperature": 0.3,  # Lower temperature for more consistent parsing
            "max_tokens": 200,
            "response_format": {"type": "json_object"},
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

        # Parse JSON response
        try:
            parsed = json.loads(content)
            
            # Add assistant response to context
            self._conversation_context[session_id].append({
                "role": "assistant",
                "content": json.dumps(parsed)
            })

            return {
                "action": parsed.get("action", "unknown"),
                "confidence": float(parsed.get("confidence", 0.5)),
                "parameters": parsed.get("parameters", {}),
                "intent": parsed.get("intent", ""),
                "needs_clarification": parsed.get("needs_clarification", False),
                "suggestions": parsed.get("suggestions", []),
                "error": None,
                "fallback_used": False,
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse OpenAI response: {e}")
            raise

    async def _process_with_fallback(
        self,
        command: str,
        session_id: str,
        pet_context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Fallback rule-based command processing."""
        command_lower = command.lower().strip()

        # Simple pattern matching
        action_map = {
            "feed": ["feed", "give food", "hungry", "eat", "meal"],
            "play": ["play", "game", "fetch", "toy", "fun"],
            "bathe": ["bathe", "bath", "clean", "wash", "groom"],
            "rest": ["rest", "sleep", "nap", "tired", "sleepy"],
            "status": ["status", "stats", "check", "how is", "health"],
            "shop": ["shop", "store", "buy", "purchase"],
            "budget": ["budget", "money", "coins", "balance", "finance"],
        }

        best_action = None
        best_confidence = 0.0

        for action, keywords in action_map.items():
            for keyword in keywords:
                if keyword in command_lower:
                    confidence = len(keyword) / len(command_lower)  # Simple confidence metric
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_action = action
                    break

        if not best_action:
            # No clear action found
            suggestions = [
                "Try: 'feed my pet'",
                "Try: 'play with my pet'",
                "Try: 'check status'",
                "Try: 'bathe my pet'",
            ]
            return {
                "action": "unknown",
                "confidence": 0.0,
                "parameters": {},
                "intent": "Could not understand command",
                "needs_clarification": True,
                "suggestions": suggestions,
                "error": "Command not recognized",
                "fallback_used": True,
            }

        return {
            "action": best_action,
            "confidence": min(best_confidence * 1.5, 0.9),  # Cap at 0.9 for fallback
            "parameters": {},
            "intent": f"User wants to {best_action}",
            "needs_clarification": False,
            "suggestions": [],
            "error": None,
            "fallback_used": True,
        }

    def clear_context(self, session_id: str) -> None:
        """Clear conversation context for a session."""
        if session_id in self._conversation_context:
            del self._conversation_context[session_id]

    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """Get conversation history for a session."""
        return self._conversation_context.get(session_id, [])
