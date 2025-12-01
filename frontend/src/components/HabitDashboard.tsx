/**
 * HabitDashboard Component
 * Displays predicted user habits with visualization and recommendations
 */
import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, Target, CheckCircle, AlertCircle } from 'lucide-react';
import { predictHabits } from '../api/ai';
import type { HabitPredictionRequest, HabitPredictionResponse } from '../types/ai';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface HabitDashboardProps {
  userId: string;
  interactionHistory?: Array<{
    action: string;
    timestamp: string;
    [key: string]: any;
  }>;
  petStatsHistory?: Array<Record<string, any>>;
  forecastDays?: number;
}

const HABIT_TYPE_ICONS: Record<string, React.ReactNode> = {
  feeding: '🍽️',
  playing: '🎮',
  cleaning: '🧹',
  resting: '😴',
  general_care: '❤️',
};

const FREQUENCY_COLORS: Record<string, string> = {
  daily: '#10b981', // green
  every_other_day: '#3b82f6', // blue
  weekly: '#f59e0b', // amber
  irregular: '#6b7280', // gray
};

export const HabitDashboard: React.FC<HabitDashboardProps> = ({
  userId,
  interactionHistory = [],
  petStatsHistory = [],
  forecastDays = 14,
}) => {
  const [predictions, setPredictions] = useState<HabitPredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPredictions = async () => {
      setLoading(true);
      setError(null);
      try {
        const request: HabitPredictionRequest = {
          user_id: userId,
          interaction_history: interactionHistory,
          pet_stats_history: petStatsHistory,
          forecast_days: forecastDays,
        };
        const response = await predictHabits(request);
        setPredictions(response);
      } catch (err: any) {
        setError(err.message || 'Failed to load habit predictions');
        console.error('Error fetching habit predictions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchPredictions();
    }
  }, [userId, forecastDays]);

  if (loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-soft">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">Error Loading Predictions</span>
        </div>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Habit Predictions</h3>
        <p className="text-sm text-slate-600">No prediction data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Predicted Habits
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Clock className="w-4 h-4" />
            <span>{forecastDays} days forecast</span>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-4">{predictions.forecast_summary}</p>

        {/* Predicted Habits */}
        <div className="space-y-3">
          {predictions.predicted_habits.map((habit, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 p-4 bg-gradient-to-r from-slate-50 to-white"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{HABIT_TYPE_ICONS[habit.habit_type] || '❤️'}</span>
                  <div>
                    <h4 className="font-semibold text-slate-800 capitalize">{habit.habit_type.replace('_', ' ')}</h4>
                    <p className="text-xs text-slate-600">{habit.description}</p>
                  </div>
                </div>
                <span
                  className="text-xs px-2 py-1 rounded-full font-semibold text-white"
                  style={{ backgroundColor: FREQUENCY_COLORS[habit.frequency] || '#6b7280' }}
                >
                  {habit.frequency.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Clock className="w-3 h-3" />
                  <span>{habit.likely_times.join(', ')}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>{(habit.confidence * 100).toFixed(0)}% confidence</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Patterns Identified */}
      {predictions.patterns_identified.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h4 className="text-md font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Patterns Identified
          </h4>
          <ul className="space-y-2">
            {predictions.patterns_identified.map((pattern, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-emerald-600 mt-1">•</span>
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {predictions.recommendations.length > 0 && (
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-soft">
          <h4 className="text-md font-semibold text-indigo-800 mb-3">Recommendations</h4>
          <ul className="space-y-2">
            {predictions.recommendations.map((recommendation, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-indigo-700">
                <span className="text-indigo-600 mt-1">→</span>
                <span>{recommendation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default HabitDashboard;
