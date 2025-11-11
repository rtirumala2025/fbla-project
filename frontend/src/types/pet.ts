export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fox' | 'dragon';

import type { SeasonalMoodPayload } from './events';

export interface PetStats {
  health: number;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
  lastUpdated?: Date;
  hygiene?: number;
  mood?: string;
  level?: number;
  xp?: number;
  is_sick?: boolean;
}

export interface PetDiaryEntry {
  id: string;
  mood: string;
  note?: string | null;
  created_at: string;
}

export interface Pet {
  id: string;
  ownerId: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age: number;
  level: number;
  experience: number;
  color_pattern?: string | null;
  birthday?: string | null;
  stats: PetStats;
  createdAt: Date;
  updatedAt: Date;
  seasonal_state?: SeasonalMoodPayload | null;
  diary?: PetDiaryEntry[];
}

export interface PetCreateRequest {
  name: string;
  species: PetSpecies;
  breed: string;
  color_pattern?: string | null;
  birthday?: string | null;
}

export type PetUpdateRequest = Partial<PetCreateRequest> & {
  health?: number;
  hunger?: number;
  happiness?: number;
  cleanliness?: number;
  energy?: number;
  experience?: number;
  level?: number;
};

export interface PetNotification {
  message: string;
  severity: 'info' | 'warning' | 'critical';
  urgency: 'low' | 'medium' | 'high';
  stat?: string;
}

export interface PetHelpResponse {
  summary: string;
  suggestions: string[];
}

export interface PetAIInsights {
  mood_label: string;
  mood_score: number;
  recommended_actions: string[];
  personality_traits: string[];
  personality_summary: string;
  predicted_health: string;
  health_risk_level: 'low' | 'medium' | 'high';
  health_factors: string[];
  recommended_difficulty: string;
  care_style: string;
  help_suggestions?: string[];
  updated_at?: string;
}

export interface PetCommandResponse {
  action: string | null;
  confidence: number;
  parameters: Record<string, string | number>;
  note: string;
}

export interface PetDiaryCreateRequest {
  mood: string;
  note?: string;
}

export interface PetActionResponse {
  pet: Pet;
  reaction: string;
  mood: string;
  notifications: string[];
}

export interface PetActionRequest {
  food_type?: string;
  game_type?: string;
  duration_hours?: number;
}

export const speciesBreedMap: Record<PetSpecies, string[]> = {
  dog: ['Labrador', 'Poodle', 'Beagle', 'Husky', 'Shiba'],
  cat: ['Siamese', 'Maine Coon', 'Bengal', 'Sphynx'],
  bird: ['Parakeet', 'Cockatiel', 'Macaw', 'Finch'],
  rabbit: ['Lop', 'Lionhead', 'Dutch', 'Rex'],
  fox: ['Arctic', 'Fennec', 'Silver'],
  dragon: ['Emerald', 'Crimson', 'Azure'],
};
