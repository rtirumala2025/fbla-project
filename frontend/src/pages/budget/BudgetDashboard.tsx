import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useAIAssistant } from '../../contexts/AIAssistantContext';
import { useToast } from '../../contexts/ToastContext';
import { getTransactions, type DateRange } from '../../api/finance';
import SummaryCard from '../../components/budget/SummaryCard';
import Charts from '../../components/budget/Charts';
import TransactionTable from '../../components/budget/TransactionTable';
import { claimDailyAllowance, contributeGoal, createGoal, donateCoins, getFinanceSummary } from '../../api/finance';
import type { FinanceSummary, TransactionRecord } from '../../types/finance';
import { useFinanceRealtime, type FinanceRefreshOptions } from '../../hooks/useFinanceRealtime';
import { useFinancial } from '../../context/FinancialContext';
import BudgetAdvisorAI, { type TransactionInput, type BudgetAdvisorAnalysis } from '../../components/budget/BudgetAdvisorAI';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  Bell,
  Gift,
  PiggyBank,
  ShieldCheck,
  Target,
  TrendingUp,
  Download,
} from 'lucide-react';

type Filter = {
  range: DateRange;
  category: 'all' | 'food' | 'toys' | 'health' | 'cleaning' | 'income';
  type: 'all' | 'income' | 'expense';
};

const currencyFormat = (amount: number, currency: string) => `${amount} ${currency}`;

