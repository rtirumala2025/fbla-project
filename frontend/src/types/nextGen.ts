/**
 * Type definitions for next-generation features
 * Defines interfaces for AI interactions, voice commands, AR, cloud saves, and predictions
 */
export interface SocialInteractionResponse {
  summary: string;
  suggested_follow_up: string;
  timestamp: string;
}

export interface VoiceCommandResponse {
  intent: string;
  confidence: number;
  action?: string | null;
  feedback: string;
}

export interface ARSessionResponse {
  session_id: string;
  anchor_description: string;
  instructions: string[];
}

export interface CloudSaveResponse {
  saved_at: string;
  checksum: string;
}

export interface WeatherReactionResponse {
  condition: string;
  temperature_c: number;
  reaction: string;
  recommendation: string;
}

export interface HabitPredictionResponse {
  preferred_actions: string[];
  next_best_time: string;
  confidence: number;
}

export interface SeasonalEventResponse {
  event_name: string;
  message: string;
  rewards: string[];
}

