/**
 * API client for next-generation features
 * Handles AI interactions, voice commands, AR, cloud saves, weather, habits, and seasonal events
 */
import { apiRequest } from './httpClient';
import type {
  ARSessionResponse,
  CloudSaveResponse,
  HabitPredictionResponse,
  SeasonalEventResponse,
  SocialInteractionResponse,
  VoiceCommandResponse,
  WeatherReactionResponse,
} from '../types/nextGen';

const API_BASE = '/api/nextgen';

export async function sendSocialInteraction(payload: {
  pet_id: string;
  target_pet_id: string;
  prompt: string;
}): Promise<SocialInteractionResponse> {
  return apiRequest<SocialInteractionResponse>(`${API_BASE}/social`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function sendVoiceCommand(payload: {
  transcript: string;
  locale?: string;
}): Promise<VoiceCommandResponse> {
  return apiRequest<VoiceCommandResponse>(`${API_BASE}/voice`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchARSession(): Promise<ARSessionResponse> {
  return apiRequest<ARSessionResponse>(`${API_BASE}/ar`);
}

export async function saveCloudState(payload: { state: Record<string, unknown> }): Promise<CloudSaveResponse> {
  return apiRequest<CloudSaveResponse>(`${API_BASE}/cloud`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchWeatherReaction(lat: number, lon: number): Promise<WeatherReactionResponse> {
  return apiRequest<WeatherReactionResponse>(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
}

export async function fetchHabitPrediction(): Promise<HabitPredictionResponse> {
  return apiRequest<HabitPredictionResponse>(`${API_BASE}/habits`);
}

export async function fetchSeasonalEvent(): Promise<SeasonalEventResponse> {
  return apiRequest<SeasonalEventResponse>(`${API_BASE}/seasonal`, { skipAuth: true });
}

