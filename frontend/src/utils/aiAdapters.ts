/**
 * AI Response Adapters
 * 
 * Transforms backend AI responses into UI-friendly structures.
 * Ensures consistent data shape across all AI features.
 */

import { BudgetAdvisorAnalysis } from '../components/budget/BudgetAdvisorAI';

/**
 * Base AI response structure that all AI responses should conform to
 */
export interface BaseAIResponse {
  generated_at?: string;
  session_id?: string;
}

/**
 * Adapter for Budget Advisor responses
 * Normalizes backend response to match frontend expectations
 */
export function adaptBudgetAdvisorResponse(
  response: any
): BudgetAdvisorAnalysis | null {
  if (!response) {
    return null;
  }

  // Handle both old format (status/data wrapper) and new unified format
  const data = response.data || response;

  // Validate required fields
  if (
    typeof data.total_spending === 'undefined' ||
    typeof data.total_income === 'undefined'
  ) {
    console.warn('Invalid budget advisor response format:', data);
    return null;
  }

  return {
    total_spending: data.total_spending ?? 0,
    total_income: data.total_income ?? 0,
    net_balance: data.net_balance ?? data.total_income - data.total_spending,
    average_daily_spending: data.average_daily_spending ?? 0,
    top_categories: Array.isArray(data.top_categories) ? data.top_categories : [],
    trends: Array.isArray(data.trends) ? data.trends : [],
    overspending_alerts: Array.isArray(data.overspending_alerts)
      ? data.overspending_alerts
      : [],
    suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
    analysis_period: data.analysis_period || {
      start: '',
      end: '',
    },
    forecast: Array.isArray(data.forecast) ? data.forecast : [],
  };
}

/**
 * Adapter for AI Chat responses
 * Ensures consistent structure with fallbacks
 */
export function adaptAIChatResponse(response: any): {
  message: string;
  mood?: string;
  notifications: string[];
  pet_state?: any;
  health_forecast?: any;
  session_id?: string;
  generated_at?: string;
} {
  if (!response) {
    return {
      message: "I'm having trouble responding right now. Please try again.",
      notifications: [],
    };
  }

  return {
    message: response.message || response.response || '',
    mood: response.mood,
    notifications: Array.isArray(response.notifications)
      ? response.notifications
      : [],
    pet_state: response.pet_state,
    health_forecast: response.health_forecast,
    session_id: response.session_id,
    generated_at: response.generated_at,
  };
}

/**
 * Adapter for Pet Behavior responses
 */
export function adaptPetBehaviorResponse(response: any): {
  mood_forecast: string[];
  activity_prediction: string[];
  generated_at?: string;
} {
  if (!response) {
    return {
      mood_forecast: [],
      activity_prediction: [],
    };
  }

  return {
    mood_forecast: Array.isArray(response.mood_forecast)
      ? response.mood_forecast
      : [],
    activity_prediction: Array.isArray(response.activity_prediction)
      ? response.activity_prediction
      : [],
    generated_at: response.generated_at,
  };
}

/**
 * Adapter for Pet Mood Forecast responses
 */
export function adaptPetMoodForecastResponse(response: any): {
  forecast: Array<{
    date: string;
    predicted_mood: string;
    confidence: number;
    reasoning: string;
  }>;
  generated_at?: string;
} {
  if (!response) {
    return {
      forecast: [],
    };
  }

  return {
    forecast: Array.isArray(response.forecast) ? response.forecast : [],
    generated_at: response.generated_at,
  };
}

/**
 * Adapter for Habit Prediction responses
 */
export function adaptHabitPredictionResponse(response: any): {
  predicted_habits: Array<{
    habit_type: string;
    frequency: string;
    likely_times: string[];
    confidence: number;
    description: string;
  }>;
  patterns_identified: string[];
  recommendations: string[];
  forecast_summary: string;
  generated_at?: string;
} {
  if (!response) {
    return {
      predicted_habits: [],
      patterns_identified: [],
      recommendations: [],
      forecast_summary: '',
    };
  }

  return {
    predicted_habits: Array.isArray(response.predicted_habits)
      ? response.predicted_habits
      : [],
    patterns_identified: Array.isArray(response.patterns_identified)
      ? response.patterns_identified
      : [],
    recommendations: Array.isArray(response.recommendations)
      ? response.recommendations
      : [],
    forecast_summary: response.forecast_summary || '',
    generated_at: response.generated_at,
  };
}

/**
 * Generic adapter for any AI response
 * Provides fallback structure for unknown response types
 */
export function adaptGenericAIResponse(response: any): BaseAIResponse {
  return {
    generated_at: response?.generated_at,
    session_id: response?.session_id,
  };
}
