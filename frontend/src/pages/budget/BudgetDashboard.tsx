import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { analyticsService, type DateRange } from '../../services/analyticsService';
import SummaryCard from '../../components/budget/SummaryCard';
import Charts from '../../components/budget/Charts';
import TransactionTable from '../../components/budget/TransactionTable';
import { claimDailyAllowance, contributeGoal, createGoal, donateCoins, getFinanceSummary } from '../../api/finance';
import type { FinanceSummary, TransactionRecord } from '../../types/finance';
import { useFinanceRealtime, type FinanceRefreshOptions } from '../../hooks/useFinanceRealtime';
import BudgetAdvisorAI, { type TransactionInput, type BudgetAdvisorAnalysis } from '../../components/budget/BudgetAdvisorAI';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import {
  ArrowLeft,
  Bell,
  Gift,
  PiggyBank,
  RefreshCw,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';

type Filter = {
  range: DateRange;
  category: 'all' | 'food' | 'toys' | 'health' | 'cleaning' | 'income';
  type: 'all' | 'income' | 'expense';
};

const currencyFormat = (amount: number, currency: string) => `${amount} ${currency}`;

export const BudgetDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txns, setTxns] = useState<any[]>([]);
  const [filter, setFilter] = useState<Filter>({ range: 'week', category: 'all', type: 'all' });
  
  // Finance state
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [financeLoading, setFinanceLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [goalForm, setGoalForm] = useState({ name: '', target: '' });
  const [donationForm, setDonationForm] = useState({ recipientId: '', amount: '', message: '' });
  const [contributionInputs, setContributionInputs] = useState<Record<string, string>>({});

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
        const data = await analyticsService.getTransactions(currentUser.uid, filter.range);
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

  // Finance handlers with logging
  const handleClaimAllowance = async () => {
    if (!summary?.daily_allowance_available) {
      toast.info('Daily allowance already claimed.');
      return;
    }
    try {
      setSubmitting(true);
      console.log('💰 BudgetDashboard: Claiming daily allowance...');
      const response = await claimDailyAllowance();
      setSummary(response.summary);
      console.log('✅ BudgetDashboard: Allowance claimed successfully', {
        amount: response.summary.allowance_amount,
        currency: response.summary.currency,
        newBalance: response.summary.balance,
      });
      toast.success(`Allowance claimed! +${response.summary.allowance_amount} ${response.summary.currency}`);
    } catch (error: any) {
      console.error('❌ BudgetDashboard: allowance claim failed', error);
      toast.error(error.message || 'Unable to claim allowance right now.');
    } finally {
      setSubmitting(false);
    }
  };

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
    } catch (error: any) {
      console.error('❌ BudgetDashboard: failed to contribute', error);
      toast.error(error.message || 'Unable to contribute to goal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDonation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const { recipientId, amount, message } = donationForm;
    const parsedAmount = Number(amount);
    if (!recipientId.trim() || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Provide a valid recipient and donation amount.');
      return;
    }
    try {
      setSubmitting(true);
      console.log('🎁 BudgetDashboard: Sending donation...', {
        recipientId: recipientId.trim(),
        amount: parsedAmount,
        message: message.trim() || undefined,
      });
      const beforeBalance = summary?.balance || 0;
      const response = await donateCoins({
        recipient_id: recipientId.trim(),
        amount: parsedAmount,
        message: message.trim() || undefined,
      });
      setSummary(response.summary);
      setDonationForm({ recipientId: '', amount: '', message: '' });
      console.log('✅ BudgetDashboard: Donation sent successfully', {
        recipientId: recipientId.trim(),
        amount: parsedAmount,
        balanceBefore: beforeBalance,
        balanceAfter: response.summary.balance,
        totalDonated: response.summary.donation_total,
      });
      toast.success('Donation sent!');
    } catch (error: any) {
      console.error('❌ BudgetDashboard: donation failed', error);
      toast.error(error.message || 'Unable to send donation.');
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
            {(['today','week','month','all'] as DateRange[]).map(r => (
              <button 
                key={r} 
                onClick={() => setFilter(prev => ({ ...prev, range: r }))} 
                className={`px-6 py-3 rounded-pet text-base font-semibold transition-colors ${
                  filter.range===r
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

            {notifications.length > 0 && (
              <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
                <div className="flex items-center gap-3 text-indigo-700">
                  <Bell className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Notifications</h3>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-indigo-700">
                  {notifications.map((note, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
              {/* Daily Allowance */}
              <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-charcoal">
                    <PiggyBank className="h-5 w-5 text-emerald-500" />
                    Daily Allowance
                  </h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    +{summary.allowance_amount} {summary.currency}
                  </span>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Claim your daily allowance reward to keep your pet pampered. Allowance resets every 24 hours.
                </p>
                <button
                  onClick={handleClaimAllowance}
                  disabled={!summary.daily_allowance_available || submitting}
                  className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {summary.daily_allowance_available ? 'Claim Allowance' : 'Allowance Already Claimed'}
                </button>
              </div>

              {/* Share Coins */}
              <div className="rounded-3xl bg-white border border-gray-200 p-6 shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-charcoal">
                    <Gift className="h-5 w-5 text-rose-500" />
                    Share Coins
                  </h3>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Donations sent {summary.donation_total}
                  </span>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Send coins to friends so their pets stay happy too. Share kindness responsibly!
                </p>
                <form onSubmit={handleDonation} className="space-y-3">
                  <input
                    type="text"
                    value={donationForm.recipientId}
                    onChange={(event) =>
                      setDonationForm((prev) => ({ ...prev, recipientId: event.target.value }))
                    }
                    placeholder="Recipient user ID"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min={1}
                      value={donationForm.amount}
                      onChange={(event) =>
                        setDonationForm((prev) => ({ ...prev, amount: event.target.value }))
                      }
                      placeholder="Amount"
                      className="w-1/2 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                    <input
                      type="text"
                      value={donationForm.message}
                      onChange={(event) =>
                        setDonationForm((prev) => ({ ...prev, message: event.target.value }))
                      }
                      placeholder="Optional message"
                      className="w-1/2 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-rose-600 hover:to-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Send Donation
                  </button>
                </form>
              </div>
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
                          className={`h-3 rounded-full ${
                            goal.status === 'completed' ? 'bg-emerald-500' : 'bg-indigo-500'
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
          <h3 className="text-2xl font-semibold text-charcoal mb-6">Filter Transactions</h3>
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
                {['all','food','toys','health','cleaning','income'].map(c => (
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
    </div>
  );
};

export default BudgetDashboard;


