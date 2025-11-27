"""
Conversational AI orchestration, with graceful fallbacks when API keys are absent.
"""

from __future__ import annotations

import asyncio
import hashlib
import json
import logging
from datetime import datetime, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple
from types import SimpleNamespace
from uuid import UUID

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.schemas.ai import AIChatRequest, AIChatResponse
from app.schemas.pet import PetInteractRequest
from app.services.mcp_memory import MCPMemoryStore, MemoryMessage
from app.models.ai_features import AIChatSession, AIChatMessage
from app.services.pet_service import (
    PetNotFoundError,
    bathe_pet,
    check_health,
    feed_pet,
    get_pet_ai_overview,
    get_pet_stats,
    play_with_pet,
    rest_pet,
)

LOGGER = logging.getLogger(__name__)

# In-memory cache for pet context (TTL: 5 seconds)
_pet_context_cache: Dict[str, Tuple[Dict[str, Any], datetime]] = {}
CACHE_TTL_SECONDS = 5

SYSTEM_PROMPT = (
    "You are Scout, an empathetic AI caretaker for a virtual pet experience. "
    "You speak as a supportive companion to the player, summarising the pet's state, "
    "celebrating improvements, and providing clear next steps when care is needed. "
    "Always respond with a JSON object using the following structure:\n"
    '{\n'
    '  "message": string (<= 120 words, conversational),\n'
    '  "mood": one of ["ecstatic", "happy", "content", "anxious", "distressed"],\n'
    '  "notifications": array of up to 3 short actionable strings,\n'
    '  "pet_state": {\n'
    '      "mood": string,\n'
    '      "happiness": number,\n'
    '      "energy": number,\n'
    '      "hunger": number,\n'
    '      "cleanliness": number,\n'
    '      "health": number,\n'
    '      "personality_traits": array of strings,\n'
    '      "personality_summary": string\n'
    '  },\n'
    '  "health_forecast": {\n'
    '      "trend": string,\n'
    '      "risk": string,\n'
    '      "recommended_actions": array of strings\n'
    '  }\n'
    "}\n"
    "If information is missing, still include the field with a sensible default "
    "(for example empty arrays). Do not include additional commentary outside of JSON."
)

ACTION_ALIASES: Dict[str, str] = {
    "feed": "feed",
    "meal": "feed",
    "treat": "feed",
    "snack": "feed",
    "play": "play",
    "game": "play",
    "train": "play",
    "pet": "play",
    "clean": "bathe",
    "bath": "bathe",
    "bathe": "bathe",
    "wash": "bathe",
    "rest": "rest",
    "sleep": "rest",
    "nap": "rest",
    "status": "status",
    "stats": "status",
    "check": "status",
}


