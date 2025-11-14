/**
 * Budget Advisor Form Component
 * AI-powered budget analysis with transaction input
 * FBLA Competition-Level: Enhanced with validation, tooltips, error messages, smooth transitions, mobile-friendly, and logging
 */
import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertCircle, 
  HelpCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Tag,
  Loader2,
  Send
} from 'lucide-react';
import { analyzeBudget, type BudgetAdvisorTransaction, type BudgetAdvisorResponse } from '../../api/finance';
import { useToast } from '../../contexts/ToastContext';
import { useInteractionLogger } from '../../hooks/useInteractionLogger';

interface TransactionFormData {
  amount: string;
  category: string;
  date: string;
  description: string;
}

const CATEGORIES = [
  'food',
  'transport',
  'entertainment',
  'shopping',
  'bills',
  'health',
  'education',
  'other',
];

const MIN_TRANSACTIONS = 1;
const MAX_TRANSACTIONS = 50;
const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 1000000;

export const BudgetAdvisorForm: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionFormData[]>([
    { amount: '', category: 'food', date: new Date().toISOString().split('T')[0], description: '' },
  ]);
  const [monthlyBudget, setMonthlyBudget] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<BudgetAdvisorResponse | null>(null);
  const [errors, setErrors] = useState<Record<number, Record<string, string>>>({});
  const [touched, setTouched] = useState<Record<number, boolean>>({});
  const [showTooltip, setShowTooltip] = useState<{ field: string | null; index: number | null }>({ field: null, index: null });
  const [budgetError, setBudgetError] = useState<string | null>(null);
  const [budgetTouched, setBudgetTouched] = useState(false);
  
  const toast = useToast();
  const { logFormSubmit, logFormValidation, logFormError, logUserAction } = useInteractionLogger('BudgetAdvisorForm');

  const validateTransaction = (transaction: TransactionFormData, index: number): Record<string, string> => {
    const transactionErrors: Record<string, string> = {};
    
    // Validate amount
    if (!transaction.amount.trim()) {
      transactionErrors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(transaction.amount);
      if (isNaN(amount) || amount < MIN_AMOUNT) {
        transactionErrors.amount = `Amount must be at least $${MIN_AMOUNT}`;
      } else if (amount > MAX_AMOUNT) {
        transactionErrors.amount = `Amount must be less than $${MAX_AMOUNT.toLocaleString()}`;
      }
    }
    
    // Validate category
    if (!transaction.category || !CATEGORIES.includes(transaction.category)) {
      transactionErrors.category = 'Please select a valid category';
    }
    
    // Validate date
    if (!transaction.date) {
      transactionErrors.date = 'Date is required';
    } else {
      const date = new Date(transaction.date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (isNaN(date.getTime())) {
        transactionErrors.date = 'Invalid date';
      } else if (date > today) {
        transactionErrors.date = 'Date cannot be in the future';
      }
    }
    
    return transactionErrors;
  };

  const validateBudget = (value: string): string | null => {
    if (!value.trim()) {
      return null; // Budget is optional
    }
    const budget = parseFloat(value);
    if (isNaN(budget) || budget < 0) {
      return 'Budget must be a positive number';
    }
    if (budget > MAX_AMOUNT) {
      return `Budget must be less than $${MAX_AMOUNT.toLocaleString()}`;
    }
    return null;
  };

  const handleTransactionChange = (index: number, field: keyof TransactionFormData, value: string) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], [field]: value };
    setTransactions(updated);
    
    setTouched({ ...touched, [index]: true });
    
    if (touched[index]) {
      const transactionErrors = validateTransaction(updated[index], index);
      setErrors({ ...errors, [index]: transactionErrors });
      
      if (transactionErrors[field]) {
        logFormValidation(`transaction_${index}_${field}`, false, transactionErrors[field]);
      } else {
        logFormValidation(`transaction_${index}_${field}`, true);
      }
    }
    
    logUserAction('transaction_input', { index, field, value: value.length });
  };

  const handleBudgetChange = (value: string) => {
    setMonthlyBudget(value);
    setBudgetTouched(true);
    
    if (budgetTouched) {
      const error = validateBudget(value);
      setBudgetError(error);
      if (error) {
        logFormValidation('monthly_budget', false, error);
      } else {
        logFormValidation('monthly_budget', true);
      }
    }
  };

  const handleAddTransaction = () => {
    if (transactions.length >= MAX_TRANSACTIONS) {
      toast.error(`Maximum ${MAX_TRANSACTIONS} transactions allowed`);
      return;
    }
    
    setTransactions([
      ...transactions,
      { amount: '', category: 'food', date: new Date().toISOString().split('T')[0], description: '' },
    ]);
    logUserAction('add_transaction', { count: transactions.length + 1 });
  };

  const handleRemoveTransaction = (index: number) => {
    if (transactions.length <= MIN_TRANSACTIONS) {
      toast.error('At least one transaction is required');
      return;
    }
    
    const updated = transactions.filter((_, i) => i !== index);
    setTransactions(updated);
    
    const updatedErrors = { ...errors };
    delete updatedErrors[index];
    setErrors(updatedErrors);
    
    logUserAction('remove_transaction', { count: updated.length });
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all transactions
    let hasErrors = false;
    const allErrors: Record<number, Record<string, string>> = {};
    
    transactions.forEach((transaction, index) => {
      const transactionErrors = validateTransaction(transaction, index);
      if (Object.keys(transactionErrors).length > 0) {
        allErrors[index] = transactionErrors;
        hasErrors = true;
      }
    });
    
    // Validate budget if provided
    if (monthlyBudget.trim()) {
      const budgetError = validateBudget(monthlyBudget);
      if (budgetError) {
        setBudgetError(budgetError);
        hasErrors = true;
      }
    }
    
    if (hasErrors) {
      setErrors(allErrors);
      setTouched(transactions.reduce((acc, _, i) => ({ ...acc, [i]: true }), {}));
      setBudgetTouched(true);
      logFormError('form_validation', 'Please fix all errors before submitting');
      toast.error('Please fix all errors before submitting');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    const requestData: BudgetAdvisorTransaction[] = transactions.map(t => ({
      amount: parseFloat(t.amount),
      category: t.category,
      date: t.date,
      description: t.description.trim() || undefined,
    }));
    
    const request = {
      transactions: requestData,
      monthly_budget: monthlyBudget.trim() ? parseFloat(monthlyBudget) : undefined,
    };
    
    logFormSubmit(request, false);
    
    try {
      const result = await analyzeBudget(request);
      setAnalysisResult(result);
      
      if (result.status === 'success') {
        logFormSubmit(request, true);
        toast.success('Budget analysis completed successfully!');
      } else {
        throw new Error(result.message || 'Analysis failed');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to analyze budget';
      logFormError('budget_analysis', errorMessage, request);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  }, [transactions, monthlyBudget, toast, logFormSubmit, logFormError]);

  const isFormValid = transactions.every((t, i) => {
    const errors = validateTransaction(t, i);
    return Object.keys(errors).length === 0;
  }) && (!monthlyBudget.trim() || !validateBudget(monthlyBudget));

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-xl font-semibold text-slate-800">Budget Advisor</h2>
          <button
            type="button"
            className="inline-flex items-center"
            onMouseEnter={() => setShowTooltip({ field: 'main', index: null })}
            onMouseLeave={() => setShowTooltip({ field: null, index: null })}
            onFocus={() => setShowTooltip({ field: 'main', index: null })}
            onBlur={() => setShowTooltip({ field: null, index: null })}
            aria-label="Budget Advisor help"
          >
            <HelpCircle className="w-5 h-5 text-slate-400 hover:text-indigo-500 transition-colors" />
          </button>
        </div>
        
        {/* Main tooltip */}
        <AnimatePresence>
          {showTooltip.field === 'main' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700"
            >
              <p className="font-semibold mb-1">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Add your transactions (expenses and income)</li>
                <li>Optionally set a monthly budget</li>
                <li>Get AI-powered insights and recommendations</li>
                <li>Identify spending trends and overspending alerts</li>
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Monthly Budget (Optional) */}
          <div>
            <label htmlFor="monthly-budget" className="block text-sm font-medium text-slate-700 mb-2">
              Monthly Budget (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <DollarSign className="h-5 w-5 text-slate-400" />
              </div>
              <input
                id="monthly-budget"
                type="number"
                step="0.01"
                min="0"
                value={monthlyBudget}
                onChange={(e) => handleBudgetChange(e.target.value)}
                onBlur={() => {
                  setBudgetTouched(true);
                  const error = validateBudget(monthlyBudget);
                  setBudgetError(error);
                }}
                placeholder="Enter monthly budget"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                  budgetTouched && budgetError
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                    : budgetTouched && !budgetError && monthlyBudget.trim()
                    ? 'border-green-500 focus:border-indigo-500 focus:ring-indigo-500/20'
                    : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                }`}
                aria-invalid={budgetTouched && !!budgetError}
                aria-describedby={budgetTouched && budgetError ? 'budget-error' : undefined}
              />
              {budgetTouched && budgetError && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <AlertCircle className="w-5 h-5 text-red-500" aria-hidden="true" />
                </div>
              )}
            </div>
            <AnimatePresence>
              {budgetTouched && budgetError && (
                <motion.p
                  id="budget-error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="mt-1 text-xs text-red-600 font-medium"
                  role="alert"
                >
                  {budgetError}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Transactions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-slate-700">
                Transactions ({transactions.length})
              </label>
              <motion.button
                type="button"
                onClick={handleAddTransaction}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={transactions.length >= MAX_TRANSACTIONS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Transaction
              </motion.button>
            </div>

            <div className="space-y-4">
              {transactions.map((transaction, index) => {
                const transactionErrors = errors[index] || {};
                const isTouched = touched[index];
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 border border-slate-200 rounded-lg bg-slate-50/50"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-sm font-semibold text-slate-700">Transaction {index + 1}</h4>
                      {transactions.length > MIN_TRANSACTIONS && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTransaction(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          aria-label={`Remove transaction ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Amount */}
                      <div>
                        <label htmlFor={`amount-${index}`} className="block text-xs font-medium text-slate-600 mb-1">
                          Amount *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <DollarSign className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            id={`amount-${index}`}
                            type="number"
                            step="0.01"
                            min={MIN_AMOUNT}
                            max={MAX_AMOUNT}
                            value={transaction.amount}
                            onChange={(e) => handleTransactionChange(index, 'amount', e.target.value)}
                            onBlur={() => {
                              setTouched({ ...touched, [index]: true });
                              const transactionErrors = validateTransaction(transaction, index);
                              setErrors({ ...errors, [index]: transactionErrors });
                            }}
                            className={`w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                              isTouched && transactionErrors.amount
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : isTouched && !transactionErrors.amount && transaction.amount
                                ? 'border-green-500 focus:border-indigo-500 focus:ring-indigo-500/20'
                                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                            }`}
                            placeholder="0.00"
                            aria-invalid={isTouched && !!transactionErrors.amount}
                            aria-describedby={isTouched && transactionErrors.amount ? `amount-error-${index}` : undefined}
                          />
                        </div>
                        <AnimatePresence>
                          {isTouched && transactionErrors.amount && (
                            <motion.p
                              id={`amount-error-${index}`}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="mt-1 text-xs text-red-600"
                              role="alert"
                            >
                              {transactionErrors.amount}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Category */}
                      <div>
                        <label htmlFor={`category-${index}`} className="block text-xs font-medium text-slate-600 mb-1">
                          Category *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Tag className="h-4 w-4 text-slate-400" />
                          </div>
                          <select
                            id={`category-${index}`}
                            value={transaction.category}
                            onChange={(e) => handleTransactionChange(index, 'category', e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                              isTouched && transactionErrors.category
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                            }`}
                            aria-invalid={isTouched && !!transactionErrors.category}
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Date */}
                      <div>
                        <label htmlFor={`date-${index}`} className="block text-xs font-medium text-slate-600 mb-1">
                          Date *
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-slate-400" />
                          </div>
                          <input
                            id={`date-${index}`}
                            type="date"
                            value={transaction.date}
                            onChange={(e) => handleTransactionChange(index, 'date', e.target.value)}
                            onBlur={() => {
                              setTouched({ ...touched, [index]: true });
                              const transactionErrors = validateTransaction(transaction, index);
                              setErrors({ ...errors, [index]: transactionErrors });
                            }}
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 transition-all duration-200 ${
                              isTouched && transactionErrors.date
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                                : isTouched && !transactionErrors.date
                                ? 'border-green-500 focus:border-indigo-500 focus:ring-indigo-500/20'
                                : 'border-slate-300 focus:border-indigo-500 focus:ring-indigo-500/20'
                            }`}
                            aria-invalid={isTouched && !!transactionErrors.date}
                            aria-describedby={isTouched && transactionErrors.date ? `date-error-${index}` : undefined}
                          />
                        </div>
                        <AnimatePresence>
                          {isTouched && transactionErrors.date && (
                            <motion.p
                              id={`date-error-${index}`}
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="mt-1 text-xs text-red-600"
                              role="alert"
                            >
                              {transactionErrors.date}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Description (Optional) */}
                      <div>
                        <label htmlFor={`description-${index}`} className="block text-xs font-medium text-slate-600 mb-1">
                          Description (Optional)
                        </label>
                        <input
                          id={`description-${index}`}
                          type="text"
                          value={transaction.description}
                          onChange={(e) => handleTransactionChange(index, 'description', e.target.value)}
                          placeholder="Transaction description"
                          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 focus:ring-indigo-500/20 transition-all duration-200"
                          maxLength={500}
                        />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={!isAnalyzing && isFormValid ? { scale: 1.02 } : {}}
            whileTap={!isAnalyzing && isFormValid ? { scale: 0.98 } : {}}
            disabled={!isFormValid || isAnalyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold rounded-lg shadow hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            aria-label={isFormValid ? "Analyze budget" : "Please fix all errors before submitting"}
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                <span>Analyze Budget</span>
              </>
            )}
          </motion.button>
        </form>

        {/* Analysis Results */}
        <AnimatePresence>
          {analysisResult && analysisResult.status === 'success' && analysisResult.data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="mt-6 p-4 sm:p-6 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-xl"
            >
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">Analysis Results</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <p className="text-xs text-slate-600 mb-1">Total Spending</p>
                  <p className="text-xl font-bold text-slate-900">${analysisResult.data.total_spending.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <p className="text-xs text-slate-600 mb-1">Net Balance</p>
                  <p className={`text-xl font-bold ${analysisResult.data.net_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${analysisResult.data.net_balance.toFixed(2)}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <p className="text-xs text-slate-600 mb-1">Daily Average</p>
                  <p className="text-xl font-bold text-slate-900">${analysisResult.data.average_daily_spending.toFixed(2)}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-indigo-100">
                  <p className="text-xs text-slate-600 mb-1">Top Category</p>
                  <p className="text-xl font-bold text-slate-900 capitalize">
                    {analysisResult.data.top_categories[0] || 'N/A'}
                  </p>
                </div>
              </div>

              {analysisResult.data.overspending_alerts.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-red-700 mb-2">Overspending Alerts</h4>
                  <div className="space-y-2">
                    {analysisResult.data.overspending_alerts.map((alert, i) => (
                      <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm font-medium text-red-900 capitalize">{alert.category}</p>
                        <p className="text-xs text-red-700 mt-1">{alert.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.data.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-indigo-700 mb-2">Recommendations</h4>
                  <ul className="space-y-1">
                    {analysisResult.data.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-indigo-800 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

