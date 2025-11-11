"""Service handling AI-driven pet art generation with caching."""
from __future__ import annotations

import base64
import json
from dataclasses import asdict
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Dict, Optional, Sequence, Tuple

import httpx
from asyncpg import Pool
from fastapi import HTTPException, status

from app.core.config import get_settings
from app.models import PetArtCacheEntry


class PetArtService:
    """Generates and caches AI pet art using OpenAI's image API or graceful fallbacks."""

    def __init__(self, pool: Optional[Pool], client: Optional[httpx.AsyncClient] = None) -> None:
        self._pool = pool
        self._client = client
        self._memory_cache: Dict[str, PetArtCacheEntry] = {}

    async def generate_pet_art(
        self,
        *,
        user_id: str,
        pet_id: str,
        mood: Optional[str],
        accessories: Sequence[Dict[str, str]],
        style: Optional[str],
        base_prompt: str,
        force_refresh: bool = False,
    ) -> Tuple[PetArtCacheEntry, bool]:
        """Generate art or return cached result. Returns (entry, cached?)."""
        palette = self._build_palette(accessories)
        prompt = self._build_prompt(base_prompt, mood, accessories, style)
        prompt_hash = self._hash_prompt(user_id, pet_id, prompt, style, accessories)
        now = datetime.now(timezone.utc)
        ttl = timedelta(hours=self._get_cache_ttl_hours())

        if not force_refresh:
            cached = await self._load_cache(user_id, pet_id, prompt_hash, now)
            if cached:
                return cached, True

        image_data = await self._invoke_provider(prompt, style, palette)
        entry = PetArtCacheEntry(
            user_id=user_id,
            pet_id=pet_id,
            prompt_hash=prompt_hash,
            prompt=prompt,
            style=style,
            mood=mood,
            accessory_ids=[acc["accessory_id"] for acc in accessories],
            image_base64=image_data,
            metadata={"palette": palette},
            created_at=now,
            expires_at=now + ttl,
        )
        await self._persist_cache(entry)
        return entry, False

    def _build_palette(self, accessories: Sequence[Dict[str, str]]) -> Dict[str, str]:
        palette: Dict[str, str] = {}
        for accessory in accessories:
            for mood, color in accessory.get("color_palette", {}).items():
                palette.setdefault(mood, color)
        return palette

    def _build_prompt(
        self,
        base_prompt: str,
        mood: Optional[str],
        accessories: Sequence[Dict[str, str]],
        style: Optional[str],
    ) -> str:
        accessory_descriptions = ", ".join(
            f"{acc['name']} {acc['type']}" for acc in accessories if acc.get("name") and acc.get("type")
        )
        mood_text = f"Pet mood: {mood}." if mood else "Pet mood: balanced."
        style_text = f"Render in {style} style." if style else "Render in a vibrant, friendly illustration style."
        accessory_text = (
            f"The pet is wearing accessories: {accessory_descriptions} with harmonious colors." if accessory_descriptions else ""
        )
        return f"{base_prompt}. {mood_text} {style_text} {accessory_text}".strip()

    async def _load_cache(
        self,
        user_id: str,
        pet_id: str,
        prompt_hash: str,
        now: datetime,
    ) -> Optional[PetArtCacheEntry]:
        cache_key = self._memory_key(user_id, pet_id, prompt_hash)
        entry = self._memory_cache.get(cache_key)
        if entry and entry.expires_at > now:
            return entry

        if self._pool is None:
            return None

        async with self._pool.acquire() as connection:
            await self._ensure_table(connection)
            row = await connection.fetchrow(
                """
                SELECT user_id,
                       pet_id,
                       prompt_hash,
                       prompt,
                       style,
                       mood,
                       accessory_ids,
                       image_base64,
                       metadata,
                       created_at,
                       expires_at
                FROM pet_art_cache
                WHERE user_id = $1 AND pet_id = $2 AND prompt_hash = $3 AND expires_at > NOW()
                """,
                user_id,
                pet_id,
                prompt_hash,
            )
        if row is None:
            return None
        entry = self._row_to_entry(row)
        self._memory_cache[cache_key] = entry
        return entry

    async def _persist_cache(self, entry: PetArtCacheEntry) -> None:
        cache_key = self._memory_key(entry.user_id, entry.pet_id, entry.prompt_hash)
        self._memory_cache[cache_key] = entry
        if self._pool is None:
            return

        async with self._pool.acquire() as connection:
            await self._ensure_table(connection)
            await connection.execute(
                """
                INSERT INTO pet_art_cache (
                    user_id,
                    pet_id,
                    prompt_hash,
                    prompt,
                    style,
                    mood,
                    accessory_ids,
                    image_base64,
                    metadata,
                    created_at,
                    expires_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10, $11)
                ON CONFLICT (user_id, pet_id, prompt_hash)
                DO UPDATE SET
                    prompt = EXCLUDED.prompt,
                    style = EXCLUDED.style,
                    mood = EXCLUDED.mood,
                    accessory_ids = EXCLUDED.accessory_ids,
                    image_base64 = EXCLUDED.image_base64,
                    metadata = EXCLUDED.metadata,
                    created_at = EXCLUDED.created_at,
                    expires_at = EXCLUDED.expires_at
                """,
                entry.user_id,
                entry.pet_id,
                entry.prompt_hash,
                entry.prompt,
                entry.style,
                entry.mood,
                entry.accessory_ids,
                entry.image_base64,
                json.dumps(entry.metadata),
                entry.created_at,
                entry.expires_at,
            )

    async def _invoke_provider(
        self,
        prompt: str,
        style: Optional[str],
        palette: Dict[str, str],
    ) -> str:
        settings = get_settings()
        if not settings.openai_api_key:
            return self._placeholder_svg(prompt, palette)

        payload = {
            "model": settings.openai_image_model,
            "prompt": prompt,
            "size": "512x512",
            "n": 1,
            "response_format": "b64_json",
        }
        headers = {
            "Authorization": f"Bearer {settings.openai_api_key}",
            "Content-Type": "application/json",
        }

        client = self._client or httpx.AsyncClient()
        close_client = self._client is None
        try:
            response = await client.post(settings.openai_image_api, json=payload, headers=headers, timeout=45.0)
        finally:
            if close_client:
                await client.aclose()

        if response.status_code >= 400:
            return self._placeholder_svg(prompt, palette)

        try:
            data = response.json()
            image_b64 = data["data"][0]["b64_json"]
            return f"data:image/png;base64,{image_b64}"
        except Exception as exc:  # pragma: no cover - defensive fallback
            raise HTTPException(status.HTTP_502_BAD_GATEWAY, "Failed to parse AI image response.") from exc

    def _placeholder_svg(self, prompt: str, palette: Dict[str, str]) -> str:
        dominant = palette.get("happy") or next(iter(palette.values()), "#6366f1")
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
<defs>
<linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
<stop offset="0%" stop-color="{dominant}" />
<stop offset="100%" stop-color="#f9a8d4" />
</linearGradient>
</defs>
<rect width="512" height="512" fill="url(#grad)" />
<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="28" fill="#ffffff" font-family="Arial">
{prompt[:120]}
</text>
</svg>"""
        encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
        return f"data:image/svg+xml;base64,{encoded}"

    async def _ensure_table(self, connection) -> None:
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS pet_art_cache (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                pet_id UUID NOT NULL,
                prompt_hash TEXT NOT NULL,
                prompt TEXT NOT NULL,
                style TEXT,
                mood TEXT,
                accessory_ids UUID[] NOT NULL DEFAULT '{}',
                image_base64 TEXT NOT NULL,
                metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                expires_at TIMESTAMPTZ NOT NULL,
                UNIQUE(user_id, pet_id, prompt_hash)
            )
            """
        )

    @staticmethod
    def _memory_key(user_id: str, pet_id: str, prompt_hash: str) -> str:
        return f"{user_id}:{pet_id}:{prompt_hash}"

    def _hash_prompt(
        self,
        user_id: str,
        pet_id: str,
        prompt: str,
        style: Optional[str],
        accessories: Sequence[Dict[str, str]],
    ) -> str:
        sorted_accessories = sorted(accessories, key=lambda item: item.get("accessory_id", ""))
        payload = json.dumps(
            {
                "user_id": user_id,
                "pet_id": pet_id,
                "prompt": prompt,
                "style": style,
                "accessories": sorted_accessories,
            },
            sort_keys=True,
        )
        return sha256(payload.encode("utf-8")).hexdigest()

    def _row_to_entry(self, row) -> PetArtCacheEntry:
        metadata = row["metadata"]
        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        return PetArtCacheEntry(
            user_id=str(row["user_id"]),
            pet_id=str(row["pet_id"]),
            prompt_hash=row["prompt_hash"],
            prompt=row["prompt"],
            style=row["style"],
            mood=row["mood"],
            accessory_ids=[str(value) for value in (row["accessory_ids"] or [])],
            image_base64=row["image_base64"],
            metadata=metadata or {},
            created_at=row["created_at"],
            expires_at=row["expires_at"],
        )

    @staticmethod
    def _get_cache_ttl_hours() -> int:
        settings = get_settings()
        return getattr(settings, "art_cache_ttl_hours", 12)


def serialize_art_entry(entry: PetArtCacheEntry) -> Dict[str, object]:
    """Convert a cache entry to a JSON serialisable dictionary."""
    payload = asdict(entry)
    payload["created_at"] = entry.created_at.isoformat()
    payload["expires_at"] = entry.expires_at.isoformat()
    return payload

