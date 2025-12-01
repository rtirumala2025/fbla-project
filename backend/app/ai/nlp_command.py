"""
NLP Command Engine - Context-Aware Natural Language Processing

This module provides a sophisticated natural language command processing system
for virtual pet interactions. It supports:

- Multi-turn conversation context awareness
- Context-sensitive command interpretation based on pet state
- Intent recognition with confidence scoring
- Parameter extraction (e.g., food types, game types, duration)
- Fallback to rule-based parsing when AI services are unavailable
- Command suggestions for unclear inputs

Algorithm Overview:
1. Maintains conversation context per session to understand references
2. Uses pet state context (hunger, energy, etc.) to improve interpretation
3. Attempts AI-powered parsing first (OpenRouter/OpenAI) for better accuracy
4. Falls back to keyword-based pattern matching if AI unavailable
5. Extracts parameters from natural language (quantities, types, durations)
6. Provides helpful suggestions when commands are ambiguous

Example Usage:
    engine = NLPCommandEngine()
    result = await engine.process_command(
        command="feed my pet some tuna",
        user_id="user123",
        session_id="session456",
        pet_context={"hunger": 30, "name": "Luna"}
    )
    # Returns: {
    #     "action": "feed",
    #     "confidence": 0.95,
    #     "parameters": {"food_type": "tuna"},
    #     "intent": "Feed pet with tuna"
    # }
"""

