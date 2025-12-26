"""AI-powered reaction generation and sentiment analysis for pets."""
from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Any, Dict, List, Optional

import httpx
from asyncpg import Pool
from fastapi import HTTPException, status

from app.core.config import get_settings

try:
    from mcp.context_manager import ContextManager, MessageRole, context_manager as default_context_manager
except Exception:  # pragma: no cover - MCP optional fallback
    ContextManager = None  # type: ignore[assignment]
    MessageRole = None  # type: ignore[assignment]
    default_context_manager = None  # type: ignore[assignment]


@dataclass
class ReactionResult:
    reaction: str
    mood: Optional[str]
    notifications: List[str]
    note: Optional[str]
    health_forecast: Optional[Dict[str, Any]] = None


class PetAIService:
    """Integrates with Llama 4 Scout via OpenRouter to provide adaptive responses."""

    def __init__(
        self,
        pool: Optional[Pool],
        client: Optional[httpx.AsyncClient] = None,
        context_mgr: Optional[ContextManager] = None,
    ) -> None:
        self._pool = pool
        self._client = client
        self._memory: Dict[str, List[Dict[str, Any]]] = {}
        self._context_mgr = context_mgr or default_context_manager
        self._max_retries = 3

    async def _ensure_tables(self, connection) -> None:
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS pet_ai_context (
                user_id UUID NOT NULL,
                pet_id UUID NOT NULL,
                memory JSONB NOT NULL DEFAULT '[]'::jsonb,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                PRIMARY KEY (user_id, pet_id)
            )
            """
        )

    async def _load_memory(self, user_id: str, pet_id: str) -> List[Dict[str, Any]]:
        if self._pool is None:
            key = f"{user_id}:{pet_id}"
            return self._memory.get(key, [])
        async with self._pool.acquire() as connection:
            await self._ensure_tables(connection)
            row = await connection.fetchrow(
                "SELECT memory FROM pet_ai_context WHERE user_id = $1 AND pet_id = $2",
                user_id,
                pet_id,
            )
            if row:
                stored = row["memory"]
                if isinstance(stored, str):
                    return json.loads(stored)
                return stored
        return []

    async def _save_memory(self, user_id: str, pet_id: str, memory: List[Dict[str, Any]]) -> None:
        trimmed = memory[-30:]
        if self._pool is None:
            key = f"{user_id}:{pet_id}"
            self._memory[key] = trimmed
            return
        async with self._pool.acquire() as connection:
            await self._ensure_tables(connection)
            await connection.execute(
                """
                INSERT INTO pet_ai_context (user_id, pet_id, memory, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (user_id, pet_id)
                DO UPDATE SET memory = EXCLUDED.memory, updated_at = NOW()
                """,
                user_id,
                pet_id,
                trimmed,
            )

    async def _post_with_retry(
        self,
        settings,
        headers: Dict[str, str],
        payload: Dict[str, Any],
    ) -> httpx.Response:
        client = self._client or httpx.AsyncClient()
        close_client = self._client is None
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
                        return response
                    last_error = HTTPException(
                        status_code=response.status_code,
                        detail=f"LLM gateway error: {response.text[:200]}",
                    )
                except httpx.RequestError as exc:
                    last_error = exc
                await asyncio.sleep(0.5 * attempt)
        finally:
            if close_client:
                await client.aclose()

        if isinstance(last_error, HTTPException):
            raise last_error
        if last_error:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI reaction service unavailable") from last_error
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "AI reaction service unavailable")

    async def generate_reaction(
        self,
        user_id: str,
        pet_id: str,
        context: Dict[str, Any],
    ) -> ReactionResult:
        settings = get_settings()
        if not settings.openrouter_api_key:
            return self._fallback_reaction(context)

        session_id = f"pet::{user_id}::{pet_id}"
        history = await self._load_memory(user_id, pet_id)
        mcp_history: List[Dict[str, Any]] = []

        if self._context_mgr is not None and MessageRole is not None:
            session = await self._context_mgr.get_or_create_session(session_id=session_id, user_id=user_id)
            await self._context_mgr.update_session(
                session_id=session.session_id,
                role=MessageRole.USER,
                content=json.dumps(
                    {
                        "type": "interaction",
                        "action": context.get("action"),
                        "stats_before": context.get("before"),
                        "stats_after": context.get("after"),
                    }
                ),
                source="pet_interaction",
            )
            session = await self._context_mgr.get_or_create_session(session.session_id, create_if_missing=False)
            mcp_history = session.to_openai_format() if session else []

        prompt = self._build_prompt(history, context, mcp_history)
        payload = {
            "model": settings.openrouter_model,
            "messages": prompt,
            "temperature": 0.7,
            "max_tokens": 256,
        }

        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://virtual-pet.local",
        }

        response = await self._post_with_retry(settings, headers, payload)

        if response.status_code >= 400:
            return self._fallback_reaction(context)

        try:
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
        except Exception:
            return self._fallback_reaction(context)

        reaction_text = parsed.get("reaction") or self._fallback_reaction(context).reaction
        mood = parsed.get("mood")
        notifications = parsed.get("notifications") or []
        note = parsed.get("note")
        health_forecast = parsed.get("health_forecast") or self._predict_health(context.get("after", {}))

        new_memory = history + [
            {
                "action": context["action"],
                "reaction": reaction_text,
                "mood": mood,
                "stats": context.get("after"),
            }
        ]
        await self._save_memory(user_id, pet_id, new_memory)

        if self._context_mgr is not None and MessageRole is not None:
            await self._context_mgr.update_session(
                session_id=session_id,
                role=MessageRole.ASSISTANT,
                content=reaction_text,
                mood=mood,
                notifications=notifications,
                health_forecast=health_forecast,
            )

        return ReactionResult(
            reaction=reaction_text,
            mood=mood,
            notifications=notifications,
            note=note,
            health_forecast=health_forecast,
        )

    async def analyze_sentiment(self, description: str) -> Optional[str]:
        settings = get_settings()
        if not settings.openrouter_api_key:
            return None

        prompt = [
            {
                "role": "system",
                "content": "Classify the sentiment of the user's message into ecstatic, happy, content, anxious, or distressed.",
            },
            {"role": "user", "content": description},
        ]
        payload = {
            "model": settings.openrouter_model,
            "messages": prompt,
            "temperature": 0.1,
            "max_tokens": 32,
        }
        headers = {
            "Authorization": f"Bearer {settings.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://virtual-pet.local",
        }
        client = self._client or httpx.AsyncClient()
        close_client = self._client is None
        try:
            response = await client.post(settings.openrouter_base_url, headers=headers, json=payload, timeout=15.0)
        finally:
            if close_client:
                await client.aclose()

        if response.status_code >= 400:
            return None

        try:
            data = response.json()
            text = data["choices"][0]["message"]["content"]
            normalized = text.strip().lower()
            for option in ["ecstatic", "happy", "content", "anxious", "distressed"]:
                if option in normalized:
                    return option
        except Exception:
            return None
        return None

    def _build_prompt(
        self,
        history: List[Dict[str, Any]],
        context: Dict[str, Any],
        mcp_history: List[Dict[str, Any]],
    ) -> List[Dict[str, str]]:
        messages: List[Dict[str, str]] = [
            {
                "role": "system",
                "content": (
                    "You are Scout, an empathetic AI companion for a virtual pet game. Respond in JSON with keys "
                    "reaction, mood, notifications, note, and health_forecast. Mood must be one of ecstatic, happy, "
                    "content, anxious, or distressed. health_forecast should describe trend, risk, and recommendations."
                ),
            }
        ]
        if history:
            history_text = json.dumps(history[-10:], default=str)
            messages.append({"role": "system", "content": f"Recent context: {history_text}"})
        if mcp_history:
            trimmed = json.dumps(mcp_history[-6:], default=str)
            messages.append({"role": "system", "content": f"MCP memory: {trimmed}"})
        user_message = {
            "role": "user",
            "content": json.dumps(context, default=str),
        }
        messages.append(user_message)
        return messages

    def _fallback_reaction(self, context: Dict[str, Any]) -> ReactionResult:
        action = context.get("action", "interaction")
        after_stats = context.get("after", {}) or {}
        mood = after_stats.get("mood")
        reaction_map = {
            "feed": "laps up the meal happily!",
            "play": "chirps with delight after the game!",
            "bathe": "shakes off the bubbles, looking refreshed!",
            "rest": "snoozes peacefully and stretches contently!",
        }
        reaction = reaction_map.get(action, "seems appreciative of your care!")
        health_forecast = self._predict_health(after_stats)
        return ReactionResult(
            reaction=reaction,
            mood=mood,
            notifications=[],
            note=None,
            health_forecast=health_forecast,
        )

    def _predict_health(self, stats: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if not stats:
            return None
        energy = stats.get("energy", 60)
        hunger = stats.get("hunger", 60)
        hygiene = stats.get("hygiene", stats.get("cleanliness", 60))
        health = stats.get("health", 65)

        composite = (energy + (100 - hunger) + hygiene + health) / 4
        trend = "steady"
        risk = "low"
        recommendations: List[str] = []

        if composite >= 75:
            trend = "improving"
        elif composite <= 45:
            trend = "declining"

        if health < 35 or hunger < 30:
            risk = "high"
        elif health < 55 or hunger < 45:
            risk = "medium"

        if hunger < 40:
            recommendations.append("Plan a hearty meal to restore stamina.")
        if energy < 40:
            recommendations.append("Encourage a rest or calm bonding activity.")
        if hygiene < 40:
            recommendations.append("Grooming or a bath will help comfort.")
        if not recommendations:
            recommendations.append("Maintain the current routine and monitor mood.")

        return {"trend": trend, "risk": risk, "recommended_actions": recommendations}
