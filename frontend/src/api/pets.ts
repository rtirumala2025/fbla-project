/**
 * API client for pet management and AI features
 * Handles pet CRUD, actions, diary, and AI insights/notifications
 * Uses Supabase directly for pet data
 */
import { apiRequest } from './httpClient';
import { supabase, isSupabaseMock } from '../lib/supabase';
import type { Pet, PetStats, PetActionResponse } from '../types/pet';

// Pet types - using existing pet.ts types and extending as needed
interface PetActionRequest {
  food_type?: string;
  game_type?: string;
  duration_hours?: number;
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

const BASE_PATH = '/api/pets';

async function fetchPetFromSupabase(): Promise<Pet> {
  if (isSupabaseMock()) {
    throw new Error('Supabase is not configured');
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const userId = session.user.id;

  // Fetch pet from Supabase
  const { data: petData, error: petError } = await supabase
    .from('pets')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (petError) {
    if (petError.code === 'PGRST116') {
      // No pet found
      throw new Error('No pet found. Please create a pet first.');
    }
    throw petError;
  }

  if (!petData) {
    throw new Error('No pet found. Please create a pet first.');
  }

  // Calculate age in days from birthday
  const birthday = petData.birthday ? new Date(petData.birthday) : new Date(petData.created_at);
  const now = new Date();
  const ageInDays = Math.floor((now.getTime() - birthday.getTime()) / (1000 * 60 * 60 * 24));

  // Map Supabase pet to Pet type
  const pet: Pet = {
    id: petData.id,
    name: petData.name,
    species: petData.species as Pet['species'],
    breed: petData.breed,
    age: ageInDays,
    level: 1, // Default level if not stored separately
    experience: 0, // Default XP if not stored separately
    color_pattern: petData.color_pattern || null,
    birthday: petData.birthday || null,
    stats: {
      health: petData.health || 80,
      hunger: petData.hunger || 70,
      happiness: petData.happiness || 70,
      cleanliness: petData.cleanliness || 70,
      energy: petData.energy || 70,
      hygiene: petData.cleanliness || 70, // Map cleanliness to hygiene for compatibility
      mood: petData.mood || 'happy',
      level: 1, // Default level
      xp: 0, // Default XP
    },
    createdAt: new Date(petData.created_at),
    updatedAt: new Date(petData.updated_at || petData.created_at),
  };

  return pet;
}

export async function fetchPet(): Promise<Pet> {
  try {
    return await fetchPetFromSupabase();
  } catch (error) {
    // Try backend API as fallback
    try {
      return await apiRequest<Pet>(BASE_PATH);
    } catch (apiError) {
      console.error('Failed to fetch pet from Supabase and API', error, apiError);
      throw new Error('Failed to load pet. Please ensure you are logged in and have created a pet.');
    }
  }
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
  const response = await apiRequest<PetDiaryEntry[]>(`${BASE_PATH}/diary`);
  // Ensure all entries have required fields with defaults
  return response.map(entry => ({
    ...entry,
    mood: entry.mood || 'unknown',
  }));
}

export async function addDiaryEntry(payload: PetDiaryCreateRequest): Promise<PetDiaryEntry> {
  return apiRequest<PetDiaryEntry>(`${BASE_PATH}/diary`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getPetAIInsights(): Promise<PetAIInsights> {
  // AI insights endpoint not available - return empty insights gracefully
  // This feature can be implemented later if needed
  console.warn('AI insights endpoint not available, returning empty insights');
  return {
    mood_label: 'unknown',
    mood_score: 0,
    recommended_actions: [],
    personality_traits: [],
    personality_summary: '',
    predicted_health: 'unknown',
    health_risk_level: 'low',
    health_factors: [],
    recommended_difficulty: 'normal',
    care_style: 'balanced',
    help_suggestions: [],
  };
}

export async function getPetAINotifications(): Promise<PetNotification[]> {
  // AI notifications endpoint not available - return empty array gracefully
  // This feature can be implemented later if needed
  console.warn('AI notifications endpoint not available, returning empty notifications');
  return [];
}

export async function getPetAIHelp(): Promise<PetHelpResponse> {
  // AI help endpoint not available - return basic help gracefully
  // This feature can be implemented later if needed
  console.warn('AI help endpoint not available, returning basic help');
  return {
    summary: 'Pet care tips: Feed your pet regularly, play to increase happiness, bathe to maintain cleanliness, and ensure adequate rest.',
    suggestions: [
      'Check your pet\'s stats regularly',
      'Feed your pet when hunger is low',
      'Play with your pet to boost happiness',
      'Bathe your pet to maintain cleanliness',
      'Allow your pet to rest when energy is low',
    ],
  };
}

export async function parsePetAICommand(payload: { command_text: string }): Promise<PetCommandResponse> {
  // Use existing AI NLP command endpoint
  try {
    const response = await apiRequest<{
      action: string | null;
      confidence: number;
      parameters: Record<string, unknown>;
      note: string;
    }>('/api/ai/nlp_command', {
      method: 'POST',
      body: JSON.stringify({ command: payload.command_text }),
    });
    return {
      action: response.action,
      confidence: response.confidence,
      parameters: response.parameters,
      note: response.note,
    };
  } catch (error) {
    console.error('AI command parsing unavailable', error);
    throw new Error('Failed to parse command. Please ensure the backend server is running and try again.');
  }
}

// Pet interaction endpoint - unified endpoint for all pet actions
export interface PetInteractRequest {
  session_id?: string;
  action: string;
  message?: string;
}

export interface PetInteractResponse {
  session_id: string;
  message: string;
  mood: string;
  pet_state: {
    health?: number;
    hunger?: number;
    happiness?: number;
    cleanliness?: number;
    energy?: number;
    mood?: string;
    level?: number;
    xp?: number;
    last_updated?: string;
    [key: string]: unknown;
  };
  notifications: string[];
  health_forecast?: {
    trend?: string;
    risk?: string;
    recommended_actions?: string[];
    [key: string]: unknown;
  };
}

export async function interactWithPet(payload: PetInteractRequest): Promise<PetInteractResponse> {
  return apiRequest<PetInteractResponse>('/api/pet/interact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

