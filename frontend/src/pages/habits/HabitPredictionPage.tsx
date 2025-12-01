import React from 'react';
import { HabitPrediction } from '../../features/habits';

export function HabitPredictionPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Habit Predictions</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <HabitPrediction />
        </div>
      </div>
    </div>
  );
}
