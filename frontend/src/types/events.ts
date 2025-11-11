export interface EventEffectPayload {
  mood?: string | null;
  stat_modifiers: Record<string, number>;
  visual_overlays: Record<string, unknown>;
}

export interface EventResponse {
  event_id: string;
  name: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  type: string;
  effects: EventEffectPayload;
  is_active: boolean;
  is_upcoming: boolean;
  days_until_start?: number | null;
  days_remaining?: number | null;
  participation_status?: string | null;
}

export interface EventListResponse {
  current: EventResponse[];
  upcoming: EventResponse[];
}

export interface WeatherResponse {
  condition: string;
  description: string;
  icon: string;
  temperature_c: number;
  humidity: number;
  wind_speed: number;
  is_fallback: boolean;
  fetched_at: string;
  provider: string;
}

export interface SeasonalMoodPayload {
  mood?: string | null;
  stat_modifiers: Record<string, number>;
  overlays: Record<string, unknown>;
  active_events: string[];
  weather_condition?: string | null;
}

