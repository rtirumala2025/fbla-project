export interface PetStats {
  health: number;
  hunger: number;
  happiness: number;
  cleanliness: number;
  energy: number;
  lastUpdated?: Date;
  mood?: string;
  level?: number;
  xp?: number;
  hygiene?: number;
  is_sick?: boolean;
}

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  age?: number; // in days
  level?: number;
  experience?: number;
  stats: PetStats;
  ownerId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  color_pattern?: string | null;
  birthday?: string | null;
}

export interface UserData {
  id: string;
  email: string;
  displayName: string;
  coins: number;
  inventory: {
    food: { [itemId: string]: number };
    toys: { [itemId: string]: number };
    medicine: { [itemId: string]: number };
  };
  currentPetId: string | null;
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  date: Date;
  itemId?: string;
  itemType?: 'food' | 'toys' | 'medicine';
  quantity?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'food' | 'toy' | 'medicine';
  effect: {
    stat: keyof PetStats;
    value: number;
  };
  icon: string;
  forSpecies?: ('dog' | 'cat' | 'bird' | 'rabbit')[];
}

// Extended types for pet features
export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fox' | 'dragon' | 'panda';

export interface PetCreateRequest {
  name: string;
  species: PetSpecies;
  breed: string;
  color_pattern?: string | null;
  birthday?: string | null;
}

export interface PetActionResponse {
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
    color?: string | null;
    user_id: string;
    created_at: string;
    updated_at: string;
    stats: PetStats & { 
      mood: string; 
      level: number; 
      xp: number; 
      hygiene: number; 
      is_sick: boolean;
      evolution_stage?: string;
    };
    diary?: PetDiaryEntry[];
    seasonal_state?: unknown;
  };
  reaction: string;
  mood: string;
  notifications: string[];
  health_forecast?: {
    trend?: string;
    risk?: string;
    recommended_actions?: string[];
    [key: string]: unknown;
  };
}

export interface PetDiaryEntry {
  id: string;
  entry_text?: string; // Optional for backward compatibility
  note?: string; // Backend uses 'note' field
  mood?: string; // Backend provides 'mood' but may be optional in some responses
  created_at: string;
}

export interface PetAIInsights {
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

export interface PetNotification {
  message: string;
  severity: 'info' | 'warning' | 'error';
  urgency: 'low' | 'medium' | 'high';
  stat: string;
}

export interface PetHelpResponse {
  summary: string;
  suggestions: string[];
}

export interface PetCommandResponse {
  action: string | null;
  confidence: number;
  parameters: Record<string, unknown>;
  note: string;
}

// Breed mapping for species
export const speciesBreedMap: Record<PetSpecies, string[]> = {
  dog: ['Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 'Beagle'],
  cat: ['Persian', 'Siamese', 'Maine Coon', 'British Shorthair', 'Ragdoll'],
  bird: ['Parrot', 'Canary', 'Finch', 'Cockatiel', 'Lovebird'],
  rabbit: ['Dutch', 'Lop', 'Angora', 'Rex', 'Lionhead'],
  fox: ['Red Fox', 'Arctic Fox', 'Fennec Fox', 'Gray Fox'],
  dragon: ['Fire Dragon', 'Ice Dragon', 'Storm Dragon', 'Earth Dragon'],
  panda: ['Giant Panda', 'Red Panda', 'Mixed'],
};