class AIChatService:
    """Conversational AI orchestrator wired into Llama 4 (OpenRouter)."""

    def __init__(self, memory_store: Optional[MCPMemoryStore] = None) -> None:
        self._memory = memory_store or MCPMemoryStore()

    async def chat(
        self,
        session: AsyncSession,
        user_id: str,
        payload: AIChatRequest,
    ) -> AIChatResponse:
        """
        Handle free-form chat with Scout.
        Persists messages to database for full conversation history.
        """

        from uuid import UUID
        from sqlalchemy import select
        
        session_id = payload.ensure_session_id()
        user_uuid = UUID(user_id) if isinstance(user_id, str) else user_id
        
        # Get or create chat session in database
        db_session = await self._get_or_create_chat_session(session, user_uuid, session_id)
        
        history = await self._memory.get_history(session_id)

        pet_context = await self._collect_pet_context(session, user_id)

        # Persist user message to database
        user_message = await self._persist_message(
            session,
            db_session.id,
            user_uuid,
            "user",
            payload.message,
            metadata={"type": "chat"},
        )

        await self._memory.append(
            session_id,
            MemoryMessage(role="user", content=payload.message, metadata={"type": "chat"}),
        )

        llm_messages = self._compose_messages(history, pet_context["context_blob"], payload.message)
        response_payload = await self._dispatch_to_llm(
            llm_messages,
            payload.model,
            fallback_seed=payload.message,
            pet_context=pet_context,
        )

        # Persist assistant message to database
        await self._persist_message(
            session,
            db_session.id,
            user_uuid,
            "assistant",
            response_payload["message"],
            metadata={
                "type": "chat",
                "mood": response_payload.get("mood"),
                "notifications": response_payload.get("notifications", []),
            },
            pet_state=response_payload.get("pet_state"),
            health_forecast=response_payload.get("health_forecast"),
            mood=response_payload.get("mood"),
            notifications=response_payload.get("notifications", []),
        )

        await self._memory.append(
            session_id,
            MemoryMessage(
                role="assistant",
                content=response_payload["message"],
                metadata={
                    "type": "chat",
                    "mood": response_payload.get("mood"),
                    "notifications": response_payload.get("notifications", []),
                },
            ),
        )

        return AIChatResponse(
            session_id=session_id,
            message=response_payload["message"],
            mood=response_payload.get("mood"),
            notifications=response_payload.get("notifications", []),
            pet_state=response_payload.get("pet_state"),
            health_forecast=response_payload.get("health_forecast"),
        )

    async def interact(
        self,
        session: AsyncSession,
        user_id: str,
        payload: PetInteractRequest,
    ) -> AIChatResponse:
        """
        Handle command-oriented pet interactions (feed, play, etc).
        Persists messages to database for full conversation history.
        """

        from uuid import UUID as UUIDType
        
        session_id = payload.ensure_session_id()
        user_uuid = UUIDType(user_id) if isinstance(user_id, str) else user_id
        
        # Get or create chat session in database
        db_session = await self._get_or_create_chat_session(session, user_uuid, session_id)
        
        history = await self._memory.get_history(session_id)

        try:
            action_result, interpreted_action, command_summary = await self._execute_pet_action(
                session, user_id, payload
            )
        except PetNotFoundError:
            response = self._no_pet_response(payload.original_prompt or payload.action)
            
            # Persist messages to database
            user_msg = payload.original_prompt or payload.action
            await self._persist_message(
                session,
                db_session.id,
                user_uuid,
                "user",
                user_msg,
                metadata={"type": "command"},
            )
            await self._persist_message(
                session,
                db_session.id,
                user_uuid,
                "assistant",
                response["message"],
                metadata={"type": "command", "fallback": True},
            )
            
            await self._memory.append(
                session_id,
                MemoryMessage(role="user", content=user_msg, metadata={"type": "command"}),
            )
            await self._memory.append(
                session_id,
                MemoryMessage(role="assistant", content=response["message"], metadata={"type": "command", "fallback": True}),
            )
            return AIChatResponse(**response, session_id=session_id)

        # Persist user command message
        await self._persist_message(
            session,
            db_session.id,
            user_uuid,
            "user",
            command_summary,
            metadata={"type": "command", "action": interpreted_action},
        )

        await self._memory.append(
            session_id,
            MemoryMessage(
                role="user",
                content=command_summary,
                metadata={"type": "command", "action": interpreted_action},
            ),
        )

        pet_context = await self._collect_pet_context(session, user_id)

        prompt = (
            f"A command was executed: {command_summary}\n"
            f"System reaction: {action_result.reaction}.\n"
            "Provide an encouraging update that references the new stats when helpful."
        )
        llm_messages = self._compose_messages(history, pet_context["context_blob"], prompt)

        response_payload = await self._dispatch_to_llm(
            llm_messages,
            model_override=None,
            fallback_seed=action_result.reaction,
            pet_context=pet_context,
        )

        # Persist assistant response to database
        await self._persist_message(
            session,
            db_session.id,
            user_uuid,
            "assistant",
            response_payload["message"],
            metadata={
                "type": "command",
                "action": interpreted_action,
                "notifications": response_payload.get("notifications", []),
            },
            pet_state=response_payload.get("pet_state"),
            health_forecast=response_payload.get("health_forecast"),
            mood=response_payload.get("mood"),
            notifications=response_payload.get("notifications", []),
        )

        await self._memory.append(
            session_id,
            MemoryMessage(
                role="assistant",
                content=response_payload["message"],
                metadata={
                    "type": "command",
                    "action": interpreted_action,
                    "notifications": response_payload.get("notifications", []),
                },
            ),
        )

        return AIChatResponse(
            session_id=session_id,
            message=response_payload["message"],
            mood=response_payload.get("mood"),
            notifications=response_payload.get("notifications", []),
            pet_state=response_payload.get("pet_state"),
            health_forecast=response_payload.get("health_forecast"),
        )

    async def _collect_pet_context(
        self,
        session: AsyncSession,
        user_id: str,
    ) -> Dict[str, Any]:
        """
        Aggregate the latest pet stats and AI insights used across responses.
        Uses caching to avoid redundant database queries within a short time window.
        """

        # Check cache first
        cache_key = f"pet_context_{user_id}"
        now = datetime.now(timezone.utc)
        
        if cache_key in _pet_context_cache:
            cached_context, cached_time = _pet_context_cache[cache_key]
            if (now - cached_time).total_seconds() < CACHE_TTL_SECONDS:
                LOGGER.debug(f"Using cached pet context for user {user_id}")
                return cached_context
            else:
                # Expired cache entry
                del _pet_context_cache[cache_key]

        context: Dict[str, Any] = {
            "pet_exists": False,
            "pet_state": None,
            "health_forecast": None,
            "notifications": ["Create a pet to unlock full AI interactions."],
            "personality_traits": [],
            "personality_summary": "",
        }

        try:
            # Parallel fetch for better performance
            stats_task = get_pet_stats(session, user_id)
            overview_task = get_pet_ai_overview(session, user_id)
            stats, overview = await asyncio.gather(stats_task, overview_task, return_exceptions=True)
            
            if isinstance(stats, Exception) or isinstance(overview, Exception):
                raise PetNotFoundError("Pet not found")
        except PetNotFoundError:
            context["context_blob"] = json.dumps({"pet_exists": False})
            _pet_context_cache[cache_key] = (context, now)
            return context

        pet_state = {
            "mood": overview.get("mood"),
            "happiness": stats.happiness,
            "energy": stats.energy,
            "hunger": stats.hunger,
            "cleanliness": stats.cleanliness,
            "health": stats.health,
            "personality_traits": overview.get("personality_traits", []),
            "personality_summary": overview.get("personality_summary", ""),
            "care_style": overview.get("care_style"),
            "recommended_actions": overview.get("recommended_actions", []),
            "last_updated": datetime.now(timezone.utc).isoformat(),
        }

        health_forecast = {
            "trend": self._derive_trend(overview.get("health_risk_level")),
            "risk": overview.get("health_risk_level"),
            "summary": overview.get("predicted_health"),
            "factors": overview.get("health_factors", []),
            "recommended_actions": overview.get("recommended_actions", []),
        }

        notifications = [note["message"] for note in overview.get("notifications", [])]

        context.update(
            {
                "pet_exists": True,
                "pet_state": pet_state,
                "health_forecast": health_forecast,
                "notifications": notifications,
                "context_blob": json.dumps(
                    {
                        "pet_state": pet_state,
                        "health_forecast": health_forecast,
                        "help_suggestions": overview.get("help_suggestions", []),
                        "predicted_health": overview.get("predicted_health"),
                        "care_style": overview.get("care_style"),
                        "personality_traits": overview.get("personality_traits", []),
                    },
                    ensure_ascii=False,
                ),
            }
        )

        # Cache the context
        _pet_context_cache[cache_key] = (context, now)
        
        # Clean up old cache entries (keep cache size manageable)
        if len(_pet_context_cache) > 100:
            expired_keys = [
                k for k, (_, t) in _pet_context_cache.items()
                if (now - t).total_seconds() > CACHE_TTL_SECONDS * 2
            ]
            for k in expired_keys:
                del _pet_context_cache[k]

        return context

    async def _dispatch_to_llm(
        self,
        messages: List[Dict[str, Any]],
        model_override: Optional[str],
        *,
        fallback_seed: str,
        pet_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Execute the OpenRouter request and merge the structured payload with deterministic context.
        """

        settings = get_settings()
        if not settings.openrouter_api_key:
            LOGGER.warning("OPENROUTER_API_KEY missing; falling back to deterministic response.")
            return self._fallback_payload(fallback_seed, pet_context)

        try:
            raw_response = await self._invoke_openrouter(messages, model_override or settings.openrouter_model)
            structured = self._parse_structured_response(raw_response)
        except Exception as exc:  # pragma: no cover - network fallback
            LOGGER.exception("OpenRouter request failed: %s", exc)
            structured = {}

        payload = self._merge_payload(structured, fallback_seed, pet_context)
        return payload

    async def _invoke_openrouter(self, messages: List[Dict[str, Any]], model: str) -> str:
        """
        Call the OpenRouter chat completions API with retries and optimized timeout.
        """

        settings = get_settings()
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://virtual-pet.local",
            "X-Title": "Virtual Pet Assistant",
        }
        payload = {"model": model, "messages": messages, "temperature": 0.45, "max_tokens": 320}

        # Use connection pooling and reduced timeout for faster responses
        timeout = httpx.Timeout(15.0, connect=5.0)  # Reduced from 40s to 15s total, 5s connect
        last_error: Optional[Exception] = None
        
        # Create a shared client for connection reuse
        async with httpx.AsyncClient(timeout=timeout, limits=httpx.Limits(max_keepalive_connections=10)) as client:
            for attempt in range(2):  # Reduced retries from 3 to 2 for faster failure
                try:
                    response = await client.post(
                        str(settings.openrouter_base_url),
                        json=payload,
                        headers=headers,
                    )
                    if response.status_code < 500:
                        response.raise_for_status()
                        data = response.json()
                        return data["choices"][0]["message"]["content"]
                except (httpx.HTTPError, KeyError, ValueError) as exc:
                    last_error = exc
                    if attempt < 1:  # Only retry once
                        delay = 0.3 * (2**attempt)  # Faster retry delays
                        await asyncio.sleep(delay)
                        continue

        raise RuntimeError("OpenRouter request failed") from last_error

    def _compose_messages(
        self,
        history: List[MemoryMessage],
        context_blob: str,
        user_content: str,
    ) -> List[Dict[str, Any]]:
        """
        Build the message list for OpenRouter, merging instructions, memory, and the new user input.
        """

        compiled_history = [{"role": msg.role, "content": msg.content} for msg in history]
        compiled_history = compiled_history[-15:]

        system_context = {"role": "system", "content": SYSTEM_PROMPT}
        context_message = {
            "role": "system",
            "content": f"Pet context (JSON): {context_blob}",
        }
        user_message = {"role": "user", "content": user_content}

        return [system_context, context_message, *compiled_history, user_message]

    def _parse_structured_response(self, raw_text: str) -> Dict[str, Any]:
        """
        Attempt to parse the model output into a dictionary.
        """

        raw_text = raw_text.strip()
        if not raw_text:
            return {}

        try:
            return json.loads(raw_text)
        except json.JSONDecodeError:
            # Attempt to salvage embedded JSON
            start = raw_text.find("{")
            end = raw_text.rfind("}")
            if start != -1 and end != -1 and end > start:
                snippet = raw_text[start : end + 1]
                try:
                    return json.loads(snippet)
                except json.JSONDecodeError:
                    return {"message": raw_text}
        except TypeError:
            return {}

        return {"message": raw_text}

    def _merge_payload(
        self,
        structured: Dict[str, Any],
        fallback_seed: str,
        pet_context: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Combine model output with deterministic mood, notifications, and health data.
        """

        fallback = self._fallback_payload(fallback_seed, pet_context)

        message = structured.get("message") if isinstance(structured, dict) else None
        if not isinstance(message, str) or not message.strip():
            message = fallback["message"]

        mood = structured.get("mood")
        if mood not in {"ecstatic", "happy", "content", "anxious", "distressed"}:
            mood = fallback.get("mood")

        notifications = structured.get("notifications")
        if not isinstance(notifications, list):
            notifications = []
        notifications = [str(note) for note in notifications if str(note).strip()]
        notifications = notifications[:3]
        if not notifications:
            notifications = fallback.get("notifications", [])

        pet_state = structured.get("pet_state") if isinstance(structured, dict) else None
        if not isinstance(pet_state, dict):
            pet_state = {}
        merged_pet_state = dict(pet_context.get("pet_state") or {})
        merged_pet_state.update({k: v for k, v in pet_state.items() if v is not None})
        if merged_pet_state:
            merged_pet_state["last_updated"] = datetime.now(timezone.utc).isoformat()

        health_forecast = structured.get("health_forecast") if isinstance(structured, dict) else None
        if not isinstance(health_forecast, dict):
            health_forecast = {}
        merged_health = dict(pet_context.get("health_forecast") or {})
        merged_health.update({k: v for k, v in health_forecast.items() if v is not None})

        return {
            "message": message,
            "mood": mood,
            "notifications": notifications,
            "pet_state": merged_pet_state or None,
            "health_forecast": merged_health or None,
        }

    def _fallback_payload(self, seed_text: str, pet_context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a deterministic response when the LLM is unavailable.
        """

        pet_state = pet_context.get("pet_state")
        notifications = pet_context.get("notifications", [])
        if not pet_context.get("pet_exists"):
            message = (
                "Let's get your pet set up first! Visit the customization screen to create a companion, "
                "then I'll keep you posted on their mood and health."
            )
            mood = "content"
        else:
            lowered = seed_text.lower()
            if "hungry" in lowered or (pet_state and pet_state.get("hunger", 60) < 40):
                message = "I'll prep a nutritious meal! Keep an eye on hunger so your pet stays energized."
                mood = "anxious"
            elif "sleep" in lowered or "rest" in lowered or (pet_state and pet_state.get("energy", 50) < 40):
                message = "Time for a cozy rest. Lower lights and a gentle routine will help recovery."
                mood = "content"
            elif "play" in lowered or (pet_state and pet_state.get("happiness", 50) < 45):
                message = "A playful session will do wonders! Grab a toy or start a mini-game to boost happiness."
                mood = "happy"
            else:
                message = "Thanks for the update! Your steady care keeps the vitals balanced."
                mood = "content"

        return {
            "message": message,
            "mood": mood,
            "notifications": notifications[:3],
            "pet_state": pet_state,
            "health_forecast": pet_context.get("health_forecast"),
        }

    async def _execute_pet_action(
        self,
        session: AsyncSession,
        user_id: str,
        payload: PetInteractRequest,
    ) -> Tuple[Any, str, str]:
        """
        Translate the requested action into stat updates and generate a command summary.
        """

        action = self._normalize_action(payload.normalized_action())
        inferred_parameters = self._infer_parameters(action, payload)

        if action == "feed":
            response = await feed_pet(session, user_id, inferred_parameters.get("food_type", "standard"))
            summary = f"/feed ({inferred_parameters.get('food_type', 'standard')})"
        elif action == "play":
            response = await play_with_pet(session, user_id, inferred_parameters.get("game_type", "free_play"))
            summary = f"/play ({inferred_parameters.get('game_type', 'free_play')})"
        elif action == "bathe":
            response = await bathe_pet(session, user_id)
            summary = "/bathe"
        elif action == "rest":
            duration = int(inferred_parameters.get("duration_hours", 2))
            response = await rest_pet(session, user_id, duration)
            summary = f"/rest ({duration}h)"
        elif action == "status":
            # Status is a read-only action—reuse health summary for flavour.
            await check_health(session, user_id)
            pet_context = await self._collect_pet_context(session, user_id)
            message = "Here's the latest status check."
            response = SimpleNamespace(reaction=message, pet=pet_context.get("pet_state"))
            summary = "/status"
        else:
            raise ValueError(f"Unsupported action '{payload.action}'.")

        original_input = payload.original_prompt or payload.message or f"/{action}"
        command_summary = f"{original_input.strip()} -> {summary}"
        return response, action, command_summary

    def _normalize_action(self, raw_action: str) -> str:
        """
        Map raw action strings (and their aliases) to canonical command verbs.
        """

        return ACTION_ALIASES.get(raw_action, raw_action)

    def _infer_parameters(self, action: str, payload: PetInteractRequest) -> Dict[str, Any]:
        """
        Infer structured parameters from the payload/message for each action.
        """

        text = (payload.message or payload.original_prompt or "").lower()
        params: Dict[str, Any] = {}

        if action == "feed":
            food_type = payload.food_type
            if not food_type:
                if "premium" in text or "gourmet" in text:
                    food_type = "premium"
                elif "treat" in text or "snack" in text:
                    food_type = "treat"
                elif "healthy" in text or "balanced" in text:
                    food_type = "healthy"
            params["food_type"] = food_type or "standard"
        elif action == "play":
            game_type = payload.game_type
            if not game_type:
                if "fetch" in text:
                    game_type = "fetch"
                elif "puzzle" in text:
                    game_type = "puzzle"
                elif "race" in text:
                    game_type = "race"
            params["game_type"] = game_type or "free_play"
        elif action == "rest":
            duration = payload.duration_hours
            if duration is None:
                if "overnight" in text or "long" in text:
                    duration = 8
                elif "nap" in text or "short" in text:
                    duration = 2
            params["duration_hours"] = duration or 4

        return params

    async def _get_or_create_chat_session(
        self,
        session: AsyncSession,
        user_id: UUID,
        session_id: str,
    ) -> AIChatSession:
        """
        Get or create a chat session in the database.
        
        Args:
            session: Database session
            user_id: User UUID
            session_id: Session ID string
            
        Returns:
            AIChatSession database model
        """
        from sqlalchemy import select
        
        try:
            # Try to find existing session
            stmt = select(AIChatSession).where(
                AIChatSession.user_id == user_id,
                AIChatSession.session_id == session_id,
            )
            result = await session.execute(stmt)
            db_session = result.scalar_one_or_none()
            
            if db_session:
                return db_session
            
            # Create new session
            db_session = AIChatSession(
                user_id=user_id,
                session_id=session_id,
                message_count=0,
            )
            session.add(db_session)
            await session.commit()
            await session.refresh(db_session)
            return db_session
            
        except Exception as e:
            await session.rollback()
            LOGGER.error(f"Error getting/creating chat session: {str(e)}", exc_info=True)
            raise

    async def _persist_message(
        self,
        session: AsyncSession,
        db_session_id: UUID,
        user_id: UUID,
        role: str,
        content: str,
        metadata: Optional[Dict[str, Any]] = None,
        pet_state: Optional[Dict[str, Any]] = None,
        health_forecast: Optional[Dict[str, Any]] = None,
        mood: Optional[str] = None,
        notifications: Optional[List[str]] = None,
    ) -> AIChatMessage:
        """
        Persist a chat message to the database.
        
        Args:
            session: Database session
            db_session_id: Database session UUID
            user_id: User UUID
            role: Message role (user/assistant/system)
            content: Message content
            metadata: Optional metadata dict
            pet_state: Optional pet state dict
            health_forecast: Optional health forecast dict
            mood: Optional mood string
            notifications: Optional notifications list
            
        Returns:
            AIChatMessage database model
        """
        try:
            message = AIChatMessage(
                session_id=db_session_id,
                user_id=user_id,
                role=role,
                content=content,
                metadata_json=metadata,
                pet_state_json=pet_state,
                health_forecast_json=health_forecast,
                mood=mood,
                notifications_json=notifications,
            )
            session.add(message)
            await session.commit()
            await session.refresh(message)
            return message
            
        except Exception as e:
            await session.rollback()
            LOGGER.error(f"Error persisting chat message: {str(e)}", exc_info=True)
            # Don't fail the request if persistence fails
            raise

    def _derive_trend(self, risk_level: Optional[str]) -> str:
        """
        Translate risk level into a qualitative trend for the UI.
        """

        if risk_level == "high":
            return "declining"
        if risk_level == "medium":
            return "watching"
        return "stable"

    def _no_pet_response(self, seed: str) -> Dict[str, Any]:
        """
        Fallback payload when the user has not yet created a pet.
        """

        message = (
            "I can't find a pet linked to your profile yet. Head to the pet creation screen "
            "to adopt one—I'll be right here with mood updates once you're set!"
        )
        return {
            "message": message,
            "mood": "content",
            "notifications": ["Create a pet to begin receiving AI care insights."],
            "pet_state": None,
            "health_forecast": None,
        }


ai_chat_service = AIChatService()


