"""Service layer handling pet state transitions and persistence."""
from __future__ import annotations

from typing import Any, Dict, Optional, Tuple

from asyncpg import Pool
from fastapi import HTTPException, status

from app.models import Pet, PetDiaryEntry, PetStats as DomainPetStats
from app.schemas import (
    EvolutionStage,
    PetAction,
    PetActionRequest,
    PetActionResponse,
    PetCreate,
    PetDiaryCreate,
    PetDiaryEntryResponse,
    PetResponse,
    PetStats,
    PetUpdate,
    SeasonalMoodPayload,
)
from app.services.pet_ai_service import PetAIService, ReactionResult
from app.services.seasonal_service import SeasonalReactionsService


class PetService:
    """Orchestrates pet CRUD, actions, and diary logging."""

    def __init__(
        self,
        pool: Optional[Pool],
        ai_service: Optional[PetAIService] = None,
        seasonal_service: Optional[SeasonalReactionsService] = None,
    ) -> None:
        self._pool = pool
        self._column_map: Optional[Dict[str, str]] = None
        self._ai_service = ai_service
        self._seasonal_service = seasonal_service

    async def _require_pool(self) -> Pool:
        if self._pool is None:
            raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Database connection is not configured.")
        return self._pool

    async def _ensure_infrastructure(self, connection) -> None:
        if self._column_map is None:
            await self._detect_columns(connection)
        await connection.execute(
            """
            CREATE TABLE IF NOT EXISTS pet_diary_entries (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
                user_id UUID NOT NULL,
                mood TEXT NOT NULL,
                note TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        await connection.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_pet_diary_pet_id
            ON pet_diary_entries(pet_id, created_at DESC)
            """
        )

    async def _detect_columns(self, connection) -> None:
        rows = await connection.fetch(
            """
            SELECT column_name
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'pets'
            """
        )
        available = {row["column_name"] for row in rows}

        def locate(*candidates: str, required: bool = True, default: Optional[str] = None) -> Optional[str]:
            for candidate in candidates:
                if candidate in available:
                    return candidate
            if required and default is None:
                raise HTTPException(
                    status.HTTP_500_INTERNAL_SERVER_ERROR,
                    f"Pets table missing required columns: one of {candidates}.",
                )
            return default

        self._column_map = {
            "hunger": locate("hunger"),
            "hygiene": locate("hygiene", "cleanliness"),
            "energy": locate("energy"),
            "mood": locate("mood", "happiness"),
            "health": locate("health"),
            "xp": locate("xp", "experience"),
            "level": locate("level"),
            "color": locate("color", "color_pattern", required=False),
        }

    async def get_pet(self, user_id: str) -> Optional[PetResponse]:
        pool = await self._require_pool()
        async with pool.acquire() as connection:
            await self._ensure_infrastructure(connection)
            columns = self._column_map
            assert columns is not None
            color_column = columns["color"]
            row = await connection.fetchrow(
                f"""
                SELECT
                    p.id,
                    p.user_id,
                    p.name,
                    p.species,
                    p.breed,
                    {f'p.{color_column}' if color_column else 'NULL'} AS color,
                    p.created_at,
                    p.updated_at,
                    p.{columns['hunger']} AS hunger,
                    p.{columns['hygiene']} AS hygiene,
                    p.{columns['energy']} AS energy,
                    p.{columns['mood']} AS mood_value,
                    p.{columns['health']} AS health,
                    p.{columns['xp']} AS xp,
                    p.{columns['level']} AS level
                FROM pets p
                WHERE p.user_id = $1
                """,
                user_id,
            )
            if row is None:
                return None

            diary_rows = await connection.fetch(
                """
                SELECT id, mood, note, created_at
                FROM pet_diary_entries
                WHERE user_id = $1 AND pet_id = $2
                ORDER BY created_at DESC
                LIMIT 20
                """,
                user_id,
                row["id"],
            )

        pet = self._row_to_domain(row, diary_rows)
        seasonal_state = await self._apply_seasonal_adjustments(user_id, pet)
        return self._domain_to_response(pet, seasonal_state)

    async def create_pet(self, user_id: str, payload: PetCreate) -> PetResponse:
        pool = await self._require_pool()
        async with pool.acquire() as connection:
            await self._ensure_infrastructure(connection)
            columns = self._column_map
            assert columns is not None
            color_column = columns["color"]
            insert_fields = ["user_id", "name", "species", "breed"]
            values = [user_id, payload.name, payload.species, payload.breed]
            placeholders = ["$1", "$2", "$3", "$4"]
            idx = 5
            if color_column:
                insert_fields.append(color_column)
                values.append(payload.color)
                placeholders.append(f"${idx}")
                idx += 1
            insert_fields.extend(
                [
                    columns["hunger"],
                    columns["hygiene"],
                    columns["energy"],
                    columns["mood"],
                    columns["health"],
                    columns["xp"],
                    columns["level"],
                ]
            )
            values.extend([75, 90, 80, self._mood_to_score("content"), 100, 0, 1])
            placeholders.extend([f"${i}" for i in range(idx, idx + 7)])

            conflict_updates = [
                "name = EXCLUDED.name",
                "species = EXCLUDED.species",
                "breed = EXCLUDED.breed",
            ]
            if color_column:
                conflict_updates.append(f"{color_column} = EXCLUDED.{color_column}")
            conflict_updates.append("updated_at = NOW()")

            row = await connection.fetchrow(
                f"""
                INSERT INTO pets ({', '.join(insert_fields)})
                VALUES ({', '.join(placeholders)})
                ON CONFLICT (user_id) DO UPDATE SET
                    {', '.join(conflict_updates)}
                RETURNING id
                """,
                *values,
            )
            pet_id = row["id"]

        pet = await self.get_pet(user_id)
        assert pet is not None
        await self.add_diary_entry(user_id, pet_id, PetDiaryCreate(mood="excited", note="Welcome to your new home!"))
        return await self.get_pet(user_id)  # type: ignore[return-value]

    async def update_pet(self, user_id: str, payload: PetUpdate) -> PetResponse:
        pool = await self._require_pool()
        updates: Dict[str, Any] = {}
        columns = self._column_map
        assert columns is not None
        if payload.name is not None:
            updates["name"] = payload.name
        if payload.species is not None:
            updates["species"] = payload.species
        if payload.breed is not None:
            updates["breed"] = payload.breed
        if payload.color is not None and columns["color"]:
            updates[columns["color"]] = payload.color
        if payload.hunger is not None:
            updates[columns["hunger"]] = self._clamp(payload.hunger)
        if payload.hygiene is not None:
            updates[columns["hygiene"]] = self._clamp(payload.hygiene)
        if payload.energy is not None:
            updates[columns["energy"]] = self._clamp(payload.energy)
        if payload.mood is not None:
            updates[columns["mood"]] = self._mood_to_score(payload.mood)

        if not updates:
            pet = await self.get_pet(user_id)
            if pet is None:
                raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found.")
            return pet

        set_parts = [f"{col} = ${idx}" for idx, col in enumerate(updates.keys(), start=2)]
        set_parts.append("updated_at = NOW()")
        pool = await self._require_pool()
        async with pool.acquire() as connection:
            await self._ensure_infrastructure(connection)
            await connection.execute(
                f"""
                UPDATE pets
                SET {', '.join(set_parts)}
                WHERE user_id = $1
                """,
                user_id,
                *updates.values(),
            )
        pet = await self.get_pet(user_id)
        if pet is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found.")
        return pet

    async def apply_action(
        self,
        user_id: str,
        action: PetAction,
        request: PetActionRequest,
    ) -> PetActionResponse:
        pet_response = await self.get_pet(user_id)
        if pet_response is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found.")
        pet = self._response_to_domain(pet_response)
        stats_before = pet.stats

        updated_pet, reaction, diary_entry = self._apply_action(pet, action, request)

        await self._persist_pet_state(user_id, updated_pet)
        reaction_result = await self._generate_ai_reaction(
            user_id=user_id,
            pet=updated_pet,
            action=action,
            request=request,
            stats_before=stats_before,
            stats_after=updated_pet.stats,
            base_reaction=reaction,
        )
        reaction_text = reaction_result.reaction
        ai_mood = reaction_result.mood
        if ai_mood is None and self._ai_service is not None and reaction_result.note:
            ai_mood = await self._ai_service.analyze_sentiment(reaction_result.note)

        final_mood = self._calculate_mood(updated_pet.stats, ai_mood)
        updated_pet.stats.mood = final_mood

        if diary_entry is None:
            if reaction_result.note or final_mood:
                diary_entry = PetDiaryCreate(mood=final_mood, note=reaction_result.note)
        else:
            diary_entry = PetDiaryCreate(
                mood=final_mood,
                note=reaction_result.note or diary_entry.note,
            )

        if diary_entry is not None:
            await self.add_diary_entry(user_id, updated_pet.id, diary_entry)

        refreshed = await self.get_pet(user_id)
        assert refreshed is not None
        refreshed.stats.mood = final_mood  # ensure response reflects calculated mood
        if refreshed.seasonal_state is not None:
            refreshed.seasonal_state.mood = final_mood
        return PetActionResponse(
            pet=refreshed,
            reaction=reaction_text,
            mood=final_mood,
            notifications=reaction_result.notifications,
            health_forecast=reaction_result.health_forecast
            or self._compute_health_forecast(updated_pet.stats),
        )

    async def get_diary(self, user_id: str) -> list[PetDiaryEntryResponse]:
        pet = await self.get_pet(user_id)
        if pet is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Pet not found.")
        return pet.diary

    async def add_diary_entry(
        self,
        user_id: str,
        pet_id: str,
        payload: PetDiaryCreate,
    ) -> PetDiaryEntryResponse:
        pool = await self._require_pool()
        async with pool.acquire() as connection:
            await self._ensure_infrastructure(connection)
            row = await connection.fetchrow(
                """
                INSERT INTO pet_diary_entries (pet_id, user_id, mood, note)
                VALUES ($1, $2, $3, $4)
                RETURNING id, mood, note, created_at
                """,
                pet_id,
                user_id,
                payload.mood,
                payload.note,
            )
        return PetDiaryEntryResponse(**dict(row))

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------
    def _apply_action(
        self,
        pet: Pet,
        action: PetAction,
        payload: PetActionRequest,
    ) -> tuple[Pet, str, Optional[PetDiaryCreate]]:
        stats = pet.stats
        hunger = stats.hunger
        hygiene = stats.hygiene
        energy = stats.energy
        health = stats.health
        xp = stats.xp
        level = stats.level
        mood = stats.mood
        note: Optional[str] = None
        reaction = ""

        if action is PetAction.feed:
            hunger = self._clamp(hunger + 25)
            energy = self._clamp(energy + 5)
            hygiene = self._clamp(hygiene - 5)
            health = self._clamp(health + 5)
            xp += 15
            reaction = "delighted munching"
            note = f"Enjoyed a {payload.food_type or 'meal'}."
        elif action is PetAction.play:
            hunger = self._clamp(hunger - 10)
            energy = self._clamp(energy - 15)
            hygiene = self._clamp(hygiene - 10)
            health = self._clamp(health + 3)
            xp += 20
            reaction = "joyful playtime"
            note = f"Played {payload.game_type or 'together'}."
        elif action is PetAction.bathe:
            hygiene = self._clamp(hygiene + 30)
            energy = self._clamp(energy - 5)
            health = self._clamp(health + 4)
            xp += 10
            reaction = "sparkling clean"
            note = "Took a refreshing bath."
        elif action is PetAction.rest:
            duration = payload.duration_hours or 1
            energy = self._clamp(energy + 10 * duration)
            hunger = self._clamp(hunger - 5 * duration)
            health = self._clamp(health + 2 * min(duration, 4))
            xp += 8
            reaction = "rested and relaxed"
            note = f"Slept for {duration} hour(s)."
        else:  # pragma: no cover - defensive
            reaction = "confused"

        xp, level = self._recalculate_level(xp, level)
        evolution_stage = self._determine_stage(level)
        mood = self._calculate_base_mood(hunger, hygiene, energy, health)
        is_sick = self._is_sick(hunger, hygiene, energy, health)
        if is_sick:
            health = self._clamp(health - 5)
            mood = "ill"
            note = note or "Feeling under the weather."

        updated_stats = DomainPetStats(
            hunger=hunger,
            hygiene=hygiene,
            energy=energy,
            mood=mood,
            health=health,
            xp=xp,
            level=level,
            evolution_stage=evolution_stage.value,
            is_sick=is_sick,
        )

        updated_pet = Pet(
            id=pet.id,
            user_id=pet.user_id,
            name=pet.name,
            species=pet.species,
            breed=pet.breed,
            color=pet.color,
            created_at=pet.created_at,
            updated_at=pet.updated_at,
            stats=updated_stats,
            diary=pet.diary,
        )

        diary_payload = PetDiaryCreate(mood=mood, note=note) if note else None
        return updated_pet, reaction, diary_payload

    async def _persist_pet_state(self, user_id: str, pet: Pet) -> None:
        pool = await self._require_pool()
        columns = self._column_map
        assert columns is not None
        updates = {
            columns["hunger"]: pet.stats.hunger,
            columns["hygiene"]: pet.stats.hygiene,
            columns["energy"]: pet.stats.energy,
            columns["mood"]: self._mood_to_score(pet.stats.mood),
            columns["health"]: pet.stats.health,
            columns["xp"]: pet.stats.xp,
            columns["level"]: pet.stats.level,
        }
        if columns["color"] and pet.color is not None:
            updates[columns["color"]] = pet.color

        set_parts = [f"{col} = ${idx}" for idx, col in enumerate(updates.keys(), start=2)]
        async with pool.acquire() as connection:
            await self._ensure_infrastructure(connection)
            await connection.execute(
                f"""
                UPDATE pets
                SET {', '.join(set_parts)}, updated_at = NOW()
                WHERE user_id = $1
                """,
                user_id,
                *updates.values(),
            )

    def _recalculate_level(self, xp: int, level: int) -> tuple[int, int]:
        current_level = level
        current_xp = xp
        threshold = current_level * 120
        while current_xp >= threshold:
            current_xp -= threshold
            current_level += 1
            threshold = current_level * 120
        return current_xp, current_level

    def _determine_stage(self, level: int) -> EvolutionStage:
        if level >= 12:
            return EvolutionStage.legendary
        if level >= 7:
            return EvolutionStage.adult
        if level >= 4:
            return EvolutionStage.juvenile
        return EvolutionStage.egg

    def _calculate_base_mood(self, hunger: int, hygiene: int, energy: int, health: int) -> str:
        average = (hunger + hygiene + energy + health) / 4
        if average >= 80:
            return "ecstatic"
        if average >= 60:
            return "happy"
        if average >= 40:
            return "content"
        if average >= 25:
            return "anxious"
        return "distressed"

    def _is_sick(self, hunger: int, hygiene: int, energy: int, health: int) -> bool:
        return any(value <= 20 for value in (hunger, hygiene, energy, health))

    def _derive_mood_from_score(self, score: Any) -> str:
        try:
            value = int(score)
        except (TypeError, ValueError):
            return "content"
        if value >= 90:
            return "ecstatic"
        if value >= 75:
            return "happy"
        if value >= 55:
            return "content"
        if value >= 35:
            return "anxious"
        return "distressed"

    def _mood_to_score(self, mood: str) -> int:
        mapping = {
            "ecstatic": 95,
            "happy": 80,
            "content": 65,
            "anxious": 40,
            "distressed": 20,
            "ill": 15,
        }
        return mapping.get(mood.lower(), 60)

    async def _generate_ai_reaction(
        self,
        user_id: str,
        pet: Pet,
        action: PetAction,
        request: PetActionRequest,
        stats_before: DomainPetStats,
        stats_after: DomainPetStats,
        base_reaction: str,
    ) -> ReactionResult:
        if self._ai_service is None:
            return ReactionResult(
                reaction=base_reaction,
                mood=None,
                notifications=[],
                note=None,
                health_forecast=self._compute_health_forecast(stats_after),
            )

        context = {
            "pet": {
                "name": pet.name,
                "species": pet.species,
                "evolution_stage": stats_after.evolution_stage,
            },
            "action": action.value,
            "request": request.model_dump(exclude_none=True),
            "before": stats_before.__dict__,
            "after": stats_after.__dict__,
            "base_reaction": base_reaction,
        }
        try:
            return await self._ai_service.generate_reaction(user_id, pet.id, context)
        except HTTPException:
            raise
        except Exception:
            return ReactionResult(
                reaction=base_reaction,
                mood=None,
                notifications=[],
                note=None,
                health_forecast=self._compute_health_forecast(stats_after),
            )

    def _calculate_mood(self, stats: DomainPetStats, suggested: Optional[str]) -> str:
        if suggested:
            return suggested
        return self._calculate_base_mood(stats.hunger, stats.hygiene, stats.energy, stats.health)

    def _compute_health_forecast(self, stats: DomainPetStats) -> Dict[str, Any]:
        average = (stats.health + stats.energy + stats.hygiene + stats.hunger) / 4
        trend = "steady"
        if average >= 75:
            trend = "improving"
        elif average <= 45:
            trend = "declining"
        risk = "low"
        if stats.health < 35 or stats.hunger < 30:
            risk = "high"
        elif stats.health < 50 or stats.hunger < 40:
            risk = "medium"
        recommendations = []
        if stats.hunger < 40:
            recommendations.append("Offer a balanced meal soon.")
        if stats.energy < 40:
            recommendations.append("Schedule a rest break to recover energy.")
        if stats.hygiene < 40:
            recommendations.append("Consider grooming or a bath to improve comfort.")
        if stats.health < 50:
            recommendations.append("Monitor for symptoms and consider a check-up.")
        if not recommendations:
            recommendations.append("Maintain the current care routine.")
        return {
            "trend": trend,
            "risk": risk,
            "recommended_actions": recommendations,
        }

    def _row_to_domain(self, row, diary_rows) -> Pet:
        stats = DomainPetStats(
            hunger=row["hunger"],
            hygiene=row["hygiene"],
            energy=row["energy"],
            mood=self._derive_mood_from_score(row["mood_value"]),
            health=row["health"],
            xp=row["xp"],
            level=row["level"],
            evolution_stage=self._determine_stage(row["level"]).value,
            is_sick=self._is_sick(row["hunger"], row["hygiene"], row["energy"], row["health"]),
        )
        diary = [
            PetDiaryEntry(
                id=str(entry["id"]),
                mood=entry["mood"],
                note=entry["note"],
                created_at=entry["created_at"],
            )
            for entry in diary_rows
        ]
        return Pet(
            id=str(row["id"]),
            user_id=str(row["user_id"]),
            name=row["name"],
            species=row["species"],
            breed=row["breed"],
            color=row["color"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            stats=stats,
            diary=diary,
        )

    def _domain_to_response(self, pet: Pet, seasonal_state: Optional[SeasonalMoodPayload] = None) -> PetResponse:
        diary = [
            PetDiaryEntryResponse(id=entry.id, mood=entry.mood, note=entry.note, created_at=entry.created_at)
            for entry in pet.diary
        ]
        stats = PetStats(**pet.stats.__dict__)
        return PetResponse(
            id=pet.id,
            user_id=pet.user_id,
            name=pet.name,
            species=pet.species,
            breed=pet.breed,
            color=pet.color,
            created_at=pet.created_at,
            updated_at=pet.updated_at,
            stats=stats,
            diary=diary,
            seasonal_state=seasonal_state,
        )

    def _response_to_domain(self, response: PetResponse) -> Pet:
        stats = DomainPetStats(
            hunger=response.stats.hunger,
            hygiene=response.stats.hygiene,
            energy=response.stats.energy,
            mood=response.stats.mood,
            health=response.stats.health,
            xp=response.stats.xp,
            level=response.stats.level,
            evolution_stage=response.stats.evolution_stage.value
            if isinstance(response.stats.evolution_stage, EvolutionStage)
            else response.stats.evolution_stage,
            is_sick=response.stats.is_sick,
        )
        diary = [
            PetDiaryEntry(id=entry.id, mood=entry.mood, note=entry.note, created_at=entry.created_at)
            for entry in response.diary
        ]
        return Pet(
            id=response.id,
            user_id=response.user_id,
            name=response.name,
            species=response.species,
            breed=response.breed,
            color=response.color,
            created_at=response.created_at,
            updated_at=response.updated_at,
            stats=stats,
            diary=diary,
        )

    @staticmethod
    def _clamp(value: int, minimum: int = 0, maximum: int = 100) -> int:
        return max(minimum, min(maximum, value))

    async def _apply_seasonal_adjustments(self, user_id: str, pet: Pet) -> Optional[SeasonalMoodPayload]:
        if self._seasonal_service is None:
            return None
        try:
            stats, payload = await self._seasonal_service.gather_mood_context(user_id=user_id, pet=pet)
        except HTTPException:
            raise
        except Exception:
            return None
        pet.stats = stats
        return payload
