import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  Info,
  Lightbulb,
  DollarSign,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// TypeScript types matching backend schemas
export interface TransactionInput {
  amount: number;
  category: string;
  date: string; // ISO date string (YYYY-MM-DD)
  description?: string;
}

export interface SpendingTrend {
  category: string;
  total_spent: number;
  transaction_count: number;
  average_amount: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  percentage_change: number | null;
}

export interface OverspendingAlert {
  category: string;
  current_spending: number;
  budget_limit: number | null;
  excess_amount: number | null;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

export interface BudgetAdvisorAnalysis {
  total_spending: number;
  total_income: number;
  net_balance: number;
  average_daily_spending: number;
  top_categories: string[];
  trends: SpendingTrend[];
  overspending_alerts: OverspendingAlert[];
  suggestions: string[];
  analysis_period: {
    start: string;
    end: string;
  };
}

export interface BudgetAdvisorResponse {
  status: 'success' | 'error';
  data: BudgetAdvisorAnalysis | null;
  message: string;
}

export interface BudgetAdvisorRequest {
  transactions: TransactionInput[];
  monthly_budget?: number;
  user_id?: string;
}

export interface BudgetAdvisorAIProps {
  /** Transactions to analyze */
  transactions: TransactionInput[];
  /** Optional monthly budget limit */
  monthlyBudget?: number;
  /** Optional user ID for personalization */
  userId?: string;
  /** Callback when analysis completes */
  onAnalysisComplete?: (analysis: BudgetAdvisorAnalysis) => void;
  /** Callback when error occurs */
  onError?: (error: string) => void;
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  /** Custom className */
  className?: string;
}

const BudgetAdvisorAI: React.FC<BudgetAdvisorAIProps> = ({
  transactions,
  monthlyBudget,
  userId,
  onAnalysisComplete,
  onError,
  autoFetch = true,
  className = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<BudgetAdvisorAnalysis | null>(null);

  // Use refs to store callbacks to prevent infinite loops
  const onAnalysisCompleteRef = useRef(onAnalysisComplete);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onAnalysisCompleteRef.current = onAnalysisComplete;
  }, [onAnalysisComplete]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const fetchAnalysis = useCallback(async () => {
    if (!transactions || transactions.length === 0) {
      setError('No transactions provided for analysis');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const request: BudgetAdvisorRequest = {
        transactions,
        monthly_budget: monthlyBudget,
        user_id: userId,
      };

      const response = await apiClient.post<BudgetAdvisorResponse>(
        '/api/budget-advisor/analyze',
        request
      );

      if (response.data.status === 'success' && response.data.data) {
        setAnalysis(response.data.data);
        onAnalysisCompleteRef.current?.(response.data.data);
      } else {
        const errorMessage = response.data.message || 'Failed to analyze budget';
        setError(errorMessage);
        onErrorRef.current?.(errorMessage);
      }
    } catch (err: any) {
      // Handle network errors gracefully (backend might not be running)
      if (err.code === 'ECONNREFUSED' || err.message === 'Network Error' || err.message?.includes('ERR_CONNECTION_REFUSED')) {
        // Backend is not available - this is expected in some environments
        setError(null); // Don't show error for connection refused
        setLoading(false);
        return; // Silently fail - budget advisor is optional
      }
      
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Failed to fetch budget analysis. Please try again.';
      setError(errorMessage);
      onErrorRef.current?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [transactions, monthlyBudget, userId]); // Removed callbacks from dependencies

  // Track last transactions to prevent unnecessary re-fetches
  const lastTransactionsRef = useRef<string>('');

  useEffect(() => {
    if (!autoFetch || !transactions || transactions.length === 0) {
      return;
    }

    // Create a stable key from transactions to detect actual changes
    const transactionsKey = JSON.stringify(
      transactions.map(t => ({ 
        amount: t.amount, 
        category: t.category, 
        date: t.date 
      }))
    );

    // Only fetch if transactions actually changed
    if (lastTransactionsRef.current !== transactionsKey) {
      lastTransactionsRef.current = transactionsKey;
      fetchAnalysis();
    }
  }, [autoFetch, fetchAnalysis, transactions]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  };

  // Render loading state
  if (loading) {
    return (
      <div
        className={`bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center min-h-[400px] ${className}`}
      >
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 font-medium">Analyzing your budget...</p>
        <p className="mt-2 text-sm text-gray-500">This may take a few seconds</p>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-white rounded-xl shadow-md p-8 ${className}`}
      >
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Analysis</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={fetchAnalysis}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Render empty state
  if (!analysis) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`bg-white rounded-xl shadow-md p-8 ${className}`}
      >
        <div className="text-center">
          <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis Available</h3>
          <p className="text-gray-600 mb-4">
            {transactions.length === 0
              ? 'Please provide transactions to analyze your budget.'
              : 'Click the button below to analyze your budget.'}
          </p>
          {transactions.length > 0 && (
            <button
              onClick={fetchAnalysis}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Analyze Budget
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // Helper function to get trend icon
  const getTrendIcon = (trend: SpendingTrend['trend']) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-green-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  // Helper function to get severity color
  const getSeverityColor = (severity: OverspendingAlert['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'low':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Helper function to get severity icon
  const getSeverityIcon = (severity: OverspendingAlert['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'low':
        return <Info className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`space-y-6 ${className}`}
    >
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Total Spending</p>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${analysis.total_spending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Net Balance</p>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <p
            className={`text-2xl font-bold ${
              analysis.net_balance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            ${analysis.net_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Daily Average</p>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${analysis.average_daily_spending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <motion.div
          variants={cardVariants}
          className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600">Analysis Period</p>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-900">
            {new Date(analysis.analysis_period.start).toLocaleDateString()} -{' '}
            {new Date(analysis.analysis_period.end).toLocaleDateString()}
          </p>
        </motion.div>
      </div>

      {/* Spending Trends */}
      {analysis.trends && analysis.trends.length > 0 && (
        <motion.div variants={cardVariants}>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
            Spending Trends
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {analysis.trends.map((trend, index) => (
                <motion.div
                  key={trend.category}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-white rounded-xl shadow-md p-5 border border-gray-100 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 capitalize">{trend.category}</h3>
                    {getTrendIcon(trend.trend)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Spent:</span>
                      <span className="font-medium text-gray-900">
                        ${trend.total_spent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Transactions:</span>
                      <span className="font-medium text-gray-900">{trend.transaction_count}</span>
                    </div>
                    {trend.percentage_change !== null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Change:</span>
                        <span
                          className={`font-medium ${
                            trend.trend === 'increasing'
                              ? 'text-red-600'
                              : trend.trend === 'decreasing'
                              ? 'text-green-600'
                              : 'text-gray-600'
                          }`}
                        >
                          {trend.percentage_change > 0 ? '+' : ''}
                          {trend.percentage_change.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Overspending Alerts */}
      {analysis.overspending_alerts && analysis.overspending_alerts.length > 0 && (
        <motion.div variants={cardVariants}>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-600" />
            Overspending Warnings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {analysis.overspending_alerts.map((alert, index) => (
                <motion.div
                  key={`${alert.category}-${index}`}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className={`rounded-xl shadow-md p-5 border-2 ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getSeverityIcon(alert.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold capitalize">{alert.category}</h3>
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/50">
                          {alert.severity.toUpperCase()}
                        </span>
                      </div>
                      <div className="space-y-1 text-sm mb-3">
                        <div className="flex justify-between">
                          <span>Current:</span>
                          <span className="font-medium">
                            ${alert.current_spending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        {alert.budget_limit && (
                          <div className="flex justify-between">
                            <span>Budget:</span>
                            <span className="font-medium">
                              ${alert.budget_limit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                        {alert.excess_amount && (
                          <div className="flex justify-between">
                            <span>Over by:</span>
                            <span className="font-medium">
                              ${alert.excess_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-3 pt-3 border-t border-current/20">
                        {alert.recommendation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Actionable Suggestions */}
      {analysis.suggestions && analysis.suggestions.length > 0 && (
        <motion.div variants={cardVariants}>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
            Actionable Suggestions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {analysis.suggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-md p-5 border border-yellow-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      <Lightbulb className="w-5 h-5 text-yellow-600" />
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{suggestion}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Refresh Button */}
      <motion.div variants={cardVariants} className="flex justify-end">
        <button
          onClick={fetchAnalysis}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Analysis
        </button>
      </motion.div>
    </motion.div>
  );
};

export default BudgetAdvisorAI;

