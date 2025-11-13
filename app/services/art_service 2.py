"""
AI-driven pet art generation with SQLAlchemy-backed caching.
"""

from __future__ import annotations

import base64
import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from hashlib import sha256
from typing import Any, Dict, List, Optional, Sequence, Tuple
from uuid import UUID

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.pet_art import PetArtCache


@dataclass(slots=True)
class PetArtResult:
    user_id: str
    pet_id: str
    prompt_hash: str
    prompt: str
    style: Optional[str]
    mood: Optional[str]
    accessory_ids: List[str]
    image_base64: str
    metadata: Dict[str, Any]
    created_at: datetime
    expires_at: datetime


class PetArtService:
    def __init__(self) -> None:
        self._memory_cache: Dict[str, PetArtResult] = {}

    async def generate_pet_art(
        self,
        session: AsyncSession,
        *,
        user_id: UUID | str,
        pet_id: UUID | str,
        mood: Optional[str],
        accessories: Sequence[Dict[str, Any]],
        style: Optional[str],
        base_prompt: str,
        force_refresh: bool = False,
    ) -> Tuple[PetArtResult, bool]:
        palette = self._build_palette(accessories)
        prompt = self._build_prompt(base_prompt, mood, accessories, style)
        prompt_hash = self._hash_prompt(user_id, pet_id, prompt, style, accessories)
        now = datetime.now(timezone.utc)
        ttl = timedelta(hours=self._get_cache_ttl_hours())

        if not force_refresh:
            cached = await self._load_cache(session, user_id, pet_id, prompt_hash, now)
            if cached:
                return cached, True

        image_data = await self._invoke_provider(prompt, style, palette)
        result = PetArtResult(
            user_id=str(user_id),
            pet_id=str(pet_id),
            prompt_hash=prompt_hash,
            prompt=prompt,
            style=style,
            mood=mood,
            accessory_ids=[str(acc.get("accessory_id", "")) for acc in accessories],
            image_base64=image_data,
            metadata={"palette": palette},
            created_at=now,
            expires_at=now + ttl,
        )
        await self._persist_cache(session, result)
        return result, False

    def _build_palette(self, accessories: Sequence[Dict[str, Any]]) -> Dict[str, str]:
        palette: Dict[str, str] = {}
        for accessory in accessories:
            for mood, color in accessory.get("color_palette", {}).items():
                palette.setdefault(mood, color)
        return palette

    def _build_prompt(
        self,
        base_prompt: str,
        mood: Optional[str],
        accessories: Sequence[Dict[str, Any]],
        style: Optional[str],
    ) -> str:
        descriptions = [
            f"{acc.get('name', 'accessory')} {acc.get('type', '')}".strip()
            for acc in accessories
            if acc
        ]
        accessory_text = (
            f"The pet is wearing: {', '.join(descriptions)}."
            if descriptions
            else ""
        )
        mood_text = f"Pet mood: {mood}." if mood else "Pet mood: balanced."
        style_text = f"Render in {style} style." if style else "Render in a vibrant, friendly illustration style."
        return " ".join(filter(None, (base_prompt, mood_text, style_text, accessory_text)))

    async def _load_cache(
        self,
        session: AsyncSession,
        user_id: UUID | str,
        pet_id: UUID | str,
        prompt_hash: str,
        now: datetime,
    ) -> Optional[PetArtResult]:
        cache_key = self._memory_key(user_id, pet_id, prompt_hash)
        entry = self._memory_cache.get(cache_key)
        if entry and entry.expires_at > now:
            return entry

        stmt = (
            select(PetArtCache)
            .where(
                PetArtCache.user_id == UUID(str(user_id)),
                PetArtCache.pet_id == UUID(str(pet_id)),
                PetArtCache.prompt_hash == prompt_hash,
                PetArtCache.expires_at > now,
            )
            .limit(1)
        )
        result = await session.execute(stmt)
        record = result.scalar_one_or_none()
        if record is None:
            return None

        entry = PetArtResult(
            user_id=str(record.user_id),
            pet_id=str(record.pet_id),
            prompt_hash=record.prompt_hash,
            prompt=record.prompt,
            style=record.style,
            mood=record.mood,
            accessory_ids=[str(item) for item in (record.accessory_ids or [])],
            image_base64=record.image_base64,
            metadata=record.metadata_json or {},
            created_at=record.created_at,
            expires_at=record.expires_at,
        )
        self._memory_cache[cache_key] = entry
        return entry

    async def _persist_cache(self, session: AsyncSession, entry: PetArtResult) -> None:
        cache_key = self._memory_key(entry.user_id, entry.pet_id, entry.prompt_hash)
        self._memory_cache[cache_key] = entry

        stmt = select(PetArtCache).where(
            PetArtCache.user_id == UUID(entry.user_id),
            PetArtCache.pet_id == UUID(entry.pet_id),
            PetArtCache.prompt_hash == entry.prompt_hash,
        )
        result = await session.execute(stmt)
        record = result.scalar_one_or_none()
        if record is None:
            record = PetArtCache(
                user_id=UUID(entry.user_id),
                pet_id=UUID(entry.pet_id),
                prompt_hash=entry.prompt_hash,
            )
            session.add(record)

        record.prompt = entry.prompt
        record.style = entry.style
        record.mood = entry.mood
        record.accessory_ids = [UUID(value) for value in entry.accessory_ids if value]
        record.image_base64 = entry.image_base64
        record.metadata_json = entry.metadata
        record.expires_at = entry.expires_at
        await session.flush()

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

        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.post(str(settings.openai_image_api), json=payload, headers=headers)

        if response.status_code >= 400:
            return self._placeholder_svg(prompt, palette)

        try:
            data = response.json()
            image_b64 = data["data"][0]["b64_json"]
            return f"data:image/png;base64,{image_b64}"
        except Exception:  # pragma: no cover - defensive
            return self._placeholder_svg(prompt, palette)

    @staticmethod
    def _placeholder_svg(prompt: str, palette: Dict[str, str]) -> str:
        dominant = palette.get("happy") or next(iter(palette.values()), "#6366f1")
        svg = f"""<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
<defs>
<linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
<stop offset="0%" stop-color="{dominant}" />
<stop offset="100%" stop-color="#f9a8d4" />
</linearGradient>
</defs>
<rect width="512" height="512" fill="url(#grad)" />
<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="#ffffff" font-family="Arial">
{prompt[:90]}
</text>
</svg>"""
        encoded = base64.b64encode(svg.encode("utf-8")).decode("ascii")
        return f"data:image/svg+xml;base64,{encoded}"

    @staticmethod
    def _memory_key(user_id: UUID | str, pet_id: UUID | str, prompt_hash: str) -> str:
        return f"{user_id}:{pet_id}:{prompt_hash}"

    def _hash_prompt(
        self,
        user_id: UUID | str,
        pet_id: UUID | str,
        prompt: str,
        style: Optional[str],
        accessories: Sequence[Dict[str, Any]],
    ) -> str:
        sorted_accessories = sorted(accessories, key=lambda item: str(item.get("accessory_id", "")))
        payload = json.dumps(
            {
                "user_id": str(user_id),
                "pet_id": str(pet_id),
                "prompt": prompt,
                "style": style,
                "accessories": sorted_accessories,
            },
            sort_keys=True,
        )
        return sha256(payload.encode("utf-8")).hexdigest()

    @staticmethod
    def _get_cache_ttl_hours() -> int:
        settings = get_settings()
        return getattr(settings, "art_cache_ttl_hours", 12)


pet_art_service = PetArtService()


