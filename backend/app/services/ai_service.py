"""Service functions coordinating AI interactions."""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import httpx
from asyncpg import Pool
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.schemas import AIChatRequest, AIChatResponse

try:  # Defensive import – context manager is optional in some runtimes.
    from mcp.context_manager import ContextManager, MessageRole, context_manager as default_context_manager
except Exception:  # pragma: no cover - fallback for environments without MCP bundle
    ContextManager = None  # type: ignore[assignment]
    MessageRole = None  # type: ignore[assignment]
    default_context_manager = None  # type: ignore[assignment]

logger = logging.getLogger(__name__)


class AIService:
    """
    High-level orchestrator for Llama 4 conversational intelligence.
    
    Coordinates AI-powered chat interactions with context awareness, session management,
    and fallback mechanisms. Integrates with OpenRouter API for LLM access and MCP
    context manager for conversation history.
    """

    def __init__(
        self,
        pool: Optional[Pool] = None,
        client: Optional[httpx.AsyncClient] = None,
        context_mgr: Optional[ContextManager] = None,
    ) -> None:
        """
        Initialize AI service with optional dependencies.
        
        Args:
            pool: Optional asyncpg connection pool for database operations
            client: Optional HTTP client for API requests (creates new if None)
            context_mgr: Optional MCP context manager for session management
        """
        self._pool = pool
        self._client = client
        self._context_mgr = context_mgr or default_context_manager
        self._max_retries = 3  # Number of retry attempts for API calls
        self._retry_delay = 0.75  # Base delay in seconds between retries (with exponential backoff)

    async def chat(
        self,
        user_id: str,
        payload: AIChatRequest,
        pet_snapshot: Optional[Dict[str, Any]] = None,
    ) -> AIChatResponse:
        """
        Generate an AI response grounded in MCP session context.
        
        This method orchestrates the complete chat flow:
        1. Manages conversation session (creates or retrieves existing)
        2. Builds context-aware prompts with pet state and history
        3. Calls LLM API (OpenRouter) with retry logic
        4. Parses and validates LLM response
        5. Merges AI insights with current pet state
        6. Generates health forecasts and recommendations
        7. Updates session history for future context
        
        Args:
            user_id: Unique identifier for the user
            payload: Chat request containing message and optional session_id
            pet_snapshot: Current pet state (stats, mood, etc.) for context
            
        Returns:
            AIChatResponse with AI-generated message, mood analysis, notifications,
            updated pet state, and health forecast
        """
        # Check if MCP context manager is available for session management
        if self._context_mgr is None or MessageRole is None:
            # Fallback to stateless mode if context manager unavailable
            logger.warning("MCP context manager unavailable; responses will be stateless.")
            session_id = payload.session_id or f"stateless-{user_id}"
        else:
            # Create or retrieve conversation session for context continuity
            session = await self._context_mgr.get_or_create_session(
                session_id=payload.session_id,
                user_id=user_id,
            )
            session_id = session.session_id
            # Record user message in session history
            await self._context_mgr.update_session(
                session_id=session_id,
                role=MessageRole.USER,
                content=payload.message,
                source="chat",
            )
            # Retrieve full session context for prompt building
            session = await self._context_mgr.get_or_create_session(session_id=session_id, create_if_missing=False)

        # Extract conversation history in OpenAI message format
        history_messages = []
        if self._context_mgr is not None and MessageRole is not None:
            history_messages = (session.to_openai_format() if session else [])  # type: ignore[assignment]

        # Derive pet personality traits based on species/type for personalized responses
        persona = self._derive_personality(pet_snapshot)
        # Build complete prompt with system instructions, pet context, and conversation history
        prompt_messages = self._build_prompt(history_messages, payload.message, pet_snapshot, persona, payload.model)

        settings = get_settings()
        # Check if OpenRouter API is configured (required for LLM access)
        if not settings.openrouter_api_key:
            # Use rule-based fallback when AI service is unavailable
            logger.warning("OPENROUTER_API_KEY not configured. Falling back to rule-based response.")
            fallback = self._fallback_response(payload.message, pet_snapshot, persona)
            return AIChatResponse(
                session_id=session_id,
                message=fallback["message"],
                mood=fallback.get("mood"),
                notifications=fallback.get("notifications", []),
                pet_state=fallback.get("pet_state"),
                health_forecast=fallback.get("health_forecast"),
            )

        # Invoke LLM API with retry logic and error handling
        response_payload = await self._invoke_llama(settings, prompt_messages, payload.model)
        # Parse JSON response from LLM, handling malformed responses gracefully
        parsed = self._parse_llama_response(response_payload, payload.message, pet_snapshot)

        # Merge AI-suggested pet state updates with current snapshot
        pet_state = self._merge_pet_state(pet_snapshot, parsed.get("pet_state"), parsed.get("mood"))
        # Generate health forecast if not provided by AI, or use AI-generated forecast
        health_forecast = parsed.get("health_forecast") or self._predict_health(pet_state)

        # Record assistant response in session history for future context
        if self._context_mgr is not None and MessageRole is not None:
            await self._context_mgr.update_session(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content=parsed["message"],
                mood=parsed.get("mood"),
                notifications=parsed.get("notifications"),
                pet_state=pet_state or {},
                health_forecast=health_forecast,
            )

        return AIChatResponse(
            session_id=session_id,
            message=parsed["message"],
            mood=parsed.get("mood"),
            notifications=parsed.get("notifications", []),
            pet_state=pet_state,
            health_forecast=health_forecast,
        )

    async def _invoke_llama(
        self,
        settings,
        messages: List[Dict[str, str]],
        model_override: Optional[str],
    ) -> Dict[str, Any]:
        """
        Invoke OpenRouter LLM API with exponential backoff retry logic.
        
        Implements retry strategy for transient failures:
        - Retries up to _max_retries times
        - Exponential backoff: delay = base_delay * attempt_number
        - Only retries on 5xx server errors and network failures
        - Raises HTTPException on client errors (4xx) after first attempt
        
        Args:
            settings: Application settings with API configuration
            messages: Formatted conversation messages in OpenAI format
            model_override: Optional model override (uses default from settings if None)
            
        Returns:
            JSON response from OpenRouter API
            
        Raises:
            HTTPException: On unrecoverable errors or exhausted retries
        """
        # Create HTTP client if not provided (will be closed if we created it)
        client = self._client or httpx.AsyncClient()
        close_client = self._client is None
        # Prepare API request payload with model and messages
        payload = {
            "model": model_override or settings.openrouter_model,
            "messages": messages,
            "temperature": 0.65,  # Balanced creativity vs consistency
            "max_tokens": 512,  # Limit response length for cost control
        }
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://virtual-pet.local",  # Required by OpenRouter
        }

        last_error: Optional[Exception] = None
        try:
            # Retry loop with exponential backoff
            for attempt in range(1, self._max_retries + 1):
                try:
                    response = await client.post(
                        settings.openrouter_base_url,
                        headers=headers,
                        json=payload,
                        timeout=30.0,  # 30 second timeout to prevent hanging
                    )
                    # Success: return parsed JSON (4xx errors also returned as they're client errors, not retriable)
                    if response.status_code < 500:
                        return response.json()
                    # 5xx server error: retry after delay
                    logger.warning("OpenRouter returned status %s (attempt %s)", response.status_code, attempt)
                    last_error = HTTPException(
                        status_code=response.status_code,
                        detail=f"LLM gateway error: {response.text[:200]}",
                    )
                except httpx.RequestError as exc:
                    # Network/connection errors: retry after delay
                    last_error = exc
                    logger.exception("OpenRouter request failure on attempt %s: %s", attempt, exc)
                # Exponential backoff: wait longer between each retry attempt
                await asyncio.sleep(self._retry_delay * attempt)
        finally:
            if close_client:
                await client.aclose()

        if isinstance(last_error, HTTPException):
            raise last_error
        if last_error:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI service temporarily unavailable") from last_error
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI service unavailable")

    def _parse_llama_response(
        self,
        payload: Dict[str, Any],
        fallback_message: str,
        pet_snapshot: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Parse LLM JSON response with fallback handling.
        
        Expected response format:
        {
            "message": "AI response text",
            "mood": "happy" | "content" | "anxious" | etc.,
            "notifications": ["notification1", ...],
            "pet_state": {...},
            "health_forecast": {...}
        }
        
        Args:
            payload: Raw API response from OpenRouter
            fallback_message: Original user message for fallback generation
            pet_snapshot: Current pet state for fallback context
            
        Returns:
            Parsed and normalized response dict with all required fields
        """
        try:
            # Extract JSON string from LLM response
            content = payload["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            if not isinstance(parsed, dict):  # type: ignore[unreachable]
                raise ValueError("Parsed content is not a dict")
        except Exception as exc:  # pragma: no cover - defensive
            # Fallback to rule-based response if parsing fails
            logger.warning("Failed to parse Llama response; falling back to heuristic. Error: %s", exc)
            return self._fallback_response(fallback_message, pet_snapshot, {})

        # Normalize message field (handle different response formats)
        parsed.setdefault("message", parsed.get("response") or parsed.get("reaction") or "")
        # Generate message if missing (shouldn't happen, but defensive)
        if not parsed["message"]:
            parsed["message"] = self._fabricate_message(fallback_message, pet_snapshot)
        # Ensure notifications list exists
        parsed.setdefault("notifications", [])
        return parsed

    def _build_prompt(
        self,
        history_messages: List[Dict[str, str]],
        latest_message: str,
        pet_snapshot: Optional[Dict[str, Any]],
        persona: Dict[str, str],
        model_hint: Optional[str],
    ) -> List[Dict[str, str]]:
        """
        Build complete prompt for LLM with system instructions, context, and history.
        
        Prompt structure:
        1. System instructions defining AI role and response format
        2. Pet personality traits for personalized responses
        3. Current pet state snapshot (if available)
        4. Recent conversation history (last 12 turns for token efficiency)
        5. Latest user message
        
        Args:
            history_messages: Previous conversation in OpenAI format
            latest_message: Current user message
            pet_snapshot: Current pet state for context
            persona: Pet personality traits (derived from species)
            model_hint: Optional model identifier (currently unused but reserved)
            
        Returns:
            List of message dicts in OpenAI chat format ready for API
        """
        # Core system prompt defining AI behavior and response format
        system_prompt = (
            "You are Scout, an empathetic AI companion helping users care for their virtual pets. "
            "Always respond with a compact JSON object containing the keys: message, mood, "
            "notifications, pet_state, and health_forecast. "
            "Mood must be one of: ecstatic, happy, content, anxious, distressed. "
            "Pet state should mirror the structure {\"mood\": str, \"happiness\": int, \"energy\": int, "
            "\"hunger\": int, \"cleanliness\": int}. Provide actionable yet encouraging advice."
        )
        # Personalize responses based on pet's species and personality
        persona_blurb = (
            f"The pet prefers {persona.get('motivation', 'gentle interactions')} and speaks with a "
            f"{persona.get('tone', 'warm and playful')} tone. Personality: {persona.get('traits', 'curious and loyal')}."
        )

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": persona_blurb},
        ]

        # Add current pet state as system context for informed responses
        if pet_snapshot:
            condensed_state = json.dumps(
                {
                    "name": pet_snapshot.get("name"),
                    "species": pet_snapshot.get("species"),
                    "mood": pet_snapshot.get("mood"),
                    "stats": {
                        "hunger": pet_snapshot.get("hunger"),
                        "hygiene": pet_snapshot.get("hygiene"),
                        "energy": pet_snapshot.get("energy"),
                        "health": pet_snapshot.get("health"),
                    },
                },
                default=str,
            )
            messages.append(
                {
                    "role": "system",
                    "content": f"Current pet snapshot: {condensed_state}",
                }
            )

        # Limit history to last 12 turns to control token usage and costs
        # Each turn = user message + assistant response (2 messages)
        trimmed_history = history_messages[-12:] if history_messages else []
        messages.extend(trimmed_history)

        # Only add latest message if no history (history already includes it)
        # This prevents duplicate messages when history is present
        if not trimmed_history:
            messages.append({"role": "user", "content": latest_message})

        return messages

    def _merge_pet_state(
        self,
        original: Optional[Dict[str, Any]],
        ai_state: Optional[Dict[str, Any]],
        mood: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        """
        Merge AI-suggested pet state updates with current state.
        
        Merging strategy:
        - Start with original state as baseline
        - Overlay AI-suggested changes (only non-None values)
        - Apply mood override if provided
        - Derive happiness score from mood if missing
        - Fill in defaults for missing required fields
        - Add timestamp
        
        Args:
            original: Current pet state from database/snapshot
            ai_state: AI-suggested state changes
            mood: Explicit mood override (highest priority)
            
        Returns:
            Merged pet state dict or None if no state available
        """
        if original is None and ai_state is None:
            return None
        # Use original as baseline, empty dict if missing
        baseline = original or {}
        merged = dict(baseline)
        ai_state = ai_state or {}
        # Overlay AI changes (only apply non-None values)
        merged.update(
            {k: v for k, v in ai_state.items() if v is not None}
        )
        # Mood override takes highest priority
        if mood:
            merged["mood"] = mood
        # Derive happiness score from mood if not provided
        if "happiness" not in merged and mood:
            merged["happiness"] = self._score_from_mood(mood)
        # Ensure all required fields have defaults
        merged.setdefault("happiness", self._score_from_mood(merged.get("mood", "content")))
        merged.setdefault("energy", baseline.get("energy", 60))  # Default: moderate energy
        merged.setdefault("hunger", baseline.get("hunger", 55))  # Default: slightly hungry
        merged.setdefault("cleanliness", baseline.get("hygiene", baseline.get("cleanliness", 60)))  # Support both field names
        merged.setdefault("health", baseline.get("health", 65))  # Default: good health
        merged.setdefault("last_updated", datetime.utcnow().isoformat())  # Track update timestamp
        return merged

    def _predict_health(self, pet_state: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Predict pet health forecast based on current stats.
        
        Analyzes multiple factors:
        - Health score (primary indicator)
        - Energy level
        - Hunger level
        - Cleanliness/hygiene
        
        Calculates:
        - Risk level (low/medium/high) based on critical thresholds
        - Trend (improving/steady/declining) based on composite score
        - Recommended actions for low stats
        
        Args:
            pet_state: Current pet state with health, energy, hunger, cleanliness
            
        Returns:
            Health forecast dict with trend, risk, and recommendations, or None if no state
        """
        if not pet_state:
            return None
        health_score = pet_state.get("health")
        energy = pet_state.get("energy", 60)
        hunger = pet_state.get("hunger", 60)
        # Support both cleanliness and hygiene field names
        cleanliness = pet_state.get("cleanliness", pet_state.get("hygiene", 60))

        risk_level = "low"
        trend = "steady"
        actions: List[str] = []

        # Calculate composite health score from multiple factors
        # Negative adjustments for low values, positive for high values
        composite = 0
        for value in (energy, hunger, cleanliness):
            if value < 30:  # Critical threshold: very low
                composite -= 15
            elif value > 70:  # Excellent threshold: very high
                composite += 10
        # Add health score contribution (centered at 60)
        if isinstance(health_score, int):
            composite += health_score - 60
            # Set risk level based on health score thresholds
            if health_score < 45:
                risk_level = "medium"
            if health_score < 30:  # Critical health
                risk_level = "high"

        # Determine trend from composite score
        if composite > 10:
            trend = "improving"
        elif composite < -10:
            trend = "declining"

        # Generate actionable recommendations for low stats
        if hunger < 35:  # Very hungry
            actions.append("Plan a nourishing meal soon to avoid fatigue.")
        if energy < 40:  # Low energy
            actions.append("Schedule a rest period or quiet activity to recover energy.")
        if cleanliness < 35:  # Poor hygiene
            actions.append("Consider grooming or a bath to boost comfort.")

        return {
            "trend": trend,
            "risk": risk_level,
            "recommended_actions": actions or ["Maintain current care routine."],
        }

    def _fallback_response(
        self,
        message: str,
        pet_snapshot: Optional[Dict[str, Any]],
        persona: Dict[str, str],
    ) -> Dict[str, Any]:
        mood = self._infer_mood_from_snapshot(pet_snapshot)
        pet_state = self._merge_pet_state(pet_snapshot, None, mood)
        health_forecast = self._predict_health(pet_state)
        response_text = self._fabricate_message(message, pet_snapshot)

        return {
            "message": response_text,
            "mood": mood,
            "notifications": ["Connected in offline mode. Some insights may be approximate."],
            "pet_state": pet_state,
            "health_forecast": health_forecast,
        }

    @staticmethod
    def _derive_personality(pet_snapshot: Optional[Dict[str, Any]]) -> Dict[str, str]:
        """
        Derive pet personality traits based on species/type.
        
        Creates personalized AI responses by matching pet species to personality
        archetypes. Each species has unique traits, tone, and motivation that
        influence how Scout (the AI) responds to users.
        
        Args:
            pet_snapshot: Pet data containing species information
            
        Returns:
            Dict with personality traits: traits, tone, and motivation strings
        """
        # Default personality if no pet snapshot available
        if not pet_snapshot:
            return {"traits": "gentle and curious", "tone": "warm", "motivation": "encouraging daily care"}
        species = (pet_snapshot.get("species") or "").lower()
        # Species-specific personality archetypes
        personality_map = {
            "canine": {"traits": "loyal and adventurous", "tone": "energetic", "motivation": "active playtime"},
            "feline": {"traits": "independent yet affectionate", "tone": "soothing", "motivation": "cozy routines"},
            "dragon": {"traits": "brave and wise", "tone": "majestic", "motivation": "mindful training"},
        }
        # Match species (supports partial matches like "canine" in "canine-dog")
        for key, value in personality_map.items():
            if key in species:
                return value
        # Default personality for unknown species
        return {"traits": "curious and loyal", "tone": "warm", "motivation": "kind interactions"}

    @staticmethod
    def _score_from_mood(mood: Optional[str]) -> int:
        """
        Convert mood string to numeric happiness score (0-100).
        
        Maps emotional states to quantitative scores for consistency.
        Used when mood is known but happiness score is missing.
        
        Args:
            mood: Mood string (ecstatic, happy, content, anxious, distressed)
            
        Returns:
            Numeric happiness score (0-100), defaults to 70 (content)
        """
        mapping = {
            "ecstatic": 95,  # Extremely happy
            "happy": 85,     # Very happy
            "content": 70,   # Neutral-positive (default)
            "anxious": 45,   # Worried/uncomfortable
            "distressed": 25, # Very unhappy
        }
        return mapping.get((mood or "").lower(), 70)  # Default to content

    def _infer_mood_from_snapshot(self, pet_snapshot: Optional[Dict[str, Any]]) -> str:
        """
        Infer pet mood from stat snapshot when explicit mood is missing.
        
        Uses weighted average of key stats (hunger, energy, hygiene, health)
        to determine emotional state. This provides a fallback when mood
        field is not explicitly set.
        
        Args:
            pet_snapshot: Pet state with stats but potentially missing mood
            
        Returns:
            Inferred mood string (ecstatic, happy, content, anxious, distressed)
        """
        # Default to neutral-positive if no snapshot
        if not pet_snapshot:
            return "content"
        # Use explicit mood if available
        mood = pet_snapshot.get("mood")
        if mood:
            return str(mood).lower()
        # Calculate average of key wellbeing stats
        scores = [
            pet_snapshot.get("hunger", 0),
            pet_snapshot.get("energy", 0),
            pet_snapshot.get("hygiene", pet_snapshot.get("cleanliness", 0)),
            pet_snapshot.get("health", 0),
        ]
        avg = sum(scores) / max(len(scores), 1)
        # Map average score to mood using thresholds
        if avg >= 80:  # Excellent stats
            return "ecstatic"
        if avg >= 60:  # Good stats
            return "happy"
        if avg >= 45:  # Average stats
            return "content"
        if avg >= 30:  # Poor stats
            return "anxious"
        return "distressed"  # Very poor stats

    def _fabricate_message(self, message: str, pet_snapshot: Optional[Dict[str, Any]]) -> str:
        base_name = pet_snapshot.get("name") if pet_snapshot else "your pet"
        mood = self._infer_mood_from_snapshot(pet_snapshot)
        return (
            f"{base_name} listens attentively. They seem {mood}, and a gentle check-in together could help. "
            "Try offering comfort, a snack, or a quick play break."
        )
