"""Service for fetching and caching weather conditions."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Optional

import httpx

from app.core.config import get_settings
from app.models import WeatherSnapshot


class WeatherService:
    """Fetch weather from OpenWeatherMap with graceful fallbacks."""

    _CACHE_TTL = timedelta(minutes=15)

    def __init__(self, *, client: Optional[httpx.AsyncClient] = None) -> None:
        self._client = client
        self._api_key = get_settings().weather_api_key
        self._cache: dict[str, WeatherSnapshot] = {}

    async def get_weather(
        self,
        *,
        user_id: Optional[str],
        lat: Optional[float],
        lon: Optional[float],
    ) -> WeatherSnapshot:
        """Return the latest weather snapshot, using cache and fallbacks."""
        cache_key = self._cache_key(user_id, lat, lon)
        cached = self._cache.get(cache_key)
        if cached and datetime.now(timezone.utc) - cached.fetched_at <= self._CACHE_TTL:
            return cached

        if not self._api_key or lat is None or lon is None:
            snapshot = self._fallback_snapshot(reason="missing_configuration")
            self._cache[cache_key] = snapshot
            return snapshot

        try:
            snapshot = await self._fetch_weather(lat=lat, lon=lon)
        except Exception:
            snapshot = self._fallback_snapshot(reason="network_error")

        self._cache[cache_key] = snapshot
        return snapshot

    async def _fetch_weather(self, *, lat: float, lon: float) -> WeatherSnapshot:
        url = "https://api.openweathermap.org/data/2.5/weather"
        params = {
            "lat": lat,
            "lon": lon,
            "appid": self._api_key,
            "units": "metric",
        }

        async with (self._client or httpx.AsyncClient(timeout=10.0)) as client:
            response = await client.get(url, params=params)  # type: ignore[arg-type]
            response.raise_for_status()
            payload = response.json()

        weather_data = payload["weather"][0]
        main_data = payload["main"]
        wind = payload.get("wind", {})

        return WeatherSnapshot(
            condition=weather_data.get("main", "Clear"),
            description=weather_data.get("description", "Clear skies."),
            icon=weather_data.get("icon", "01d"),
            temperature_c=float(main_data.get("temp", 20.0)),
            humidity=float(main_data.get("humidity", 55.0)),
            wind_speed=float(wind.get("speed", 3.5)),
            is_fallback=False,
            fetched_at=datetime.now(timezone.utc),
            provider="openweathermap",
        )

    def _fallback_snapshot(self, *, reason: str) -> WeatherSnapshot:
        presets = {
            "missing_configuration": ("Clear", "Pleasant clear skies.", "01d", 22.0, 50.0, 2.5),
            "network_error": ("Clouds", "Soft clouds drifting by.", "02d", 18.0, 60.0, 4.0),
        }
        condition, description, icon, temp, humidity, wind = presets.get(
            reason,
            ("Clear", "Bright and calm day.", "01d", 20.0, 55.0, 3.0),
        )
        return WeatherSnapshot(
            condition=condition,
            description=description,
            icon=icon,
            temperature_c=temp,
            humidity=humidity,
            wind_speed=wind,
            is_fallback=True,
            fetched_at=datetime.now(timezone.utc),
            provider="fallback",
        )

    def _cache_key(self, user_id: Optional[str], lat: Optional[float], lon: Optional[float]) -> str:
        if user_id:
            return f"{user_id}:{lat}:{lon}"
        return f"anon:{lat}:{lon}"


__all__ = ["WeatherService"]

