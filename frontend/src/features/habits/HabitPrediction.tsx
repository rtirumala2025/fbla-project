/**
 * Habit Prediction Component
 * Displays AI-powered habit predictions based on user interaction patterns
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Lightbulb, Target, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../api/httpClient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface PredictedHabit {
  habit_type: string;
  frequency: string;
  likely_times: string[];
  confidence: number;
  description: string;
}

interface HabitPredictionResponse {
  predicted_habits: PredictedHabit[];
  patterns_identified: string[];
  recommendations: string[];
  forecast_summary: string;
  generated_at?: string;
}

export function HabitPrediction() {
  const [predictions, setPredictions] = useState<HabitPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [interactionHistory, setInteractionHistory] = useState<any[]>([]);
  const [petStatsHistory, setPetStatsHistory] = useState<any[]>([]);
  const [forecastDays, setForecastDays] = useState(14);

  const loadPredictions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest<HabitPredictionResponse>('/api/habits/predict', {
        method: 'POST',
        body: JSON.stringify({
          interaction_history: interactionHistory,
          pet_stats_history: petStatsHistory,
          forecast_days: forecastDays,
        }),
      });
      
      setPredictions(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habit predictions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load interaction history from localStorage or context
    // This is a placeholder - in production, fetch from backend
    const storedHistory = localStorage.getItem('pet_interactions');
    if (storedHistory) {
      try {
        setInteractionHistory(JSON.parse(storedHistory));
      } catch (e) {
        console.error('Failed to parse interaction history', e);
      }
    }

    loadPredictions();
  }, [forecastDays]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  if (!predictions) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No predictions available. Start interacting with your pet to generate predictions!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Forecast Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200"
      >
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Forecast Summary</h3>
            <p className="text-gray-700">{predictions.forecast_summary}</p>
          </div>
        </div>
      </motion.div>

      {/* Predicted Habits */}
      <section>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Predicted Habits ({predictions.predicted_habits.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {predictions.predicted_habits.map((habit, index) => (
            <HabitCard key={index} habit={habit} />
          ))}
        </div>
      </section>

      {/* Patterns Identified */}
      {predictions.patterns_identified.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Patterns Identified
          </h3>
          <div className="space-y-2">
            {predictions.patterns_identified.map((pattern, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-white rounded-lg border border-gray-200"
              >
                <p className="text-gray-700">{pattern}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Recommendations */}
      {predictions.recommendations.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Recommendations
          </h3>
          <div className="space-y-2">
            {predictions.recommendations.map((recommendation, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-yellow-50 rounded-lg border border-yellow-200"
              >
                <p className="text-gray-700">{recommendation}</p>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Forecast Days Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          Forecast Period:
        </label>
        <select
          value={forecastDays}
          onChange={(e) => setForecastDays(Number(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={7}>7 days</option>
          <option value={14}>14 days</option>
          <option value={30}>30 days</option>
        </select>
        <button
          onClick={loadPredictions}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Predictions
        </button>
      </div>
    </div>
  );
}

function HabitCard({ habit }: { habit: PredictedHabit }) {
  const getHabitIcon = (type: string) => {
    switch (type) {
      case 'feeding':
        return '🍖';
      case 'playing':
        return '⚽';
      case 'cleaning':
        return '🛁';
      case 'resting':
        return '😴';
      default:
        return '🎯';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getHabitIcon(habit.habit_type)}</span>
          <div>
            <h4 className="font-semibold text-gray-900 capitalize">
              {habit.habit_type.replace('_', ' ')}
            </h4>
            <p className="text-sm text-gray-500 capitalize">{habit.frequency}</p>
          </div>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getConfidenceColor(habit.confidence)}`}
        >
          {(habit.confidence * 100).toFixed(0)}% confidence
        </span>
      </div>
      <p className="text-sm text-gray-700 mb-3">{habit.description}</p>
      {habit.likely_times.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {habit.likely_times.map((time, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
            >
              {time}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
