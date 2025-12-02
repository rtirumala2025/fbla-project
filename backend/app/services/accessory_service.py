"""Service for managing accessories and customization state."""
from __future__ import annotations

import json
from dataclasses import asdict
from datetime import datetime, timezone
from hashlib import sha256
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

from asyncpg import Pool
from fastapi import HTTPException, status

from app.models import Accessory, EquippedAccessory

DEFAULT_ACCESSORIES: Tuple[Accessory, ...] = (
    Accessory(
        accessory_id="11111111-1111-1111-1111-111111111111",
        name="Stargazer Cap",
        type="hat",
        rarity="rare",
        effects={"sparkle": 5, "xpBoost": 0.05},
        color_palette={
            "ecstatic": "#facc15",
            "happy": "#fde047",
            "content": "#a3e635",
            "anxious": "#f97316",
            "distressed": "#ef4444",
        },
        preview_url="https://assets.virtualpet.app/accessories/stargazer-cap.png",
    ),
    Accessory(
        accessory_id="22222222-2222-2222-2222-222222222222",
        name="Aurora Collar",
        type="collar",
        rarity="epic",
        effects={"glow": 3, "moodAura": True},
        color_palette={
            "ecstatic": "#38bdf8",
            "happy": "#22d3ee",
            "content": "#34d399",
            "anxious": "#f97316",
            "distressed": "#f87171",
        },
        preview_url="https://assets.virtualpet.app/accessories/aurora-collar.png",
    ),
    Accessory(
        accessory_id="33333333-3333-3333-3333-333333333333",
        name="Comet Trail Cloak",
        type="outfit",
        rarity="legendary",
        effects={"trail": "stardust", "defense": 8},
        color_palette={
            "ecstatic": "#c084fc",
            "happy": "#a855f7",
            "content": "#6366f1",
            "anxious": "#f97316",
            "distressed": "#ef4444",
        },
        preview_url="https://assets.virtualpet.app/accessories/comet-trail-cloak.png",
    ),
)


