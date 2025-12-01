/**
 * Financial Literacy Simulator Component
 * Interactive financial scenarios for learning financial literacy
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, BookOpen, ArrowRight } from 'lucide-react';
import { apiRequest } from '../../api/httpClient';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

type ScenarioType = 'loan' | 'investment' | 'budgeting' | 'savings';

interface ScenarioOption {
  option_id: string;
  label: string;
  description: string;
  financial_impact: {
    income_change: number;
    expense_change: number;
    savings_change: number;
    debt_change: number;
  };
  risk_level: 'low' | 'medium' | 'high';
  time_horizon: 'short' | 'medium' | 'long';
}

interface Scenario {
  scenario_id: string;
  title: string;
  description: string;
  scenario_type: ScenarioType;
  initial_situation: {
    income: number;
    expenses: number;
    savings: number;
    debt: number;
  };
  options: ScenarioOption[];
  learning_objectives: string[];
  concepts_covered: string[];
  generated_at?: string;
}

interface Evaluation {
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
  evaluated_at?: string;
  scenario_id?: string;
}

export function FinanceSimulator() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedScenarioType, setSelectedScenarioType] = useState<ScenarioType>('loan');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const scenarioTypes: { id: ScenarioType; name: string; description: string }[] = [
    { id: 'loan', name: 'Loan Decisions', description: 'Learn about student loans, car loans, and personal loans' },
    { id: 'investment', name: 'Investment Planning', description: 'Explore stocks, savings accounts, and retirement planning' },
    { id: 'budgeting', name: 'Budget Management', description: 'Practice monthly budget planning and expense management' },
    { id: 'savings', name: 'Savings Strategies', description: 'Learn about emergency funds, goal-based savings, and compound interest' },
  ];

  const generateScenario = async (type: ScenarioType) => {
    try {
      setLoading(true);
      setError(null);
      setEvaluation(null);
      setSelectedOption(null);

      const response = await apiRequest<Scenario>('/api/finance-sim/scenario', {
        method: 'POST',
        body: JSON.stringify({
          scenario_type: type,
          user_context: null, // Can be enhanced with actual user context
        }),
      });

      setScenario(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate scenario');
    } finally {
      setLoading(false);
    }
  };

  const evaluateDecision = async (optionId: string) => {
    if (!scenario) return;

    try {
      setLoading(true);
      setError(null);

      const response = await apiRequest<Evaluation>('/api/finance-sim/evaluate', {
        method: 'POST',
        body: JSON.stringify({
          scenario_id: scenario.scenario_id,
          user_decision: {
            selected_option_id: optionId,
          },
          scenario_context: scenario,
        }),
      });

      setEvaluation(response);
      setSelectedOption(optionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to evaluate decision');
    } finally {
      setLoading(false);
    }
  };

  const handleNewScenario = () => {
    setScenario(null);
    setEvaluation(null);
    setSelectedOption(null);
    generateScenario(selectedScenarioType);
  };

  useEffect(() => {
    // Auto-generate initial scenario
    generateScenario(selectedScenarioType);
  }, []);

  if (loading && !scenario) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Scenario Type Selector */}
      {!scenario && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {scenarioTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setSelectedScenarioType(type.id);
                generateScenario(type.id);
              }}
              className={`p-4 rounded-lg border-2 transition-all ${
                selectedScenarioType === type.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h3 className="font-semibold text-gray-900 mb-1">{type.name}</h3>
              <p className="text-sm text-gray-600">{type.description}</p>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {scenario && !evaluation && (
          <motion.div
            key="scenario"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Scenario Header */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{scenario.title}</h2>
              <p className="text-gray-700 whitespace-pre-line">{scenario.description}</p>
            </div>

            {/* Initial Situation */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Your Current Situation</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Income</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${scenario.initial_situation.income.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Expenses</p>
                  <p className="text-lg font-semibold text-red-600">
                    ${scenario.initial_situation.expenses.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Savings</p>
                  <p className="text-lg font-semibold text-blue-600">
                    ${scenario.initial_situation.savings.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Debt</p>
                  <p className="text-lg font-semibold text-orange-600">
                    ${scenario.initial_situation.debt.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Choose Your Option</h3>
              <div className="space-y-3">
                {scenario.options.map((option) => (
                  <OptionCard
                    key={option.option_id}
                    option={option}
                    onClick={() => evaluateDecision(option.option_id)}
                    loading={loading}
                  />
                ))}
              </div>
            </div>

            {/* Learning Objectives */}
            <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Learning Objectives
              </h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {scenario.learning_objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}

        {evaluation && scenario && (
          <motion.div
            key="evaluation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Evaluation Header */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Decision Evaluation</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Score:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {(evaluation.evaluation_score * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <p className="text-gray-700">{evaluation.overall_assessment}</p>
            </div>

            {/* Immediate Impact */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Immediate Impact</h3>
              <p className="text-gray-700 mb-2">{evaluation.immediate_impact.financial_change}</p>
              <p className="text-sm text-gray-600">{evaluation.immediate_impact.new_balance}</p>
            </div>

            {/* Feedback */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Feedback
              </h3>
              <p className="text-gray-700">{evaluation.feedback}</p>
            </div>

            {/* Long-term Consequences */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Long-term Consequences</h3>
              <div className="space-y-2">
                {evaluation.long_term_consequences.map((consequence, index) => (
                  <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-700">{consequence}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Lessons Learned */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Lessons Learned</h3>
              <div className="space-y-2">
                {evaluation.lessons_learned.map((lesson, index) => (
                  <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-gray-700">{lesson}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Recommendations</h3>
              <div className="space-y-2">
                {evaluation.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-gray-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New Scenario Button */}
            <button
              onClick={handleNewScenario}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              Try Another Scenario
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OptionCard({
  option,
  onClick,
  loading,
}: {
  option: ScenarioOption;
  onClick: () => void;
  loading: boolean;
}) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={loading}
      className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-all disabled:opacity-50"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{option.label}</h4>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(option.risk_level)}`}>
          {option.risk_level} risk
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{option.description}</p>
      <div className="flex flex-wrap gap-2 text-xs">
        {option.financial_impact.income_change !== 0 && (
          <span className="px-2 py-1 bg-green-50 text-green-700 rounded">
            Income: {option.financial_impact.income_change > 0 ? '+' : ''}
            ${option.financial_impact.income_change.toLocaleString()}
          </span>
        )}
        {option.financial_impact.expense_change !== 0 && (
          <span className="px-2 py-1 bg-red-50 text-red-700 rounded">
            Expenses: {option.financial_impact.expense_change > 0 ? '+' : ''}
            ${option.financial_impact.expense_change.toLocaleString()}
          </span>
        )}
        {option.financial_impact.savings_change !== 0 && (
          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
            Savings: {option.financial_impact.savings_change > 0 ? '+' : ''}
            ${option.financial_impact.savings_change.toLocaleString()}
          </span>
        )}
        {option.financial_impact.debt_change !== 0 && (
          <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded">
            Debt: {option.financial_impact.debt_change > 0 ? '+' : ''}
            ${option.financial_impact.debt_change.toLocaleString()}
          </span>
        )}
      </div>
    </motion.button>
  );
}
