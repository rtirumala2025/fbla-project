/**
 * FinanceSimulator Component
 * Interactive financial literacy simulator with scenarios and decision evaluation
 */
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, ArrowRight, Loader } from 'lucide-react';
import { generateFinanceScenario, evaluateFinanceDecision } from '../api/ai';
import type {
  FinanceScenarioRequest,
  FinanceScenarioResponse,
  DecisionEvaluationRequest,
  DecisionEvaluationResponse,
} from '../types/ai';
import { LoadingSpinner } from './ui/LoadingSpinner';

interface FinanceSimulatorProps {
  userId?: string;
  userContext?: {
    age?: number;
    income?: number;
    savings?: number;
    expenses?: number;
    goals?: string;
  };
}

const SCENARIO_TYPES = [
  { value: 'loan', label: 'Loan Decision', icon: '💰' },
  { value: 'investment', label: 'Investment', icon: '📈' },
  { value: 'budgeting', label: 'Budgeting', icon: '📊' },
  { value: 'savings', label: 'Savings', icon: '💵' },
] as const;

export const FinanceSimulator: React.FC<FinanceSimulatorProps> = ({ userContext }) => {
  const [scenario, setScenario] = useState<FinanceScenarioResponse | null>(null);
  const [evaluation, setEvaluation] = useState<DecisionEvaluationResponse | null>(null);
  const [selectedScenarioType, setSelectedScenarioType] = useState<string>('loan');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateScenario = async (scenarioType: string) => {
    setLoading(true);
    setError(null);
    setEvaluation(null);
    setSelectedOption(null);
    try {
      const request: FinanceScenarioRequest = {
        scenario_type: scenarioType as any,
        user_context: userContext,
      };
      const response = await generateFinanceScenario(request);
      setScenario(response);
      setSelectedScenarioType(scenarioType);
    } catch (err: any) {
      setError(err.message || 'Failed to generate scenario');
      console.error('Error generating scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (optionId: string) => {
    if (!scenario) return;

    setEvaluating(true);
    setError(null);
    try {
      const request: DecisionEvaluationRequest = {
        scenario_id: scenario.scenario_id,
        selected_option_id: optionId,
        scenario_context: scenario,
      };
      const response = await evaluateFinanceDecision(request);
      setEvaluation(response);
      setSelectedOption(optionId);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate decision');
      console.error('Error evaluating decision:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'low':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-300';
      case 'high':
        return 'bg-red-100 text-red-700 border-red-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Scenario Type Selection */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-indigo-600" />
          Financial Literacy Simulator
        </h3>
        <p className="text-sm text-slate-600 mb-4">
          Choose a scenario type to practice financial decision-making:
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {SCENARIO_TYPES.map((type) => (
            <button
              key={type.value}
              onClick={() => handleGenerateScenario(type.value)}
              disabled={loading}
              className={`rounded-xl border-2 p-4 text-center transition-all ${
                selectedScenarioType === type.value
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
              } ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="text-sm font-semibold text-slate-800">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-soft">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-semibold">Error</span>
          </div>
          <p className="mt-2 text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Scenario Display */}
      {scenario && !loading && (
        <div className="space-y-6">
          {/* Scenario Description */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <h4 className="text-lg font-semibold text-slate-800 mb-2">{scenario.title}</h4>
            <p className="text-sm text-slate-600 whitespace-pre-line mb-4">{scenario.description}</p>

            {/* Initial Situation */}
            <div className="rounded-xl bg-slate-50 p-4 mb-4">
              <h5 className="text-sm font-semibold text-slate-700 mb-2">Initial Financial Situation</h5>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div>
                  <span className="text-slate-600">Income:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    ${scenario.initial_situation.income.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Expenses:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    ${scenario.initial_situation.expenses.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Savings:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    ${scenario.initial_situation.savings.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600">Debt:</span>
                  <span className="ml-2 font-semibold text-slate-800">
                    ${scenario.initial_situation.debt.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <h5 className="text-sm font-semibold text-slate-700 mb-3">Available Options</h5>
              {scenario.options.map((option) => (
                <button
                  key={option.option_id}
                  onClick={() => handleSelectOption(option.option_id)}
                  disabled={evaluating || selectedOption === option.option_id}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    selectedOption === option.option_id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50'
                  } ${evaluating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h6 className="font-semibold text-slate-800">{option.label}</h6>
                    <span className={`text-xs px-2 py-1 rounded-full border ${getRiskColor(option.risk_level)}`}>
                      {option.risk_level} risk
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{option.description}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {option.financial_impact.income_change !== 0 && (
                      <div>
                        <span className="text-slate-600">Income:</span>
                        <span
                          className={`ml-1 font-semibold ${
                            option.financial_impact.income_change > 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {option.financial_impact.income_change > 0 ? '+' : ''}
                          ${option.financial_impact.income_change.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {option.financial_impact.expense_change !== 0 && (
                      <div>
                        <span className="text-slate-600">Expenses:</span>
                        <span
                          className={`ml-1 font-semibold ${
                            option.financial_impact.expense_change > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {option.financial_impact.expense_change > 0 ? '+' : ''}
                          ${option.financial_impact.expense_change.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {option.financial_impact.savings_change !== 0 && (
                      <div>
                        <span className="text-slate-600">Savings:</span>
                        <span
                          className={`ml-1 font-semibold ${
                            option.financial_impact.savings_change > 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {option.financial_impact.savings_change > 0 ? '+' : ''}
                          ${option.financial_impact.savings_change.toLocaleString()}
                        </span>
                      </div>
                    )}
                    {option.financial_impact.debt_change !== 0 && (
                      <div>
                        <span className="text-slate-600">Debt:</span>
                        <span
                          className={`ml-1 font-semibold ${
                            option.financial_impact.debt_change > 0 ? 'text-red-600' : 'text-emerald-600'
                          }`}
                        >
                          {option.financial_impact.debt_change > 0 ? '+' : ''}
                          ${option.financial_impact.debt_change.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Learning Objectives */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h5 className="text-sm font-semibold text-slate-700 mb-2">Learning Objectives</h5>
              <ul className="space-y-1">
                {scenario.learning_objectives.map((objective, idx) => (
                  <li key={idx} className="text-xs text-slate-600 flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-600 mt-0.5" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Evaluation Results */}
          {evaluating && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
              </div>
            </div>
          )}

          {evaluation && !evaluating && (
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-6 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-indigo-800 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Decision Evaluation
                </h4>
                <div className="text-sm font-semibold text-indigo-700">
                  Score: {(evaluation.evaluation_score * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-4">
                {/* Immediate Impact */}
                <div className="rounded-xl bg-white p-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Immediate Impact</h5>
                  <p className="text-sm text-slate-600">{evaluation.immediate_impact.financial_change}</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    {evaluation.immediate_impact.new_balance}
                  </p>
                </div>

                {/* Feedback */}
                <div className="rounded-xl bg-white p-4">
                  <h5 className="text-sm font-semibold text-slate-700 mb-2">Feedback</h5>
                  <p className="text-sm text-slate-600">{evaluation.feedback}</p>
                </div>

                {/* Long-term Consequences */}
                {evaluation.long_term_consequences.length > 0 && (
                  <div className="rounded-xl bg-white p-4">
                    <h5 className="text-sm font-semibold text-slate-700 mb-2">Long-term Consequences</h5>
                    <ul className="space-y-1">
                      {evaluation.long_term_consequences.map((consequence, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-indigo-600 mt-0.5" />
                          <span>{consequence}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Lessons Learned */}
                {evaluation.lessons_learned.length > 0 && (
                  <div className="rounded-xl bg-white p-4">
                    <h5 className="text-sm font-semibold text-slate-700 mb-2">Lessons Learned</h5>
                    <ul className="space-y-1">
                      {evaluation.lessons_learned.map((lesson, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5" />
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Recommendations */}
                {evaluation.recommendations.length > 0 && (
                  <div className="rounded-xl bg-white p-4">
                    <h5 className="text-sm font-semibold text-slate-700 mb-2">Recommendations</h5>
                    <ul className="space-y-1">
                      {evaluation.recommendations.map((recommendation, idx) => (
                        <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                          <span className="text-indigo-600 mt-0.5">→</span>
                          <span>{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Overall Assessment */}
                <div className="rounded-xl bg-indigo-100 p-4">
                  <h5 className="text-sm font-semibold text-indigo-800 mb-2">Overall Assessment</h5>
                  <p className="text-sm text-indigo-700">{evaluation.overall_assessment}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FinanceSimulator;
