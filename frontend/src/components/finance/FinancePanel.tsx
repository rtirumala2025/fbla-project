/**
 * FinancePanel Component
 * Displays financial summary, transactions, and leaderboard
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { getFinanceSummary, claimDailyAllowance } from '../../api/finance';
import type { FinanceResponse, FinanceSummary } from '../../types/finance';
import { useToast } from '../../contexts/ToastContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useFinanceRealtime, type FinanceRefreshOptions } from '../../hooks/useFinanceRealtime';

const formatAmount = (value: number, currency: string) => `${value} ${currency}`;

export const FinancePanel: React.FC = () => {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingAllowance, setClaimingAllowance] = useState(false);
  const toast = useToast();

  const fetchSummary = useCallback(
    async (options?: FinanceRefreshOptions) => {
      const silent = options?.silent ?? false;
      if (!silent) {
        setLoading(true);
      }
      try {
        setError(null);
        const response: FinanceResponse = await getFinanceSummary();
        setSummary(response.summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load finance data.';
        setError(message);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]); // fetchSummary is memoized with useCallback, so this is safe

  useFinanceRealtime(fetchSummary);

  const currency = summary?.currency ?? 'coins';

  const recentIncome = useMemo(() => {
    if (!summary) return 0;
    return summary.transactions
      .filter((tx) => tx.transaction_type === 'income' && dayjs(tx.created_at).isAfter(dayjs().subtract(7, 'day')))
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [summary]);

  const handleClaimAllowance = useCallback(async () => {
    if (!summary || !summary.daily_allowance_available) {
      toast.info('Allowance already claimed!');
      return;
    }
    try {
      setClaimingAllowance(true);
      const response = await claimDailyAllowance();
      setSummary(response.summary);
      toast.success(`Allowance claimed! +${response.summary.allowance_amount} ${response.summary.currency}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to claim allowance.';
      toast.error(message);
    } finally {
      setClaimingAllowance(false);
    }
  }, [summary, toast]);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-amber-200 bg-amber-50">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <h3 className="text-lg font-semibold">Finance data unavailable</h3>
        <p className="mt-2 text-sm">{error}</p>
        <button
          className="mt-4 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-red-700"
          onClick={() => fetchSummary()}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Financial Snapshot</h2>
          <p className="text-sm text-slate-500">
            Track earnings, spending, and leaderboard positioning for your pet care economy.
          </p>
        </div>
        <button
          className="self-start rounded-md border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
          onClick={() => fetchSummary()}
        >
          Refresh
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Balance</p>
          <p className="mt-2 text-2xl font-bold text-amber-800">{formatAmount(summary.balance, currency)}</p>
          <p className="mt-1 text-xs text-amber-700">
            Earned {formatAmount(summary.lifetime_earned, currency)} • Spent{' '}
            {formatAmount(summary.lifetime_spent, currency)}
          </p>
        </div>

        <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-600">Today&apos;s Spending</p>
          <p className="mt-2 text-2xl font-bold text-sky-800">{formatAmount(summary.expenses_today, currency)}</p>
          <p className="mt-1 text-xs text-sky-700">
            Income today {formatAmount(summary.income_today, currency)} • Last 7 days{' '}
            {formatAmount(recentIncome, currency)} earned
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Recommendations</p>
          <ul className="mt-2 space-y-1 text-xs text-emerald-700">
            {summary.recommendations.map((tip) => (
              <li key={tip}>• {tip}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Daily allowance</p>
          <p className="mt-1 text-sm text-indigo-700">
            Claim {formatAmount(summary.allowance_amount, currency)} once per day to keep your pet thriving.
          </p>
        </div>
        <button
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={handleClaimAllowance}
          disabled={!summary.daily_allowance_available || claimingAllowance}
        >
          {summary.daily_allowance_available ? 'Claim Allowance' : 'Already Claimed'}
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent Transactions</h3>
            <span className="text-xs font-medium text-slate-500">
              Showing {summary.transactions.length} of recent history
            </span>
          </div>
          <ul className="mt-3 space-y-3 text-sm">
            {summary.transactions.map((transaction) => (
              <li key={transaction.id} className="rounded-md border border-slate-100 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">{transaction.category}</span>
                  <span
                    className={`font-semibold ${
                      transaction.transaction_type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {transaction.transaction_type === 'income' ? '+' : '-'}
                    {transaction.amount} {currency}
                  </span>
                </div>
                {transaction.description && (
                  <p className="mt-1 text-xs text-slate-600">{transaction.description}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  {dayjs(transaction.created_at).format('MMM D, h:mm A')}
                </p>
              </li>
            ))}
            {summary.transactions.length === 0 && (
              <li className="rounded-md border border-slate-100 bg-white p-3 text-center text-xs text-slate-500">
                No transactions yet. Complete daily care tasks or visit the shop!
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Leaderboard</h3>
            <span className="text-xs font-medium text-slate-500">Top savers this week</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {summary.leaderboard.map((entry) => (
              <li key={entry.user_id} className="flex items-center justify-between rounded-md bg-white p-3 shadow-sm">
                <div>
                  <p className="font-semibold text-slate-800">
                    #{entry.rank} • {entry.user_id.slice(0, 6)}…
                  </p>
                  <p className="text-xs text-slate-500">Care score: {entry.care_score}</p>
                </div>
                <span className="text-sm font-semibold text-amber-600">
                  {formatAmount(entry.balance, currency)}
                </span>
              </li>
            ))}
            {summary.leaderboard.length === 0 && (
              <li className="rounded-md border border-slate-100 bg-white p-3 text-center text-xs text-slate-500">
                Leaderboard will appear once players begin earning coins.
              </li>
            )}
          </ul>
        </section>
      </div>

      {summary.budget_warning && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <strong>Budget warning:</strong> {summary.budget_warning}
        </div>
      )}

      {summary.notifications.length > 0 && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-white/80 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Notifications</h4>
          <ul className="mt-2 space-y-1 text-xs text-indigo-700">
            {summary.notifications.map((note) => (
              <li key={note}>• {note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

