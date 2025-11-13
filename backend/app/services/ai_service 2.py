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
    """High-level orchestrator for Llama 4 conversational intelligence."""

    def __init__(
        self,
        pool: Optional[Pool] = None,
        client: Optional[httpx.AsyncClient] = None,
        context_mgr: Optional[ContextManager] = None,
    ) -> None:
        self._pool = pool
        self._client = client
        self._context_mgr = context_mgr or default_context_manager
        self._max_retries = 3
        self._retry_delay = 0.75

    async def chat(
        self,
        user_id: str,
        payload: AIChatRequest,
        pet_snapshot: Optional[Dict[str, Any]] = None,
    ) -> AIChatResponse:
        """Generate an AI response grounded in MCP session context."""
        if self._context_mgr is None or MessageRole is None:
            logger.warning("MCP context manager unavailable; responses will be stateless.")
            session_id = payload.session_id or f"stateless-{user_id}"
        else:
            session = await self._context_mgr.get_or_create_session(
                session_id=payload.session_id,
                user_id=user_id,
            )
            session_id = session.session_id
            await self._context_mgr.update_session(
                session_id=session_id,
                role=MessageRole.USER,
                content=payload.message,
                source="chat",
            )
            session = await self._context_mgr.get_or_create_session(session_id=session_id, create_if_missing=False)

        history_messages = []
        if self._context_mgr is not None and MessageRole is not None:
            history_messages = (session.to_openai_format() if session else [])  # type: ignore[assignment]

        persona = self._derive_personality(pet_snapshot)
        prompt_messages = self._build_prompt(history_messages, payload.message, pet_snapshot, persona, payload.model)

        settings = get_settings()
        if not settings.openrouter_api_key:
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

        response_payload = await self._invoke_llama(settings, prompt_messages, payload.model)
        parsed = self._parse_llama_response(response_payload, payload.message, pet_snapshot)

        pet_state = self._merge_pet_state(pet_snapshot, parsed.get("pet_state"), parsed.get("mood"))
        health_forecast = parsed.get("health_forecast") or self._predict_health(pet_state)

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
        client = self._client or httpx.AsyncClient()
        close_client = self._client is None
        payload = {
            "model": model_override or settings.openrouter_model,
            "messages": messages,
            "temperature": 0.65,
            "max_tokens": 512,
        }
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://virtual-pet.local",
        }

        last_error: Optional[Exception] = None
        try:
            for attempt in range(1, self._max_retries + 1):
                try:
                    response = await client.post(
                        settings.openrouter_base_url,
                        headers=headers,
                        json=payload,
                        timeout=30.0,
                    )
                    if response.status_code < 500:
                        return response.json()
                    logger.warning("OpenRouter returned status %s (attempt %s)", response.status_code, attempt)
                    last_error = HTTPException(
                        status_code=response.status_code,
                        detail=f"LLM gateway error: {response.text[:200]}",
                    )
                except httpx.RequestError as exc:
                    last_error = exc
                    logger.exception("OpenRouter request failure on attempt %s: %s", attempt, exc)
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
        try:
            content = payload["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            if not isinstance(parsed, dict):  # type: ignore[unreachable]
                raise ValueError("Parsed content is not a dict")
        except Exception as exc:  # pragma: no cover - defensive
            logger.warning("Failed to parse Llama response; falling back to heuristic. Error: %s", exc)
            return self._fallback_response(fallback_message, pet_snapshot, {})

        parsed.setdefault("message", parsed.get("response") or parsed.get("reaction") or "")
        if not parsed["message"]:
            parsed["message"] = self._fabricate_message(fallback_message, pet_snapshot)
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
        system_prompt = (
            "You are Scout, an empathetic AI companion helping users care for their virtual pets. "
            "Always respond with a compact JSON object containing the keys: message, mood, "
            "notifications, pet_state, and health_forecast. "
            "Mood must be one of: ecstatic, happy, content, anxious, distressed. "
            "Pet state should mirror the structure {\"mood\": str, \"happiness\": int, \"energy\": int, "
            "\"hunger\": int, \"cleanliness\": int}. Provide actionable yet encouraging advice."
        )
        persona_blurb = (
            f"The pet prefers {persona.get('motivation', 'gentle interactions')} and speaks with a "
            f"{persona.get('tone', 'warm and playful')} tone. Personality: {persona.get('traits', 'curious and loyal')}."
        )

        messages: List[Dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            {"role": "system", "content": persona_blurb},
        ]

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

        # Only keep the last 12 conversational turns to control token usage.
        trimmed_history = history_messages[-12:] if history_messages else []
        messages.extend(trimmed_history)

        if not trimmed_history:
            messages.append({"role": "user", "content": latest_message})

        return messages

    def _merge_pet_state(
        self,
        original: Optional[Dict[str, Any]],
        ai_state: Optional[Dict[str, Any]],
        mood: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        if original is None and ai_state is None:
            return None
        baseline = original or {}
        merged = dict(baseline)
        ai_state = ai_state or {}
        merged.update(
            {k: v for k, v in ai_state.items() if v is not None}
        )
        if mood:
            merged["mood"] = mood
        if "happiness" not in merged and mood:
            merged["happiness"] = self._score_from_mood(mood)
        merged.setdefault("happiness", self._score_from_mood(merged.get("mood", "content")))
        merged.setdefault("energy", baseline.get("energy", 60))
        merged.setdefault("hunger", baseline.get("hunger", 55))
        merged.setdefault("cleanliness", baseline.get("hygiene", baseline.get("cleanliness", 60)))
        merged.setdefault("health", baseline.get("health", 65))
        merged.setdefault("last_updated", datetime.utcnow().isoformat())
        return merged

    def _predict_health(self, pet_state: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not pet_state:
            return None
        health_score = pet_state.get("health")
        energy = pet_state.get("energy", 60)
        hunger = pet_state.get("hunger", 60)
        cleanliness = pet_state.get("cleanliness", pet_state.get("hygiene", 60))

        risk_level = "low"
        trend = "steady"
        actions: List[str] = []

        composite = 0
        for value in (energy, hunger, cleanliness):
            if value < 30:
                composite -= 15
            elif value > 70:
                composite += 10
        if isinstance(health_score, int):
            composite += health_score - 60
            if health_score < 45:
                risk_level = "medium"
            if health_score < 30:
                risk_level = "high"

        if composite > 10:
            trend = "improving"
        elif composite < -10:
            trend = "declining"

        if hunger < 35:
            actions.append("Plan a nourishing meal soon to avoid fatigue.")
        if energy < 40:
            actions.append("Schedule a rest period or quiet activity to recover energy.")
        if cleanliness < 35:
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
        if not pet_snapshot:
            return {"traits": "gentle and curious", "tone": "warm", "motivation": "encouraging daily care"}
        species = (pet_snapshot.get("species") or "").lower()
        personality_map = {
            "canine": {"traits": "loyal and adventurous", "tone": "energetic", "motivation": "active playtime"},
            "feline": {"traits": "independent yet affectionate", "tone": "soothing", "motivation": "cozy routines"},
            "dragon": {"traits": "brave and wise", "tone": "majestic", "motivation": "mindful training"},
        }
        for key, value in personality_map.items():
            if key in species:
                return value
        return {"traits": "curious and loyal", "tone": "warm", "motivation": "kind interactions"}

    @staticmethod
    def _score_from_mood(mood: Optional[str]) -> int:
        mapping = {
            "ecstatic": 95,
            "happy": 85,
            "content": 70,
            "anxious": 45,
            "distressed": 25,
        }
        return mapping.get((mood or "").lower(), 70)

    def _infer_mood_from_snapshot(self, pet_snapshot: Optional[Dict[str, Any]]) -> str:
        if not pet_snapshot:
            return "content"
        mood = pet_snapshot.get("mood")
        if mood:
            return str(mood).lower()
        scores = [
            pet_snapshot.get("hunger", 0),
            pet_snapshot.get("energy", 0),
            pet_snapshot.get("hygiene", pet_snapshot.get("cleanliness", 0)),
            pet_snapshot.get("health", 0),
        ]
        avg = sum(scores) / max(len(scores), 1)
        if avg >= 80:
            return "ecstatic"
        if avg >= 60:
            return "happy"
        if avg >= 45:
            return "content"
        if avg >= 30:
            return "anxious"
        return "distressed"

    def _fabricate_message(self, message: str, pet_snapshot: Optional[Dict[str, Any]]) -> str:
        base_name = pet_snapshot.get("name") if pet_snapshot else "your pet"
        mood = self._infer_mood_from_snapshot(pet_snapshot)
        return (
            f"{base_name} listens attentively. They seem {mood}, and a gentle check-in together could help. "
            "Try offering comfort, a snack, or a quick play break."
        )
