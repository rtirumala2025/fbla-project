import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Brain, TrendingUp, Calendar, Activity } from 'lucide-react';
import apiClient from '../services/apiClient';
import { LoadingSpinner } from './ui/LoadingSpinner';

// TypeScript interfaces matching backend schemas
export interface InteractionHistoryItem {
  action: string;
  timestamp: string; // ISO format
  pet_stats_before?: {
    hunger?: number;
    happiness?: number;
    energy?: number;
    cleanliness?: number;
    health?: number;
  };
  pet_stats_after?: {
    hunger?: number;
    happiness?: number;
    energy?: number;
    cleanliness?: number;
    health?: number;
  };
}

export interface PetBehaviorResponse {
  mood_forecast: string[];
  activity_prediction: string[];
}

export interface PetBehaviorDashboardProps {
  petId: string;
  interactionHistory: InteractionHistoryItem[];
  className?: string;
}

export const PetBehaviorDashboard: React.FC<PetBehaviorDashboardProps> = ({
  petId,
  interactionHistory,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moodForecast, setMoodForecast] = useState<string[]>([]);
  const [activityPrediction, setActivityPrediction] = useState<string[]>([]);

  const fetchBehaviorAnalysis = useCallback(async () => {
    if (!interactionHistory || interactionHistory.length === 0) {
      setError('No interaction history provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<PetBehaviorResponse>('/api/ai/pet_behavior', {
        pet_id: petId,
        interaction_history: interactionHistory,
      });

      setMoodForecast(response.data.mood_forecast);
      setActivityPrediction(response.data.activity_prediction);
    } catch (err: any) {
      // Handle network errors gracefully
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        setError(null); // Don't show error for connection refused
        setLoading(false);
        return;
      }
      
      const errorMessage =
        err.response?.data?.detail ||
        err.message ||
        'Failed to analyze pet behavior. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [petId, interactionHistory]);

  useEffect(() => {
    if (interactionHistory && interactionHistory.length > 0) {
      fetchBehaviorAnalysis();
    }
  }, [fetchBehaviorAnalysis]);

  // Prepare chart data from interaction history
  const prepareChartData = () => {
    if (!interactionHistory || interactionHistory.length === 0) return [];

    // Group interactions by action type
    const actionCounts: Record<string, number> = {};
    interactionHistory.forEach((interaction) => {
      actionCounts[interaction.action] = (actionCounts[interaction.action] || 0) + 1;
    });

    return Object.entries(actionCounts).map(([action, count]) => ({
      action: action.charAt(0).toUpperCase() + action.slice(1),
      count,
    }));
  };

  // Prepare trend data from stats
  const prepareTrendData = () => {
    if (!interactionHistory || interactionHistory.length === 0) return [];

    return interactionHistory
      .filter((item) => item.pet_stats_after)
      .slice(-10) // Last 10 interactions
      .map((item, index) => ({
        interaction: `#${index + 1}`,
        hunger: item.pet_stats_after?.hunger || 0,
        happiness: item.pet_stats_after?.happiness || 0,
        energy: item.pet_stats_after?.energy || 0,
        cleanliness: item.pet_stats_after?.cleanliness || 0,
      }));
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center min-h-[400px] ${className}`}>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 font-medium">Analyzing pet behavior...</p>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-xl shadow-md p-8 ${className}`}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Activity className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analysis</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchBehaviorAnalysis}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  const chartData = prepareChartData();
  const trendData = prepareTrendData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Mood Forecast */}
      {moodForecast.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-md p-6 border border-purple-100"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold text-gray-900">Mood Forecast</h2>
          </div>
          <div className="space-y-2">
            {moodForecast.map((forecast, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-white rounded-lg border border-purple-200"
              >
                <p className="text-gray-800">{forecast}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Activity Predictions */}
      {activityPrediction.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-md p-6 border border-blue-100"
        >
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Activity Predictions</h2>
          </div>
          <div className="space-y-2">
            {activityPrediction.map((prediction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-white rounded-lg border border-blue-200"
              >
                <p className="text-gray-800">{prediction}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Interaction Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Action Frequency Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Activity className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-gray-900">Action Frequency</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="action" stroke="#6b7280" style={{ fontSize: '12px' }} />
                <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="Interactions" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Stats Trend Chart */}
          {trendData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold text-gray-900">Stats Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="interaction" stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="hunger"
                    stroke="#ef4444"
                    strokeWidth={2}
                    name="Hunger"
                  />
                  <Line
                    type="monotone"
                    dataKey="happiness"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Happiness"
                  />
                  <Line
                    type="monotone"
                    dataKey="energy"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Energy"
                  />
                  <Line
                    type="monotone"
                    dataKey="cleanliness"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    name="Cleanliness"
                  />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </div>
      )}

      {/* Empty State */}
      {moodForecast.length === 0 && activityPrediction.length === 0 && chartData.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-md p-8 text-center"
        >
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Behavior Analysis Available</h3>
          <p className="text-gray-600 mb-4">
            {interactionHistory.length === 0
              ? 'Please provide interaction history to analyze pet behavior.'
              : 'Click the button below to analyze behavior.'}
          </p>
          {interactionHistory.length > 0 && (
            <button
              onClick={fetchBehaviorAnalysis}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Analyze Behavior
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default PetBehaviorDashboard;
