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

interface RequestOptions {
  token: string;
}

const headers = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function sendSocialInteraction(
  payload: { pet_id: string; target_pet_id: string; prompt: string },
  options: RequestOptions,
): Promise<SocialInteractionResponse> {
  const response = await fetch(`${API_BASE}/social`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function sendVoiceCommand(
  payload: { transcript: string; locale?: string },
  options: RequestOptions,
): Promise<VoiceCommandResponse> {
  const response = await fetch(`${API_BASE}/voice`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function fetchARSession(options: RequestOptions): Promise<ARSessionResponse> {
  const response = await fetch(`${API_BASE}/ar`, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function saveCloudState(
  payload: { state: Record<string, unknown> },
  options: RequestOptions,
): Promise<CloudSaveResponse> {
  const response = await fetch(`${API_BASE}/cloud`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function fetchWeatherReaction(lat: number, lon: number): Promise<WeatherReactionResponse> {
  const params = new URLSearchParams({ lat: lat.toString(), lon: lon.toString() });
  const response = await fetch(`${API_BASE}/weather?${params.toString()}`);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function fetchHabitPrediction(options: RequestOptions): Promise<HabitPredictionResponse> {
  const response = await fetch(`${API_BASE}/habits`, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

export async function fetchSeasonalEvent(): Promise<SeasonalEventResponse> {
  const response = await fetch(`${API_BASE}/seasonal`);
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

