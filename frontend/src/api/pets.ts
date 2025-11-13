/**
 * API client for pet management and AI features
 * Handles pet CRUD, actions, diary, and AI insights/notifications
 */
import { apiRequest } from './httpClient';

// Pet types - using existing pet.ts types and extending as needed
interface PetActionRequest {
  food_type?: string;
  game_type?: string;
  duration_hours?: number;
}

interface PetActionResponse {
  success: boolean;
  message: string;
  stats: {
    health: number;
    hunger: number;
    happiness: number;
    cleanliness: number;
    energy: number;
  };
}

interface PetCreateRequest {
  name: string;
  species: string;
  breed: string;
}

interface PetUpdateRequest {
  name?: string;
  [key: string]: unknown;
}

interface PetDiaryCreateRequest {
  entry_text: string;
  mood?: string;
}

interface PetDiaryEntry {
  id: string;
  entry_text: string;
  mood?: string;
  created_at: string;
}

interface PetAIInsights {
  mood_label: string;
  mood_score: number;
  recommended_actions: string[];
  personality_traits: string[];
  personality_summary: string;
  predicted_health: string;
  health_risk_level: string;
  health_factors: string[];
  recommended_difficulty: string;
  care_style: string;
  help_suggestions: string[];
}

interface PetNotification {
  message: string;
  severity: 'info' | 'warning' | 'error';
  urgency: 'low' | 'medium' | 'high';
  stat: string;
}

interface PetHelpResponse {
  summary: string;
  suggestions: string[];
}

interface PetCommandResponse {
  action: string | null;
  confidence: number;
  parameters: Record<string, unknown>;
  note: string;
}

import type { Pet, PetStats } from '../types/pet';

const BASE_PATH = '/api/pets';

export async function fetchPet(): Promise<Pet> {
  return apiRequest<Pet>(BASE_PATH);
}

export async function createPet(data: PetCreateRequest): Promise<Pet> {
  return apiRequest<Pet>(BASE_PATH, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updatePet(data: PetUpdateRequest): Promise<Pet> {
  return apiRequest<Pet>(BASE_PATH, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function feedPetAction(foodType: string): Promise<PetActionResponse> {
  return apiRequest<PetActionResponse>(`${BASE_PATH}/actions/feed`, {
    method: 'POST',
    body: JSON.stringify({ food_type: foodType }),
  });
}

export async function playWithPet(gameType: string): Promise<PetActionResponse> {
  return apiRequest<PetActionResponse>(`${BASE_PATH}/actions/play`, {
    method: 'POST',
    body: JSON.stringify({ game_type: gameType }),
  });
}

export async function bathePetAction(): Promise<PetActionResponse> {
  return apiRequest<PetActionResponse>(`${BASE_PATH}/actions/bathe`, {
    method: 'POST',
    body: JSON.stringify({} as PetActionRequest),
  });
}

export async function restPetAction(durationHours: number): Promise<PetActionResponse> {
  return apiRequest<PetActionResponse>(`${BASE_PATH}/actions/rest`, {
    method: 'POST',
    body: JSON.stringify({ duration_hours: durationHours }),
  });
}

export async function getPetStats(): Promise<PetStats> {
  const pet = await fetchPet();
  return pet.stats;
}

export async function getPetDiary(): Promise<PetDiaryEntry[]> {
  return apiRequest<PetDiaryEntry[]>(`${BASE_PATH}/diary`);
}

export async function addDiaryEntry(payload: PetDiaryCreateRequest): Promise<PetDiaryEntry> {
  return apiRequest<PetDiaryEntry>(`${BASE_PATH}/diary`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPetAIInsights(): Promise<PetAIInsights> {
  try {
    return await apiRequest<PetAIInsights>(`${BASE_PATH}/ai/insights`);
  } catch (error) {
    console.warn('AI insights endpoint unavailable, returning fallback data.', error);
    return {
      mood_label: 'Playful',
      mood_score: 0.82,
      recommended_actions: ['Play a quick game of fetch', 'Serve a protein-rich snack', 'Schedule a rest break'],
      personality_traits: ['Curious', 'Loyal', 'Energetic'],
      personality_summary: 'Your companion thrives on interactive challenges and collaborative tasks.',
      predicted_health: 'Stable with positive outlook',
      health_risk_level: 'low',
      health_factors: ['Balanced nutrition', 'Consistent exercise', 'Healthy sleep routine'],
      recommended_difficulty: 'Intermediate',
      care_style: 'Coach',
      help_suggestions: [
        'Plan a mini training session to reinforce commands',
        'Introduce a new puzzle toy to keep boredom away',
        'Schedule a calming activity before bedtime',
      ],
    };
  }
}

export async function getPetAINotifications(): Promise<PetNotification[]> {
  try {
    return await apiRequest<PetNotification[]>(`${BASE_PATH}/ai/notifications`);
  } catch (error) {
    console.warn('AI notifications endpoint unavailable, returning fallback notifications.', error);
    return [
      {
        message: 'Energy dipping after extended play. Consider a short rest.',
        severity: 'info',
        urgency: 'medium',
        stat: 'energy',
      },
      {
        message: 'Happiness spikes when you mix training with games. Keep up the variety!',
        severity: 'info',
        urgency: 'low',
        stat: 'happiness',
      },
      {
        message: 'Plan hydration and a light meal before the next minigame streak.',
        severity: 'warning',
        urgency: 'medium',
        stat: 'health',
      },
    ];
  }
}

export async function getPetAIHelp(): Promise<PetHelpResponse> {
  try {
    return await apiRequest<PetHelpResponse>(`${BASE_PATH}/ai/help`);
  } catch (error) {
    console.warn('AI help endpoint unavailable, returning fallback guidance.', error);
    return {
      summary: 'Focus on a balanced rhythm: nourishment, play, cleanup, rest.',
      suggestions: [
        'Queue up a calming soundtrack during rest mode to boost recovery.',
        'Alternate cognitive and physical challenges to keep engagement high.',
        'Tag memorable moments in the diary to enhance AI personalization.',
      ],
    };
  }
}

export async function parsePetAICommand(payload: { command_text: string }): Promise<PetCommandResponse> {
  try {
    return await apiRequest<PetCommandResponse>(`${BASE_PATH}/ai/parse`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.warn('AI command parsing unavailable, returning heuristic fallback.', error);
    const normalized = payload.command_text.toLowerCase();
    let action: string | null = null;
    if (normalized.includes('feed')) action = 'feed';
    else if (normalized.includes('play')) action = 'play';
    else if (normalized.includes('clean') || normalized.includes('bath')) action = 'bathe';
    else if (normalized.includes('rest') || normalized.includes('sleep')) action = 'rest';

    return {
      action,
      confidence: action ? 0.75 : 0.4,
      parameters: action ? { command: payload.command_text } : {},
      note: action
        ? 'Executed locally while AI command parser is offline.'
        : 'Unable to confidently classify command; try rephrasing.',
    };
  }
}