class AccessoryService:
    """Encapsulates accessory catalog and equipment persistence."""

    def __init__(self, pool: Optional[Pool]) -> None:
        self._pool = pool
        self._memory_accessories: Dict[str, Accessory] = {acc.accessory_id: acc for acc in DEFAULT_ACCESSORIES}
        self._memory_equipped: Dict[str, EquippedAccessory] = {}

    async def list_accessories(self) -> List[Accessory]:
        """Return the accessory catalog."""
        if self._pool is None:
            return list(self._memory_accessories.values())

        async with self._pool.acquire() as connection:
            await self._ensure_tables(connection)
            rows = await connection.fetch(
                """
                SELECT accessory_id,
                       name,
                       type,
                       rarity,
                       effects,
                       color_palette,
                       preview_url,
                       created_at,
                       updated_at
                FROM accessories
                ORDER BY rarity, name
                """
            )

        return [self._row_to_accessory(row) for row in rows]

    async def get_accessories_by_ids(self, accessory_ids: Sequence[str]) -> List[Accessory]:
        """Return accessories matching the provided identifiers."""
        if not accessory_ids:
            return []
        if self._pool is None:
            return [acc for acc_id, acc in self._memory_accessories.items() if acc_id in accessory_ids]

        async with self._pool.acquire() as connection:
            await self._ensure_tables(connection)
            rows = await connection.fetch(
                """
                SELECT accessory_id,
                       name,
                       type,
                       rarity,
                       effects,
                       color_palette,
                       preview_url,
                       created_at,
                       updated_at
                FROM accessories
                WHERE accessory_id = ANY($1::uuid[])
                """,
                accessory_ids,
            )
        return [self._row_to_accessory(row) for row in rows]

    async def equip_accessory(
        self,
        *,
        user_id: str,
        pet_id: Optional[str],
        accessory_id: str,
        mood: Optional[str],
    ) -> EquippedAccessory:
        """Equip an accessory for the user/pet, applying mood-derived colors."""
        accessory = await self._get_accessory(accessory_id)
        if accessory is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Accessory not found.")

        derived_color = self._derive_color_from_mood(accessory, mood)
        equipped_slot = accessory.type
        timestamp = datetime.now(timezone.utc)

        if self._pool is None:
            key = self._memory_key(user_id, pet_id, accessory_id)
            # Unequip any previous accessory occupying the same slot.
            for existing_key, equipped in list(self._memory_equipped.items()):
                if (
                    equipped.user_id == user_id
                    and equipped.pet_id == pet_id
                    and equipped.equipped
                    and self._find_accessory(equipped.accessory_id).type == accessory.type
                ):
                    self._memory_equipped[existing_key] = EquippedAccessory(
                        user_id=equipped.user_id,
                        pet_id=equipped.pet_id,
                        accessory_id=equipped.accessory_id,
                        equipped=False,
                        equipped_color=equipped.equipped_color,
                        equipped_slot=equipped.equipped_slot,
                        updated_at=timestamp,
                    )
            self._memory_equipped[key] = EquippedAccessory(
                user_id=user_id,
                pet_id=pet_id,
                accessory_id=accessory_id,
                equipped=True,
                equipped_color=derived_color,
                equipped_slot=equipped_slot,
                updated_at=timestamp,
            )
            return self._memory_equipped[key]

        async with self._pool.acquire() as connection:
            await self._ensure_tables(connection)
            async with connection.transaction():
                if pet_id:
                    await connection.execute(
                        """
                        UPDATE user_accessories
                        SET equipped = FALSE, updated_at = NOW()
                        WHERE user_id = $1 AND pet_id = $2 AND equipped_slot = $3
                        """,
                        user_id,
                        pet_id,
                        equipped_slot,
                    )
                row = await connection.fetchrow(
                    """
                    INSERT INTO user_accessories (user_id, pet_id, accessory_id, equipped, equipped_color, equipped_slot)
                    VALUES ($1, $2, $3, TRUE, $4, $5)
                    ON CONFLICT (user_id, pet_id, accessory_id)
                    DO UPDATE
                    SET equipped = TRUE,
                        equipped_color = EXCLUDED.equipped_color,
                        equipped_slot = EXCLUDED.equipped_slot,
                        updated_at = NOW()
                    RETURNING user_id,
                              pet_id,
                              accessory_id,
                              equipped,
                              equipped_color,
                              equipped_slot,
                              updated_at
                    """,
                    user_id,
                    pet_id,
                    accessory_id,
                    derived_color,
                    equipped_slot,
                )

        assert row is not None  # nosec - defensive
        return self._row_to_equipped(row)

    async def unequip_accessory(
        self,
        *,
        user_id: str,
        pet_id: Optional[str],
        accessory_id: str,
    ) -> EquippedAccessory:
        """Unequip the specified accessory for the user/pet."""
        timestamp = datetime.now(timezone.utc)
        if self._pool is None:
            key = self._memory_key(user_id, pet_id, accessory_id)
            equipped = self._memory_equipped.get(key)
            if equipped is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Accessory not equipped.")
            updated = EquippedAccessory(
                user_id=equipped.user_id,
                pet_id=equipped.pet_id,
                accessory_id=equipped.accessory_id,
                equipped=False,
                equipped_color=equipped.equipped_color,
                equipped_slot=equipped.equipped_slot,
                updated_at=timestamp,
            )
            self._memory_equipped[key] = updated
            return updated

        async with self._pool.acquire() as connection:
            await self._ensure_tables(connection)
            row = await connection.fetchrow(
                """
                UPDATE user_accessories
                SET equipped = FALSE, updated_at = NOW()
                WHERE user_id = $1
                  AND accessory_id = $2
                  AND ($3::uuid IS NULL OR pet_id = $3::uuid)
                RETURNING user_id,
                          pet_id,
                          accessory_id,
                          equipped,
                          equipped_color,
                          equipped_slot,
                          updated_at
                """,
                user_id,
                accessory_id,
                pet_id,
            )
        if row is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Accessory not equipped.")
        return self._row_to_equipped(row)

    async def get_equipped(
        self,
        *,
        user_id: str,
        pet_id: Optional[str] = None,
    ) -> List[EquippedAccessory]:
        """Return accessories currently equipped for the user (optionally scoped to pet)."""
        if self._pool is None:
            return [
                equipped
                for equipped in self._memory_equipped.values()
                if equipped.user_id == user_id and (pet_id is None or equipped.pet_id == pet_id)
            ]

        async with self._pool.acquire() as connection:
            await self._ensure_tables(connection)
            rows = await connection.fetch(
                """
                SELECT user_id,
                       pet_id,
                       accessory_id,
                       equipped,
                       equipped_color,
                       equipped_slot,
                       updated_at
                FROM user_accessories
                WHERE user_id = $1
                  AND ($2::uuid IS NULL OR pet_id = $2::uuid)
                """,
                user_id,
                pet_id,
            )
        return [self._row_to_equipped(row) for row in rows]

    async def _get_accessory(self, accessory_id: str) -> Optional[Accessory]:
        if self._pool is None:
            return self._memory_accessories.get(accessory_id)

        async with self._pool.acquire() as connection:
            await self._ensure_tables(connection)
            row = await connection.fetchrow(
                """
                SELECT accessory_id,
                       name,
                       type,
                       rarity,
                       effects,
                       color_palette,
                       preview_url,
                       created_at,
                       updated_at
                FROM accessories
                WHERE accessory_id = $1
                """,
                accessory_id,
            )
        if row is None:
            return None
        return self._row_to_accessory(row)

    async def _ensure_tables(self, connection) -> None:
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS accessories (
                accessory_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                rarity TEXT NOT NULL DEFAULT 'common',
                effects JSONB NOT NULL DEFAULT '{}'::jsonb,
                color_palette JSONB NOT NULL DEFAULT '{}'::jsonb,
                preview_url TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS user_accessories (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                pet_id UUID,
                accessory_id UUID NOT NULL,
                equipped BOOLEAN NOT NULL DEFAULT FALSE,
                equipped_color TEXT,
                equipped_slot TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(user_id, pet_id, accessory_id)
            )
            """
        )

    def _derive_color_from_mood(self, accessory: Accessory, mood: Optional[str]) -> Optional[str]:
        if not mood:
            return accessory.color_palette.get("content")
        mood_key = mood.lower()
        if mood_key in accessory.color_palette:
            return accessory.color_palette[mood_key]
        # Fallback: deterministic selection using hash to keep colors consistent.
        if accessory.color_palette:
            palette_items = sorted(accessory.color_palette.items())
            index = int(sha256(mood_key.encode("utf-8")).hexdigest(), 16) % len(palette_items)
            return palette_items[index][1]
        return None

    def _find_accessory(self, accessory_id: str) -> Accessory:
        accessory = self._memory_accessories.get(accessory_id)
        if accessory is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Accessory not found.")
        return accessory

    @staticmethod
    def _memory_key(user_id: str, pet_id: Optional[str], accessory_id: str) -> str:
        return f"{user_id}:{pet_id or 'global'}:{accessory_id}"

    @staticmethod
    def _decode_json_field(value) -> Dict[str, object]:
        if isinstance(value, dict):
            return value
        if value is None:
            return {}
        if isinstance(value, str):
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return {}
        return dict(value)

    def _row_to_accessory(self, row) -> Accessory:
        color_palette_raw = self._decode_json_field(row["color_palette"])
        color_palette: Dict[str, str] = {}
        if isinstance(color_palette_raw, dict):
            color_palette = {k: str(v) for k, v in color_palette_raw.items()}
        return Accessory(
            accessory_id=str(row["accessory_id"]),
            name=row["name"],
            type=row["type"],
            rarity=row["rarity"],
            effects=self._decode_json_field(row["effects"]),
            color_palette=color_palette,
            preview_url=row["preview_url"],
            created_at=row.get("created_at"),
            updated_at=row.get("updated_at"),
        )

    @staticmethod
    def _row_to_equipped(row) -> EquippedAccessory:
        return EquippedAccessory(
            user_id=str(row["user_id"]),
            pet_id=str(row["pet_id"]) if row["pet_id"] is not None else None,
            accessory_id=str(row["accessory_id"]),
            equipped=row["equipped"],
            equipped_color=row["equipped_color"],
            equipped_slot=row["equipped_slot"],
            updated_at=row["updated_at"],
        )


def serialize_equipped(equipped: EquippedAccessory) -> Dict[str, object]:
    """Utility for converting equipped accessories to JSON-safe payloads."""
    payload = asdict(equipped)
    payload["updated_at"] = payload["updated_at"].isoformat()
    return payload

