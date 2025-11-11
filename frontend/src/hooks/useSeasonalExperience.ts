import { useCallback, useEffect, useMemo, useState } from 'react';

import { ApiError } from '../api/httpClient';
import { useOfflineCache } from './useOfflineCache';
import { useOfflineStatus } from './useOfflineStatus';
import { seasonalService, type EventListResponse, type SeasonalMoodPayload, type WeatherResponse } from '../services/seasonalService';
import type { PetStats } from '../types/pet';

interface SeasonalSnapshot {
  events: EventListResponse | null;
  weather: WeatherResponse | null;
  seasonalMood: SeasonalMoodPayload | null;
  fetchedAt: number;
  petStats: PetStats | null;
}

interface UseSeasonalExperienceResult {
  events: EventListResponse | null;
  weather: WeatherResponse | null;
  seasonalMood: SeasonalMoodPayload | null;
  adjustedStats: PetStats | null;
  loading: boolean;
  error: string | null;
  offline: boolean;
  usingCache: boolean;
  refresh: () => Promise<void>;
  lastUpdated: number | null;
}

const STORAGE_KEY = 'seasonal.snapshot';

export const useSeasonalExperience = (baseStats: PetStats | null = null): UseSeasonalExperienceResult => {
  const [snapshot, setSnapshot] = useState<SeasonalSnapshot | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const offlineStatus = useOfflineStatus();
  const { cached } = useOfflineCache<SeasonalSnapshot>({
    key: STORAGE_KEY,
    data: snapshot,
  });

  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => {
        setCoordinates(null);
      },
      { timeout: 5000 },
    );
  }, []);

  const handleFetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [events, weather, petSeasonal] = await Promise.all([
        seasonalService.fetchEvents(),
        seasonalService.fetchWeather(coordinates?.lat, coordinates?.lon),
        seasonalService.fetchPetSeasonalState(),
      ]);

      setSnapshot({
        events,
        weather,
        seasonalMood: petSeasonal.seasonalMood,
        fetchedAt: Date.now(),
        petStats: petSeasonal.pet?.stats ?? null,
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setSnapshot({
          events: null,
          weather: null,
          seasonalMood: null,
          fetchedAt: Date.now(),
          petStats: null,
        });
      } else {
        console.error('Failed to fetch seasonal data', err);
        setError(err instanceof Error ? err.message : 'Unable to load seasonal data');
      }
    } finally {
      setLoading(false);
    }
  }, [coordinates?.lat, coordinates?.lon]);

  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  const activeSnapshot = snapshot ?? cached ?? null;
  const adjustedStats = useMemo(() => {
    if (activeSnapshot?.petStats) {
      return activeSnapshot.petStats;
    }
    return baseStats;
  }, [activeSnapshot?.petStats, baseStats]);

  return {
    events: activeSnapshot?.events ?? null,
    weather: activeSnapshot?.weather ?? null,
    seasonalMood: activeSnapshot?.seasonalMood ?? null,
    adjustedStats,
    loading,
    error,
    offline: offlineStatus.offline,
    usingCache: snapshot === null && cached !== null,
    refresh: handleFetch,
    lastUpdated: activeSnapshot?.fetchedAt ?? null,
  };
};

