"""Combine seasonal events and weather into pet mood adjustments."""
from __future__ import annotations

from dataclasses import replace
from datetime import date
from typing import Dict, List, Optional, Tuple

from fastapi import HTTPException, status

from app.models import Event, EventEffect, Pet, PetStats as DomainPetStats, WeatherSnapshot
from app.schemas import SeasonalMoodPayload
from app.services.event_service import EventService
from app.services.weather_service import WeatherService


class SeasonalReactionsService:
    """Merge seasonal events and weather to produce reactive pet moods."""

    _WEATHER_MOODS: Dict[str, Tuple[str, Dict[str, int], Dict[str, str]]] = {
        "Thunderstorm": ("anxious", {"energy": -10, "hygiene": -5}, {"weather": "storm"}),
        "Drizzle": ("content", {"hygiene": -3}, {"weather": "drizzle"}),
        "Rain": ("cozy", {"energy": +5, "hygiene": -4}, {"weather": "rain"}),
        "Snow": ("excited", {"energy": +8}, {"weather": "snow"}),
        "Clear": ("happy", {"energy": +4}, {"weather": "sunny"}),
        "Clouds": ("content", {"energy": +2}, {"weather": "cloudy"}),
        "Mist": ("curious", {"hygiene": -2}, {"weather": "mist"}),
        "Fog": ("calm", {"energy": -2}, {"weather": "fog"}),
    }

    def __init__(self, event_service: EventService, weather_service: WeatherService) -> None:
        self._event_service = event_service
        self._weather_service = weather_service

    async def gather_mood_context(
        self,
        *,
        user_id: str,
        pet: Pet,
        lat: Optional[float] = None,
        lon: Optional[float] = None,
    ) -> Tuple[DomainPetStats, SeasonalMoodPayload]:
        """Collect events and weather, returning adjusted stats and payload."""
        current_events, _ = await self._event_service.list_events(today=date.today())
        participation = await self._event_service.get_participation_map(user_id, (event.event_id for event in current_events))
        overlays: Dict[str, str] = {}
        stat_modifiers: Dict[str, int] = {}
        active_event_ids: List[str] = []
        participation_override: Optional[str] = None
        event_mood: Optional[str] = None

        stats = replace(pet.stats)

        for event in current_events:
            active_event_ids.append(event.event_id)
            await self._event_service.ensure_participation(user_id, event)
            self._apply_effect(event.effects, stats, stat_modifiers, overlays)
            if event.effects.mood:
                event_mood = event_mood or event.effects.mood
            participation_record = participation.get(event.event_id)
            if participation_record and participation_record.status == "completed":
                participation_override = participation_override or "proud"

        weather_snapshot = await self._weather_service.get_weather(user_id=user_id, lat=lat, lon=lon)
        weather_mood, weather_modifiers, weather_overlay = self._derive_weather_effect(weather_snapshot)
        self._apply_stat_changes(stats, weather_modifiers)
        self._merge_modifiers(stat_modifiers, weather_modifiers)
        overlays.update(weather_overlay)

        final_mood = self._resolve_mood(
            base_mood=stats.mood,
            event_mood=participation_override or event_mood,
            weather_mood=weather_mood,
            stats=stats,
        )
        stats.mood = final_mood

        payload = SeasonalMoodPayload(
            mood=final_mood,
            stat_modifiers=stat_modifiers,
            overlays=overlays,
            active_events=active_event_ids,
            weather_condition=weather_snapshot.condition,
        )
        return stats, payload

    def _apply_effect(
        self,
        effect: EventEffect,
        stats: DomainPetStats,
        cumulative_modifiers: Dict[str, int],
        overlays: Dict[str, str],
    ) -> None:
        self._apply_stat_changes(stats, effect.stat_modifiers)
        self._merge_modifiers(cumulative_modifiers, effect.stat_modifiers)
        overlays.update({f"event_{key}": value for key, value in effect.visual_overlays.items()})
        if effect.mood:
            stats.mood = effect.mood

    def _apply_stat_changes(self, stats: DomainPetStats, modifiers: Dict[str, int]) -> None:
        for key, delta in modifiers.items():
            if not hasattr(stats, key):
                continue
            value = getattr(stats, key)
            if not isinstance(value, int):
                continue
            setattr(stats, key, self._clamp(value + delta))

    def _merge_modifiers(self, target: Dict[str, int], source: Dict[str, int]) -> None:
        for key, delta in source.items():
            target[key] = target.get(key, 0) + delta

    def _derive_weather_effect(self, snapshot: WeatherSnapshot) -> Tuple[Optional[str], Dict[str, int], Dict[str, str]]:
        default = (None, {}, {})
        effect = self._WEATHER_MOODS.get(snapshot.condition, default)
        if effect is default:
            return default
        mood, modifiers, overlay = effect
        overlay = {**overlay, "weather_icon": snapshot.icon}
        return mood, modifiers, overlay

    def _resolve_mood(
        self,
        *,
        base_mood: str,
        event_mood: Optional[str],
        weather_mood: Optional[str],
        stats: DomainPetStats,
    ) -> str:
        if event_mood:
            return event_mood
        if weather_mood:
            return weather_mood
        average = (stats.hunger + stats.hygiene + stats.energy + stats.health) / 4
        if average >= 90:
            return "ecstatic"
        if average >= 75:
            return "happy"
        if average >= 55:
            return "content"
        if average >= 35:
            return "anxious"
        return "distressed"

    def _clamp(self, value: int, minimum: int = 0, maximum: int = 100) -> int:
        return max(minimum, min(maximum, value))


__all__ = ["SeasonalReactionsService"]

