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
const useMock = process.env.REACT_APP_USE_MOCK === 'true';

// Generate mock AR session
function generateMockARSession(): ARSessionResponse {
  return {
    session_id: `ar-${Date.now()}`,
    anchor_description: 'Place your device on a flat surface and look for horizontal planes',
    instructions: [
      'Find a well-lit area with clear floor space',
      'Point your camera at the ground',
      'Wait for AR plane detection',
      'Tap to place your virtual pet companion',
    ],
  };
}

// Generate mock weather reaction
function generateMockWeatherReaction(): WeatherReactionResponse {
  return {
    condition: 'Sunny',
    temperature_c: 22,
    reaction: 'Perfect weather for outdoor activities! Your pet would love a walk or play session.',
    recommendation: 'Take advantage of the nice weather - play fetch or go for a virtual walk!',
  };
}

// Generate mock habit prediction
function generateMockHabitPrediction(): HabitPredictionResponse {
  return {
    preferred_actions: ['feed', 'play', 'clean'],
    next_best_time: 'afternoon',
    confidence: 0.75,
  };
}

// Generate mock seasonal event
function generateMockSeasonalEvent(): SeasonalEventResponse {
  return {
    event_name: 'Autumn Harvest Festival',
    message: 'Celebrate the season with special rewards and challenges!',
    rewards: ['bonus_coins', 'seasonal_badge', 'exclusive_accessory'],
  };
}

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
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockARSession();
  }

  try {
    return await apiRequest<ARSessionResponse>(`${API_BASE}/ar`);
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('AR API unavailable, using mock data', error);
    return generateMockARSession();
  }
}

export async function saveCloudState(payload: { state: Record<string, unknown> }): Promise<CloudSaveResponse> {
  return apiRequest<CloudSaveResponse>(`${API_BASE}/cloud`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchWeatherReaction(lat: number, lon: number): Promise<WeatherReactionResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockWeatherReaction();
  }

  try {
    return await apiRequest<WeatherReactionResponse>(`${API_BASE}/weather?lat=${lat}&lon=${lon}`);
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Weather API unavailable, using mock data', error);
    return generateMockWeatherReaction();
  }
}

export async function fetchHabitPrediction(): Promise<HabitPredictionResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockHabitPrediction();
  }

  try {
    return await apiRequest<HabitPredictionResponse>(`${API_BASE}/habits`);
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Habit prediction API unavailable, using mock data', error);
    return generateMockHabitPrediction();
  }
}

export async function fetchSeasonalEvent(): Promise<SeasonalEventResponse> {
  // Use mock data if in mock mode or if API fails
  if (useMock) {
    await new Promise(resolve => setTimeout(resolve, 200));
    return generateMockSeasonalEvent();
  }

  try {
    return await apiRequest<SeasonalEventResponse>(`${API_BASE}/seasonal`, { skipAuth: true });
  } catch (error) {
    // Fallback to mock data if API fails
    console.warn('Seasonal event API unavailable, using mock data', error);
    return generateMockSeasonalEvent();
  }
}

