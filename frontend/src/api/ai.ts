/**
 * API client for AI-powered features
 * Handles pet mood forecasting, habit prediction, and finance simulation
 */
import { apiRequest } from './httpClient';
import type {
  HabitPredictionRequest,
  HabitPredictionResponse,
  MoodForecastRequest,
  MoodForecastResponse,
  FinanceScenarioRequest,
  FinanceScenarioResponse,
  DecisionEvaluationRequest,
  DecisionEvaluationResponse,
} from '../types/ai';

const API_BASE = '/api/ai';

export async function getPetMoodForecast(request: MoodForecastRequest): Promise<MoodForecastResponse> {
  return apiRequest<MoodForecastResponse>(`${API_BASE}/pet_mood_forecast`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function predictHabits(request: HabitPredictionRequest): Promise<HabitPredictionResponse> {
  return apiRequest<HabitPredictionResponse>(`${API_BASE}/habit_prediction`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function generateFinanceScenario(request: FinanceScenarioRequest): Promise<FinanceScenarioResponse> {
  return apiRequest<FinanceScenarioResponse>(`${API_BASE}/finance_simulator/scenario`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export async function evaluateFinanceDecision(request: DecisionEvaluationRequest): Promise<DecisionEvaluationResponse> {
  return apiRequest<DecisionEvaluationResponse>(`${API_BASE}/finance_simulator/evaluate`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
}
