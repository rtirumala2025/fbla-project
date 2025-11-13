/**
 * Seasonal Service
 * Handles seasonal events, weather, and pet seasonal state
 */
import { apiRequest } from '../api/httpClient';
import type { Pet } from '../types/pet';
import type { EventListResponse, EventResponse, SeasonalMoodPayload, WeatherResponse } from '../types/events';

type PetSeasonalResponse =
  | Pet
  | {
      detail?: string;
    };

export const seasonalService = {
  async fetchEvents(): Promise<EventListResponse> {
    return apiRequest<EventListResponse>('/api/events');
  },

  async fetchEvent(eventId: string): Promise<EventResponse> {
    return apiRequest<EventResponse>(`/api/events/${eventId}`);
  },

  async fetchWeather(lat?: number, lon?: number): Promise<WeatherResponse> {
    const params = new URLSearchParams();
    if (typeof lat === 'number' && !Number.isNaN(lat)) {
      params.append('lat', lat.toString());
    }
    if (typeof lon === 'number' && !Number.isNaN(lon)) {
      params.append('lon', lon.toString());
    }
    const query = params.toString();
    const path = query ? `/api/weather?${query}` : '/api/weather';
    return apiRequest<WeatherResponse>(path);
  },

  async fetchPetSeasonalState(): Promise<{
    pet: Pet | null;
    seasonalMood: SeasonalMoodPayload | null;
  }> {
    const response = await apiRequest<PetSeasonalResponse>('/api/pets', {
      allowedStatuses: [404],
    });
    if ('detail' in (response as any) || response === null) {
      return { pet: null, seasonalMood: null };
    }
    const pet = response as Pet;
    return {
      pet,
      seasonalMood: (pet as any).seasonal_state ?? null,
    };
  },
};

export type { EventListResponse, EventResponse, WeatherResponse, SeasonalMoodPayload };

