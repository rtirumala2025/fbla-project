import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DollarSign, TrendingUp, AlertCircle, Lightbulb } from 'lucide-react';
import apiClient from '../services/apiClient';
import { LoadingSpinner } from './ui/LoadingSpinner';

// TypeScript interfaces matching backend schemas
export interface TransactionHistoryItem {
  amount: number;
  category: string;
  date: string; // ISO format YYYY-MM-DD
  description?: string;
}

export interface ForecastItem {
  month: string; // YYYY-MM format
  predicted_spend: number;
}

export interface BudgetAdviceResponse {
  advice: string;
  forecast: ForecastItem[];
}

export interface BudgetAdvisorProps {
  userId: string;
  transactionHistory: TransactionHistoryItem[];
  className?: string;
}

export const BudgetAdvisor: React.FC<BudgetAdvisorProps> = ({
  userId,
  transactionHistory,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string | null>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);

  const fetchBudgetAdvice = useCallback(async () => {
    if (!transactionHistory || transactionHistory.length === 0) {
      setError('No transaction history provided');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<BudgetAdviceResponse>('/api/ai/budget_advice', {
        user_id: userId,
        transaction_history: transactionHistory,
      });

      setAdvice(response.data.advice);
      setForecast(response.data.forecast);
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
        'Failed to fetch budget advice. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, transactionHistory]);

  useEffect(() => {
    if (transactionHistory && transactionHistory.length > 0) {
      fetchBudgetAdvice();
    }
  }, [fetchBudgetAdvice]);

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center min-h-[400px] ${className}`}>
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 font-medium">Analyzing your budget...</p>
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
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Budget Advice</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchBudgetAdvice}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (!advice && forecast.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-white rounded-xl shadow-md p-8 ${className}`}
      >
        <div className="text-center">
          <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Budget Analysis Available</h3>
          <p className="text-gray-600 mb-4">
            {transactionHistory.length === 0
              ? 'Please provide transaction history to analyze your budget.'
              : 'Click the button below to analyze your budget.'}
          </p>
          {transactionHistory.length > 0 && (
            <button
              onClick={fetchBudgetAdvice}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              Analyze Budget
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Format forecast data for chart
  const chartData = forecast.map((item) => ({
    month: item.month,
    predicted: item.predicted_spend,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`space-y-6 ${className}`}
    >
      {/* Advice Section */}
      {advice && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-md p-6 border border-indigo-100"
        >
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-6 h-6 text-indigo-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-3">AI Budget Advice</h2>
              <p className="text-gray-800 leading-relaxed">{advice}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Forecast Chart */}
      {forecast.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center space-x-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-bold text-gray-900">Spending Forecast</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="month"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => {
                  const date = new Date(value + '-01');
                  return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
                }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${value.toLocaleString()}`}
              />
              <Tooltip
                formatter={(value: number) => [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Predicted Spending']}
                labelFormatter={(label) => {
                  const date = new Date(label + '-01');
                  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                }}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', r: 4 }}
                activeDot={{ r: 6 }}
                name="Predicted Spending"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </motion.div>
  );
};

export default BudgetAdvisor;