from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class NLPCommandEngine:
    """
    Context-aware natural language command processor for virtual pet commands.
    
    This engine understands natural language commands for pet care actions,
    maintaining conversation context and using pet state to improve accuracy.
    
    Features:
    - Multi-turn conversation support (remembers previous context)
    - Pet state awareness (uses hunger, energy, etc. for better interpretation)
    - AI-powered intent recognition with rule-based fallback
    - Parameter extraction (food types, game types, durations)
    - Confidence scoring for all interpretations
    - Helpful suggestions for ambiguous commands
    """

    # Available pet care actions
    VALID_ACTIONS = {
        "feed": "Feed the pet (increases hunger)",
        "play": "Play with the pet (increases happiness, decreases energy)",
        "bathe": "Clean/bathe the pet (increases cleanliness)",
        "rest": "Let the pet rest (increases energy)",
        "status": "Check pet's current stats",
        "shop": "Open the shop",
        "budget": "Check financial status",
    }

    def __init__(self, client: Optional[httpx.AsyncClient] = None) -> None:
        """
        Initialize the NLP Command Engine.
        
        Args:
            client: Optional HTTP client for API calls. If not provided,
                   a new client will be created per request.
        """
        self._client = client
        self._conversation_context: Dict[str, List[Dict[str, str]]] = {}
        logger.info("NLPCommandEngine initialized")

    async def process_command(
        self,
        command: str,
        user_id: str,
        session_id: Optional[str] = None,
        pet_context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process a natural language command with full context awareness.
        
        This is the main entry point for command processing. It:
        1. Maintains conversation history for context
        2. Uses pet state to improve interpretation
        3. Attempts AI-powered parsing first
        4. Falls back to rule-based parsing if needed
        5. Returns structured result with action, parameters, and confidence
        
        Args:
            command: User's natural language command (e.g., "feed my pet tuna")
            user_id: User identifier for session management
            session_id: Optional session ID for conversation continuity.
                       If not provided, generates one from user_id
            pet_context: Optional pet state context containing:
                        - name: Pet's name
                        - hunger: Current hunger level (0-100)
                        - happiness: Current happiness level (0-100)
                        - energy: Current energy level (0-100)
                        - cleanliness: Current cleanliness level (0-100)
        
        Returns:
            Dictionary containing:
            - action: Extracted action name (e.g., "feed", "play")
            - confidence: Confidence score (0.0-1.0)
            - parameters: Extracted parameters (e.g., {"food_type": "tuna"})
            - intent: Human-readable description of user intent
            - needs_clarification: Boolean indicating if command was unclear
            - suggestions: List of helpful command suggestions if unclear
            - error: Error message if processing failed
            - fallback_used: Boolean indicating if fallback parsing was used
        
        Example:
            >>> result = await engine.process_command(
            ...     "feed my pet some tuna",
            ...     user_id="user123",
            ...     pet_context={"hunger": 30, "name": "Luna"}
            ... )
            >>> print(result["action"])  # "feed"
            >>> print(result["parameters"]["food_type"])  # "tuna"
        """
        if not command or not command.strip():
            logger.warning(f"Empty command received from user {user_id}")
            return {
                "action": "unknown",
                "confidence": 0.0,
                "parameters": {},
                "intent": "No command provided",
                "needs_clarification": True,
                "suggestions": [
                    "Try: 'feed my pet'",
                    "Try: 'play with my pet'",
                    "Try: 'check status'",
                ],
                "error": "Command cannot be empty",
                "fallback_used": True,
            }

        session_id = session_id or f"nlp-{user_id}"

        # Initialize or retrieve conversation context
        if session_id not in self._conversation_context:
            self._conversation_context[session_id] = []
            logger.debug(f"Created new conversation context for session {session_id}")

        # Add user command to conversation history
        self._conversation_context[session_id].append({"role": "user", "content": command})

        # Try AI-powered processing first
        settings = get_settings()
        if settings.openrouter_api_key or (hasattr(settings, "openai_api_key") and settings.openai_api_key):
            try:
                result = await self._process_with_ai(command, session_id, pet_context, settings)
                logger.info(
                    f"AI processing successful for command '{command[:50]}...' "
                    f"- Action: {result.get('action')}, Confidence: {result.get('confidence')}"
                )
                return result
            except Exception as e:
                logger.warning(f"AI processing failed, using fallback: {e}")

        # Fallback to rule-based parsing
        result = await self._process_with_fallback(command, session_id, pet_context)
        logger.info(f"Fallback processing used for command '{command[:50]}...'")
        return result

    async def _process_with_ai(
        self,
        command: str,
        session_id: str,
        pet_context: Optional[Dict[str, Any]],
        settings: Any,
    ) -> Dict[str, Any]:
        """
        Process command using AI (OpenRouter/OpenAI) for superior understanding.
        
        Uses a context-aware prompt that includes:
        - Available actions and their effects
        - Pet state information (hunger, energy, etc.)
        - Recent conversation history
        - Command parsing requirements
        
        Algorithm:
        1. Builds a system prompt explaining available actions
        2. Incorporates pet context into the prompt
        3. Adds recent conversation history (last 10 exchanges)
        4. Sends to AI with structured JSON response format
        5. Parses and validates the AI response
        6. Updates conversation context with the result
        
        Args:
            command: User's command text
            session_id: Session identifier for context tracking
            pet_context: Optional pet state information
            settings: Application settings containing API keys
        
        Returns:
            Parsed command result dictionary
        
        Raises:
            Exception: If AI API call fails or response is invalid
        """
        # Build comprehensive system prompt
        system_prompt = """You are a virtual pet assistant that understands natural language commands for pet care.

Available actions:
- feed: Feed the pet (increases hunger). Parameters: food_type (standard/tuna/treat)
- play: Play with the pet (increases happiness, decreases energy). Parameters: game_type (fetch/puzzle/free_play)
- bathe: Clean/bathe the pet (increases cleanliness)
- rest: Let the pet rest (increases energy). Parameters: duration_hours (2/4/8)
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

If the command is unclear or ambiguous, set needs_clarification to true and provide helpful suggestions.
Consider the pet's current state when interpreting commands (e.g., low hunger might suggest feeding)."""

        # Build pet context information string
        context_info = ""
        if pet_context:
            context_info = "\nPet Context:\n"
            if pet_context.get("name"):
                context_info += f"- Name: {pet_context.get('name')}\n"
            if "hunger" in pet_context:
                hunger = pet_context.get("hunger", 70)
                context_info += f"- Hunger: {hunger}/100"
                if hunger < 30:
                    context_info += " (very low - may need feeding)"
                elif hunger < 50:
                    context_info += " (low)"
                context_info += "\n"
            if "happiness" in pet_context:
                context_info += f"- Happiness: {pet_context.get('happiness', 70)}/100\n"
            if "energy" in pet_context:
                energy = pet_context.get("energy", 70)
                context_info += f"- Energy: {energy}/100"
                if energy < 30:
                    context_info += " (very low - may need rest)"
                context_info += "\n"
            if "cleanliness" in pet_context:
                context_info += f"- Cleanliness: {pet_context.get('cleanliness', 70)}/100\n"

        # Build conversation history (last 10 exchanges for context)
        messages = [{"role": "system", "content": system_prompt}]
        recent_history = self._conversation_context[session_id][-10:]
        messages.extend(recent_history)

        # Add current command with context
        user_message = f"{context_info}\nUser command: {command}" if context_info else f"User command: {command}"
        messages.append({"role": "user", "content": user_message})

        # Determine API endpoint and key
        api_key = getattr(settings, "openrouter_api_key", None) or getattr(settings, "openai_api_key", None)
        api_url = getattr(settings, "openrouter_base_url", None) or getattr(settings, "openai_chat_api", None)
        model = getattr(settings, "openrouter_model", None) or getattr(settings, "openai_chat_model", "gpt-3.5-turbo")

        if not api_key or not api_url:
            raise ValueError("No AI API key configured")

        # Prepare API request
        payload = {
            "model": model,
            "messages": messages,
            "temperature": 0.3,  # Lower temperature for more consistent parsing
            "max_tokens": 200,
        }

        # Use JSON mode if OpenRouter, otherwise rely on prompt
        if "openrouter" in api_url.lower() or hasattr(settings, "openrouter_api_key"):
            payload["response_format"] = {"type": "json_object"}

        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }

        # Make API call
        client = self._client or httpx.AsyncClient(timeout=30.0)
        close_client = self._client is None

        try:
            response = await client.post(api_url, json=payload, headers=headers)
            response.raise_for_status()

            result = response.json()
            content = result["choices"][0]["message"]["content"].strip()

            # Parse JSON response
            try:
                # Try to extract JSON if wrapped in markdown code blocks
                if "```json" in content:
                    start = content.find("```json") + 7
                    end = content.find("```", start)
                    content = content[start:end].strip()
                elif "```" in content:
                    start = content.find("```") + 3
                    end = content.find("```", start)
                    content = content[start:end].strip()

                parsed = json.loads(content)

                # Add assistant response to conversation context
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
                logger.error(f"Failed to parse AI response as JSON: {e}, Content: {content[:100]}")
                raise
        finally:
            if close_client:
                await client.aclose()

    async def _process_with_fallback(
        self,
        command: str,
        session_id: str,
        pet_context: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Fallback rule-based command processing using keyword pattern matching.
        
        This algorithm:
        1. Normalizes command text (lowercase, strip whitespace)
        2. Matches against keyword patterns for each action
        3. Extracts parameters using keyword detection
        4. Calculates confidence based on match quality
        5. Provides suggestions if no clear match found
        
        Args:
            command: User's command text
            session_id: Session identifier (for logging)
            pet_context: Optional pet state (used for suggestions)
        
        Returns:
            Parsed command result dictionary
        """
        command_lower = command.lower().strip()

        # Enhanced action keyword mapping with priority ordering
        action_map = {
            "feed": {
                "keywords": ["feed", "give food", "hungry", "eat", "meal", "treat", "snack", "food"],
                "high_priority": ["feed", "hungry", "eat"],
            },
            "play": {
                "keywords": ["play", "game", "fetch", "toy", "fun", "exercise", "train"],
                "high_priority": ["play", "game", "fetch"],
            },
            "bathe": {
                "keywords": ["bathe", "bath", "clean", "wash", "groom", "shower"],
                "high_priority": ["bathe", "bath", "clean"],
            },
            "rest": {
                "keywords": ["rest", "sleep", "nap", "tired", "sleepy", "bed"],
                "high_priority": ["rest", "sleep", "nap"],
            },
            "status": {
                "keywords": ["status", "stats", "check", "how is", "health", "condition"],
                "high_priority": ["status", "stats", "check"],
            },
            "shop": {
                "keywords": ["shop", "store", "buy", "purchase", "market"],
                "high_priority": ["shop", "store", "buy"],
            },
            "budget": {
                "keywords": ["budget", "money", "coins", "balance", "finance", "spending"],
                "high_priority": ["budget", "money", "balance"],
            },
        }

        best_action = None
        best_confidence = 0.0
        parameters: Dict[str, Any] = {}

        # Find best matching action
        for action, config in action_map.items():
            keywords = config["keywords"]
            high_priority = config.get("high_priority", [])

            for keyword in keywords:
                if keyword in command_lower:
                    # Calculate confidence: higher for high-priority keywords
                    is_high_priority = keyword in high_priority
                    base_confidence = 0.7 if is_high_priority else 0.5
                    
                    # Boost confidence if keyword appears early in command
                    keyword_pos = command_lower.find(keyword)
                    position_bonus = 0.1 if keyword_pos < len(command_lower) / 2 else 0.0
                    
                    confidence = base_confidence + position_bonus
                    
                    if confidence > best_confidence:
                        best_confidence = confidence
                        best_action = action
                    break

        # Extract parameters based on action
        if best_action == "feed":
            if "tuna" in command_lower:
                parameters["food_type"] = "tuna"
            elif any(word in command_lower for word in ["treat", "snack"]):
                parameters["food_type"] = "treat"
            else:
                parameters["food_type"] = "standard"

        elif best_action == "play":
            if "fetch" in command_lower:
                parameters["game_type"] = "fetch"
            elif "puzzle" in command_lower:
                parameters["game_type"] = "puzzle"
            else:
                parameters["game_type"] = "free_play"

        elif best_action == "rest":
            if any(word in command_lower for word in ["long", "overnight"]):
                parameters["duration_hours"] = "8"
            elif "nap" in command_lower:
                parameters["duration_hours"] = "2"
            else:
                parameters["duration_hours"] = "4"

        # Handle no action found
        if not best_action:
            suggestions = [
                "Try: 'feed my pet'",
                "Try: 'play with my pet'",
                "Try: 'check status'",
                "Try: 'bathe my pet'",
            ]
            
            # Context-aware suggestions based on pet state
            if pet_context:
                if pet_context.get("hunger", 70) < 40:
                    suggestions.insert(0, f"Your pet {pet_context.get('name', '')} might be hungry - try: 'feed my pet'")
                if pet_context.get("energy", 70) < 40:
                    suggestions.insert(0, f"Your pet might be tired - try: 'rest'")

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
            "confidence": min(best_confidence, 0.9),  # Cap at 0.9 for fallback
            "parameters": parameters,
            "intent": f"User wants to {best_action}",
            "needs_clarification": False,
            "suggestions": [],
            "error": None,
            "fallback_used": True,
        }

    def clear_context(self, session_id: str) -> None:
        """
        Clear conversation context for a specific session.
        
        Useful for resetting conversation state or when starting a new
        conversation thread.
        
        Args:
            session_id: Session identifier to clear
        """
        if session_id in self._conversation_context:
            del self._conversation_context[session_id]
            logger.debug(f"Cleared conversation context for session {session_id}")

    def get_conversation_history(self, session_id: str) -> List[Dict[str, str]]:
        """
        Retrieve conversation history for a session.
        
        Args:
            session_id: Session identifier
        
        Returns:
            List of conversation messages in chronological order
        """
        return self._conversation_context.get(session_id, []).copy()
