/**
 * PetMoodForecast Component
 * Displays AI-powered mood forecast with chart visualization
 */
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { getPetMoodForecast } from '../api/ai';
import type { MoodForecastRequest, MoodForecastResponse } from '../types/ai';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface PetMoodForecastProps {
  petId: string;
  currentStats: {
    hunger?: number;
    happiness?: number;
    energy?: number;
    cleanliness?: number;
    health?: number;
    mood?: string;
  };
  interactionHistory?: Array<{
    action: string;
    timestamp: string;
    pet_stats_before?: Record<string, any>;
    pet_stats_after?: Record<string, any>;
  }>;
  forecastDays?: number;
}

const MOOD_COLORS: Record<string, string> = {
  ecstatic: '#10b981', // green
  happy: '#3b82f6', // blue
  content: '#8b5cf6', // purple
  sleepy: '#f59e0b', // amber
  anxious: '#f97316', // orange
  distressed: '#ef4444', // red
  sad: '#6366f1', // indigo
  moody: '#ec4899', // pink
};

export const PetMoodForecast: React.FC<PetMoodForecastProps> = ({
  petId,
  currentStats,
  interactionHistory = [],
  forecastDays = 7,
}) => {
  const [forecast, setForecast] = useState<MoodForecastResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const request: MoodForecastRequest = {
          pet_id: petId,
          current_stats: currentStats,
          interaction_history: interactionHistory,
          forecast_days: forecastDays,
        };
        const response = await getPetMoodForecast(request);
        setForecast(response);
      } catch (err: any) {
        setError(err.message || 'Failed to load mood forecast');
        console.error('Error fetching mood forecast:', err);
      } finally {
        setLoading(false);
      }
    };

    if (petId && currentStats) {
      fetchForecast();
    }
  }, [petId, forecastDays]);

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
          <span className="font-semibold">Error Loading Forecast</span>
        </div>
        <p className="mt-2 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!forecast || forecast.forecast.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Mood Forecast</h3>
        <p className="text-sm text-slate-600">No forecast data available</p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = forecast.forecast.map((entry) => ({
    date: new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: entry.predicted_mood,
    confidence: entry.confidence * 100,
    fullDate: entry.date,
  }));

  // Calculate average confidence
  const avgConfidence = forecast.forecast.reduce((sum, entry) => sum + entry.confidence, 0) / forecast.forecast.length;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Mood Forecast
        </h3>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>{forecastDays} days</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="h-64" style={{ minHeight: '256px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                domain={[0, 100]}
                label={{ value: 'Confidence %', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                formatter={(value: number, name: string, props: any) => {
                  if (name === 'confidence') {
                    return [`${value.toFixed(1)}%`, 'Confidence'];
                  }
                  return [props.payload.mood, 'Mood'];
                }}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="confidence"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 4, fill: '#6366f1' }}
                name="Confidence"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">Average Confidence:</span>
          <span className="font-semibold text-slate-900">{(avgConfidence * 100).toFixed(1)}%</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {forecast.forecast.slice(0, 4).map((entry, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-200 p-3 bg-slate-50"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <span
                  className="text-xs px-2 py-1 rounded-full font-semibold text-white"
                  style={{ backgroundColor: MOOD_COLORS[entry.predicted_mood] || '#6b7280' }}
                >
                  {entry.predicted_mood}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2">{entry.reasoning}</p>
              <div className="mt-1 text-xs text-slate-500">
                Confidence: {(entry.confidence * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>

        {forecast.forecast.length > 4 && (
          <details className="mt-2">
            <summary className="text-sm text-indigo-600 cursor-pointer hover:text-indigo-700">
              View all {forecast.forecast.length} forecast entries
            </summary>
            <div className="mt-2 space-y-2">
              {forecast.forecast.slice(4).map((entry, idx) => (
                <div key={idx + 4} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-700">
                      {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-semibold text-white"
                      style={{ backgroundColor: MOOD_COLORS[entry.predicted_mood] || '#6b7280' }}
                    >
                      {entry.predicted_mood}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{entry.reasoning}</p>
                  <div className="mt-1 text-xs text-slate-500">
                    Confidence: {(entry.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

export default PetMoodForecast;