export const BudgetDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { refreshBalance } = useFinancial();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>({ range: 'week', category: 'all', type: 'all' });
  const { updateContext, sendMessage, toggleOpen, isOpen } = useAIAssistant();



  // Finance state
  const [summary, setSummary] = useState<FinanceSummary | null>(null);

  // Update AI context
  useEffect(() => {
    updateContext({
      currentPage: 'budget',
      balance: summary?.balance,
    });
  }, [summary, updateContext]);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', target: '' });

  const [contributionInputs, setContributionInputs] = useState<Record<string, string>>({});
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState('');


  // Fetch finance summary
  const fetchSummary = useCallback(
    async (options?: FinanceRefreshOptions) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setFinanceLoading(true);
      }
      try {
        console.log('📊 BudgetDashboard: Fetching finance summary...');
        const response = await getFinanceSummary();
        setSummary(response.summary);
        console.log('✅ BudgetDashboard: Finance summary loaded', {
          balance: response.summary.balance,
          currency: response.summary.currency,
          transactionsCount: response.summary.transactions.length,
          goalsCount: response.summary.goals.length,
        });
      } catch (error: any) {
        console.error('❌ BudgetDashboard: Failed to load finance summary', error);
        // Don't show toast - error is already displayed on the page
        // The API will fallback to mock data automatically
      } finally {
        if (!silent) {
          setFinanceLoading(false);
        }
      }
    },
    [], // No dependencies - prevents re-creation
  );

  // Fetch transactions
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        if (!currentUser) return;
        const data = await getTransactions(currentUser.uid, filter.range);
        setTxns(data);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
        toast.error('Failed to load transactions');
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filter.range]); // toast is stable from context, no need to include in deps

  // Fetch finance summary on mount
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Set up realtime updates for finance data
  useFinanceRealtime(fetchSummary);

  const filtered = useMemo(() => {
    return txns.filter(t => {
      const typeOk = filter.type === 'all' ? true : filter.type === 'income' ? t.amount > 0 : t.amount < 0;
      const catOk = filter.category === 'all' ? true : (t.category || (t.amount < 0 ? 'expense' : 'income')) === filter.category;
      return typeOk && catOk;
    });
  }, [txns, filter]);

  const totals = useMemo(() => {
    const income = filtered.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const expenses = filtered.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income, expenses, net: income - expenses };
  }, [filtered]);

  const pieData = useMemo(() => {
    const cats: Record<string, number> = {};
    filtered.forEach(t => {
      if (t.amount < 0) {
        const cat = t.category || 'other';
        cats[cat] = (cats[cat] || 0) + Math.abs(t.amount);
      }
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const barData = useMemo(() => {
    // Group by day label
    const byDay: Record<string, { income: number; expenses: number }> = {};
    filtered.forEach(t => {
      const d = new Date(t.created_at);
      const label = `${d.getMonth() + 1}/${d.getDate()}`;
      byDay[label] = byDay[label] || { income: 0, expenses: 0 };
      if (t.amount > 0) byDay[label].income += t.amount; else byDay[label].expenses += Math.abs(t.amount);
    });
    return Object.entries(byDay).map(([name, v]) => ({ name, ...v }));
  }, [filtered]);



  const currentMonthSpending = useMemo(() => {
    if (!txns.length) return 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return txns
      .filter(t => new Date(t.created_at) >= startOfMonth && t.amount < 0 && t.transaction_type !== 'transfer')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }, [txns]);

  const budgetLimit = summary?.monthly_budget_limit || 1000;
  const budgetProgress = Math.min((currentMonthSpending / budgetLimit) * 100, 100);
  const isOverBudget = currentMonthSpending > budgetLimit;



  const handleCreateGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { name, target } = goalForm;
    const parsedTarget = Number(target);
    if (!name.trim() || Number.isNaN(parsedTarget) || parsedTarget <= 0) {
      toast.error('Enter a valid goal name and target amount.');
      return;
    }

    try {
      setSubmitting(true);
      console.log('🎯 BudgetDashboard: Creating savings goal...', { name, target: parsedTarget });
      const response = await createGoal({ name: name.trim(), target_amount: parsedTarget });
      setSummary(response.summary);
      setGoalForm({ name: '', target: '' });
      console.log('✅ BudgetDashboard: Goal created successfully', {
        goalId: response.summary.goals[response.summary.goals.length - 1]?.id,
        name: name.trim(),
        target: parsedTarget,
      });
      toast.success('Goal created!');
    } catch (error: any) {
      console.error('❌ BudgetDashboard: failed to create goal', error);
      toast.error(error.message || 'Unable to create goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async (goalId: string) => {
    const amount = Number(contributionInputs[goalId]);
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid contribution amount.');
      return;
    }
    try {
      setSubmitting(true);
      console.log('💵 BudgetDashboard: Contributing to goal...', { goalId, amount });
      const beforeBalance = summary?.balance || 0;
      const response = await contributeGoal(goalId, { amount });
      setSummary(response.summary);
      setContributionInputs((prev) => ({ ...prev, [goalId]: '' }));
      console.log('✅ BudgetDashboard: Contribution recorded successfully', {
        goalId,
        amount,
        balanceBefore: beforeBalance,
        balanceAfter: response.summary.balance,
        goalProgress: response.summary.goals.find((g) => g.id === goalId)?.progress_percent,
      });
      toast.success('Contribution recorded!');
      await refreshBalance();
    } catch (error: any) {
      console.error('❌ BudgetDashboard: failed to contribute', error);
      toast.error(error.message || 'Unable to contribute to goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(budgetInput);
    if (isNaN(amount) || amount < 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }

    try {
      setSubmitting(true);
      const { updateBudgetLimit } = await import('../../api/finance');
      const response = await updateBudgetLimit(amount);
      setSummary(response.summary);
      setIsEditingBudget(false);
      toast.success('Budget limit updated!');
    } catch (error) {
      console.error('Failed to update budget:', error);
      toast.error('Failed to update budget limit');
    } finally {
      setSubmitting(false);
    }
  };



  // Convert transactions to BudgetAdvisorAI format
  const budgetAdvisorTransactions: TransactionInput[] = useMemo(() => {
    if (!summary?.transactions || summary.transactions.length === 0) {
      return [];
    }

    return summary.transactions
      .filter((t) => t.transaction_type === 'expense') // Only analyze expenses
      .map((t: TransactionRecord) => ({
        amount: Math.abs(t.amount),
        category: t.category || 'other',
        date: new Date(t.created_at).toISOString().split('T')[0], // YYYY-MM-DD format
        description: t.description || undefined,
      }));
  }, [summary?.transactions]);

  // Memoize callbacks to prevent infinite loops in BudgetAdvisorAI
  const handleAnalysisComplete = useCallback((analysis: BudgetAdvisorAnalysis) => {
    console.log('✅ BudgetDashboard: Budget analysis completed', analysis);
  }, []);

  const handleAnalysisError = useCallback((error: string) => {
    // Don't show error toast for network/connection errors (backend might not be running)
    if (error.includes('Network Error') || error.includes('ERR_CONNECTION_REFUSED') || error.includes('ECONNREFUSED')) {
      console.warn('⚠️ BudgetDashboard: Budget advisor backend not available (this is expected if backend is not running)');
      return; // Silently ignore connection errors
    }
    console.error('❌ BudgetDashboard: Budget analysis error', error);
    toast.error(`Budget analysis failed: ${error}`);
  }, [toast]);

  const notifications = useMemo(() => summary?.notifications ?? [], [summary]);
  const totalGoals = summary?.goals.length ?? 0;
  const activeGoals = summary?.goals.filter((goal) => goal.status === 'active') ?? [];
  const completedGoals = summary?.goals.filter((goal) => goal.status === 'completed') ?? [];

  // CSV Export
  const exportToCSV = () => {
    if (!filtered || filtered.length === 0) {
      toast.error('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Balance After'];
    const rows = filtered.map(t => [
      new Date(t.created_at).toLocaleDateString(),
      t.transaction_type,
      t.category,
      `"${(t.description || '').replace(/"/g, '""')}"`, // Escape quotes
      t.amount,
      t.balance_after
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${filtered.length} transactions`);
  };

  // Log balance on summary change
  useEffect(() => {
    if (summary) {
      console.log('💰 BudgetDashboard: Finance balance updated', {
        balance: summary.balance,
        currency: summary.currency,
        lifetimeEarned: summary.lifetime_earned,
        lifetimeSpent: summary.lifetime_spent,
        donationTotal: summary.donation_total,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary?.balance, summary?.currency, summary?.lifetime_earned, summary?.lifetime_spent, summary?.donation_total]);

  return (
    <div className="min-h-screen bg-cream px-8 pb-12">
      <div className="max-w-[90vw] mx-auto">
        <header className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-5xl font-black text-charcoal mb-3">Budget Dashboard</h1>
            <p className="text-xl text-gray-600">Track your pet's spending, income, savings, and financial goals</p>
          </div>
          <div className="flex gap-3" role="group" aria-label="Date range selector">
            <button
              onClick={() => {
                sendMessage("How can I save more money?");
                if (!isOpen) toggleOpen();
              }}
              className="px-4 py-3 rounded-pet text-base font-semibold transition-colors bg-indigo-100 text-indigo-700 hover:bg-indigo-200 flex items-center gap-2"
            >
              🤖 Ask AI
            </button>
            {(['today', 'week', 'month', 'all'] as DateRange[]).map(r => (
              <button
                key={r}
                onClick={() => setFilter(prev => ({ ...prev, range: r }))}
                className={`px-6 py-3 rounded-pet text-base font-semibold transition-colors ${filter.range === r
                  ? 'bg-primary text-white shadow-soft'
                  : 'bg-white border border-gray-200 text-charcoal hover:bg-gray-50'
                  }`}
              >
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>
        </header>

        {/* Financial Overview Section */}
        {summary && (
          <section className="mb-12 rounded-3xl bg-white p-8 shadow-soft">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-charcoal mb-2">Financial Overview</h2>
                <p className="text-lg text-gray-600">
                  Manage your balance, allowance, donations, and savings goals
                </p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-center">
                <p className="text-sm font-semibold text-amber-700">Current Balance</p>
                <p className="mt-1 text-3xl font-black text-amber-600">
                  {currencyFormat(summary.balance, summary.currency)}
                </p>
                <p className="mt-1 text-xs text-amber-600">
                  Lifetime earned {summary.lifetime_earned} • Spent {summary.lifetime_spent}
                </p>
              </div>
            </div>




            {/* Monthly Budget Control */}
            <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isOverBudget ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Monthly Budget</h3>
                    <p className="text-sm text-gray-500">
                      Spent {currencyFormat(currentMonthSpending, summary.currency)} of {currencyFormat(budgetLimit, summary.currency)} limit
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setBudgetInput(budgetLimit.toString());
                    setIsEditingBudget(true);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                >
                  Edit Limit
                </button>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 w-full bg-gray-100 rounded-full overflow-hidden mb-4">
                <div
                  className={`absolute top-0 left-0 h-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : budgetProgress > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  style={{ width: `${budgetProgress}%` }}
                />
              </div>

              {isEditingBudget && (
                <form onSubmit={handleUpdateBudget} className="flex gap-3 items-center mt-4 bg-gray-50 p-4 rounded-xl">
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Set new limit..."
                    min="0"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingBudget(false)}
                    className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-200 rounded-lg"
                  >
                    Cancel
                  </button>
                </form>
              )}
            </div>


          </section>
        )}

        {/* Savings Goals Section */}
        {summary && (
          <section className="mb-12 rounded-3xl bg-white p-7 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-semibold text-charcoal">
                  <Target className="h-6 w-6 text-indigo-500" />
                  Savings Goals
                </h2>
                <p className="text-sm text-gray-600">
                  Create milestones and contribute coins to unlock dream rewards for your pet.
                </p>
              </div>
              <div className="flex gap-6 text-sm text-gray-600">
                <span>Total goals: {totalGoals}</span>
                <span>Active: {activeGoals.length}</span>
                <span>Completed: {completedGoals.length}</span>
              </div>
            </div>

            <form onSubmit={handleCreateGoal} className="mb-6 grid gap-3 md:grid-cols-[2fr_1fr_auto]">
              <input
                type="text"
                value={goalForm.name}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Goal name (e.g., Luxury Pet Bed)"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <input
                type="number"
                min={1}
                value={goalForm.target}
                onChange={(event) => setGoalForm((prev) => ({ ...prev, target: event.target.value }))}
                placeholder="Target amount"
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Goal
              </button>
            </form>

            {summary.goals.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
                No goals yet. Create one to start saving!
              </p>
            ) : (
              <div className="space-y-4">
                {summary.goals.map((goal) => {
                  const progressLabel = `${goal.current_amount} / ${goal.target_amount} ${summary.currency}`;
                  return (
                    <div
                      key={goal.id}
                      className="rounded-2xl border border-gray-200 bg-slate-50 p-5 shadow-inner"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-charcoal">{goal.name}</h3>
                          <p className="text-xs uppercase tracking-wide text-gray-500">
                            Status: {goal.status}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-indigo-600">{progressLabel}</span>
                      </div>

                      <div className="mt-3 h-3 w-full rounded-full bg-white">
                        <div
                          className={`h-3 rounded-full ${goal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                          style={{ width: `${goal.progress_percent}%` }}
                        />
                      </div>

                      {goal.status === 'active' && (
                        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                          <input
                            type="number"
                            min={1}
                            value={contributionInputs[goal.id] ?? ''}
                            onChange={(event) =>
                              setContributionInputs((prev) => ({
                                ...prev,
                                [goal.id]: event.target.value,
                              }))
                            }
                            placeholder="Contribution amount"
                            className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 md:max-w-xs"
                          />
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleContribute(goal.id)}
                            className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Contribute
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Budget Advisor AI Section */}
        {summary && budgetAdvisorTransactions.length > 0 && (
          <section className="mb-12 rounded-3xl bg-white p-7 shadow-soft">
            <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold text-charcoal">
              <TrendingUp className="h-6 w-6 text-indigo-500" />
              Budget Advisor AI
            </h2>
            <p className="mb-6 text-sm text-gray-600">
              Get AI-powered insights into your spending patterns and receive personalized budget recommendations.
            </p>
            <BudgetAdvisorAI
              transactions={budgetAdvisorTransactions}
              monthlyBudget={summary.lifetime_earned > 0 ? Math.floor(summary.lifetime_earned / 12) : undefined}
              userId={currentUser?.uid}
              onAnalysisComplete={handleAnalysisComplete}
              onError={handleAnalysisError}
              autoFetch={true}
            />
          </section>
        )}

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          <SummaryCard title="Total Income" amount={Math.round(totals.income)} icon={<span>💰</span>} />
          <SummaryCard title="Total Expenses" amount={Math.round(totals.expenses)} icon={<span>🧾</span>} />
          <SummaryCard title="Net Savings" amount={Math.round(totals.net)} icon={<span>📈</span>} />
        </div>

        {/* Loading state for finance data */}
        {financeLoading && (
          <div className="mb-10 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-pet p-8 mb-10 shadow-soft" aria-label="Filters">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
            <h3 className="text-2xl font-semibold text-charcoal">Filter Transactions</h3>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
              title="Export filtered transactions to CSV"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
          <div className="flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-3">
              <label className="text-base font-medium text-gray-700" htmlFor="type">Type</label>
              <select
                id="type"
                className="border border-gray-200 rounded-pet px-4 py-2.5 bg-white text-charcoal text-base focus:ring-2 focus:ring-primary focus:border-primary"
                value={filter.type}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as Filter['type'] }))}
              >
                <option value="all">All</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-base font-medium text-gray-700" htmlFor="category">Category</label>
              <select
                id="category"
                className="border border-gray-200 rounded-pet px-4 py-2.5 bg-white text-charcoal text-base focus:ring-2 focus:ring-primary focus:border-primary"
                value={filter.category}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value as Filter['category'] }))}
              >
                {['all', 'food', 'toys', 'health', 'cleaning', 'income'].map(c => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div role="status" aria-live="polite" className="text-center py-12">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              Loading transactions…
            </div>
          </div>
        ) : error ? (
          <div role="alert" className="bg-red-50 border border-red-200 rounded-pet p-4 text-red-700">
            {error}
          </div>
        ) : (
          <>
            <Charts pieData={pieData} barData={barData} />
            <div className="mt-10">
              <TransactionTable transactions={filtered} />
            </div>
          </>
        )}
      </div>
    </div >
  );
};

export default BudgetDashboard;


