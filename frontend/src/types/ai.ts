/**
 * TypeScript types for AI-powered features
 */

export interface MoodForecastEntry {
  date: string;
  predicted_mood: string;
  confidence: number;
  reasoning: string;
}

export interface MoodForecastRequest {
  pet_id: string;
  current_stats: {
    hunger?: number;
    happiness?: number;
    energy?: number;
    cleanliness?: number;
    health?: number;
    mood?: string;
  };
  interaction_history: Array<{
    action: string;
    timestamp: string;
    pet_stats_before?: Record<string, any>;
    pet_stats_after?: Record<string, any>;
  }>;
  forecast_days?: number;
}

export interface MoodForecastResponse {
  forecast: MoodForecastEntry[];
  generated_at: string;
}

export interface PredictedHabit {
  habit_type: string;
  frequency: string;
  likely_times: string[];
  confidence: number;
  description: string;
}

export interface HabitPredictionRequest {
  user_id: string;
  interaction_history: Array<{
    action: string;
    timestamp: string;
    [key: string]: any;
  }>;
  pet_stats_history: Array<Record<string, any>>;
  forecast_days?: number;
}

export interface HabitPredictionResponse {
  predicted_habits: PredictedHabit[];
  patterns_identified: string[];
  recommendations: string[];
  forecast_summary: string;
  generated_at: string;
}

export interface FinancialImpact {
  income_change: number;
  expense_change: number;
  savings_change: number;
  debt_change: number;
}

export interface ScenarioOption {
  option_id: string;
  label: string;
  description: string;
  financial_impact: FinancialImpact;
  risk_level: string;
  time_horizon: string;
}

export interface FinanceScenarioRequest {
  scenario_type: 'loan' | 'investment' | 'budgeting' | 'savings';
  user_context?: {
    age?: number;
    income?: number;
    savings?: number;
    expenses?: number;
    goals?: string;
  };
}

export interface FinanceScenarioResponse {
  scenario_id: string;
  title: string;
  description: string;
  scenario_type: string;
  initial_situation: {
    income: number;
    expenses: number;
    savings: number;
    debt: number;
  };
  options: ScenarioOption[];
  learning_objectives: string[];
  concepts_covered: string[];
  generated_at: string;
}

export interface DecisionEvaluationRequest {
  scenario_id: string;
  selected_option_id: string;
  scenario_context: FinanceScenarioResponse;
}

export interface DecisionEvaluationResponse {
  evaluation_score: number;
  immediate_impact: {
    financial_change: string;
    new_balance: string;
  };
  long_term_consequences: string[];
  lessons_learned: string[];
  feedback: string;
  alternative_perspectives: string[];
  recommendations: string[];
  overall_assessment: string;
  evaluated_at: string;
  scenario_id: string;
}
