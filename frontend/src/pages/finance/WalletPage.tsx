/**
 * WalletPage
 * Finance wallet page with goals, donations, and allowance
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { claimDailyAllowance, contributeGoal, createGoal, donateCoins, getFinanceSummary } from '../../api/finance';
import type { FinanceSummary, TransactionRecord } from '../../types/finance';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useFinanceRealtime, type FinanceRefreshOptions } from '../../hooks/useFinanceRealtime';
import { BudgetAdvisorAI, type TransactionInput } from '../../components/budget/BudgetAdvisorAI';
import { useAuth } from '../../contexts/AuthContext';

const currencyFormat = (amount: number, currency: string) => `${amount} ${currency}`;

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { currentUser } = useAuth();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [goalForm, setGoalForm] = useState({ name: '', target: '' });
  const [donationForm, setDonationForm] = useState({ recipientId: '', amount: '', message: '' });
  const [contributionInputs, setContributionInputs] = useState<Record<string, string>>({});

  const fetchSummary = useCallback(
    async (options?: FinanceRefreshOptions) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
      }
      try {
        const response = await getFinanceSummary();
        setSummary(response.summary);
      } catch (error: any) {
        console.error('WalletPage: Failed to load finance summary', error);
        // Don't show toast - error is already displayed on the page
        // The API will fallback to mock data automatically
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [], // No dependencies - prevents re-creation
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useFinanceRealtime(fetchSummary);

  const notifications = useMemo(() => summary?.notifications ?? [], [summary]);

  const handleClaimAllowance = async () => {
    if (!summary?.daily_allowance_available) {
      toast.info('Daily allowance already claimed.');
      return;
    }
    try {
      setSubmitting(true);
      const response = await claimDailyAllowance();
      setSummary(response.summary);
      toast.success(`Allowance claimed! +${response.summary.allowance_amount} ${response.summary.currency}`);
    } catch (error: any) {
      console.error('WalletPage: allowance claim failed', error);
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
      const response = await createGoal({ name: name.trim(), target_amount: parsedTarget });
      setSummary(response.summary);
      setGoalForm({ name: '', target: '' });
      toast.success('Goal created!');
    } catch (error: any) {
      console.error('WalletPage: failed to create goal', error);
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
      const response = await contributeGoal(goalId, { amount });
      setSummary(response.summary);
      setContributionInputs((prev) => ({ ...prev, [goalId]: '' }));
      toast.success('Contribution recorded!');
    } catch (error: any) {
      console.error('WalletPage: failed to contribute', error);
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
      const response = await donateCoins({
        recipient_id: recipientId.trim(),
        amount: parsedAmount,
        message: message.trim() || undefined,
      });
      setSummary(response.summary);
      setDonationForm({ recipientId: '', amount: '', message: '' });
      toast.success('Donation sent!');
    } catch (error: any) {
      console.error('WalletPage: donation failed', error);
      toast.error(error.message || 'Unable to send donation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto flex max-w-5xl items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="min-h-screen bg-cream">
        <div className="mx-auto max-w-4xl rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-700">
          <p>Wallet data unavailable. Please try refreshing the page.</p>
          <button
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
            onClick={() => fetchSummary()}
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalGoals = summary.goals.length;
  const activeGoals = summary.goals.filter((goal) => goal.status === 'active');
  const completedGoals = summary.goals.filter((goal) => goal.status === 'completed');

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

  return (
    <div className="min-h-screen bg-cream pb-16">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
          <button
            onClick={() => fetchSummary()}
            className="flex items-center gap-2 rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 hover:border-indigo-400 hover:text-indigo-700"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <header className="mb-12 rounded-3xl bg-white p-8 shadow-soft">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-4xl font-black text-charcoal">Wallet Overview</h1>
              <p className="mt-2 text-lg text-gray-600">
                Track your allowance, donations, and savings goals in one place.
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
            <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-6">
              <div className="flex items-center gap-3 text-indigo-700">
                <Bell className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Notifications</h2>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-indigo-700">
                {notifications.map((note) => (
                  <li key={note} className="flex items-start gap-2">
                    <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </header>

        <section className="mb-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-charcoal">
                <PiggyBank className="h-5 w-5 text-emerald-500" />
                Daily Allowance
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                +{summary.allowance_amount} {summary.currency}
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Claim your daily allowance reward to keep your pet pampered. Allowance resets every 24 hours.
            </p>
            <button
              onClick={handleClaimAllowance}
              disabled={!summary.daily_allowance_available || submitting}
              className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-emerald-600 hover:to-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {summary.daily_allowance_available ? 'Claim Allowance' : 'Allowance Already Claimed'}
            </button>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-charcoal">
                <Gift className="h-5 w-5 text-rose-500" />
                Share Coins
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Donations sent {summary.donation_total}
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Send coins to friends so their pets stay happy too. Share kindness responsibly!
            </p>
            <form onSubmit={handleDonation} className="mt-5 space-y-3">
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
        </section>

        <section className="rounded-3xl bg-white p-7 shadow-soft">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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

          <form onSubmit={handleCreateGoal} className="mt-6 grid gap-3 md:grid-cols-[2fr_1fr_auto]">
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
            <p className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-600">
              No goals yet. Create one to start saving!
            </p>
          ) : (
            <div className="mt-6 space-y-4">
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

        {/* Budget Advisor AI Section */}
        {budgetAdvisorTransactions.length > 0 && (
          <section className="mt-12 rounded-3xl bg-white p-7 shadow-soft">
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
              onAnalysisComplete={(analysis) => {
                console.log('Budget analysis completed:', analysis);
              }}
              onError={(error) => {
                console.error('Budget analysis error:', error);
                toast.error(`Budget analysis failed: ${error}`);
              }}
              autoFetch={true}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default WalletPage;

