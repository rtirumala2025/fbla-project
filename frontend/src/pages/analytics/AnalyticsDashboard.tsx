/**
 * AnalyticsDashboard Page
 * Analytics dashboard with charts and insights
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ExpensePieChart from '../../components/analytics/ExpensePieChart';
import TrendChart from '../../components/analytics/TrendChart';
import { DailyChallengeCard } from '../../components/minigames/DailyChallengeCard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../contexts/ToastContext';
import { fetchSnapshot, exportReports } from '../../api/analytics';
import type { AnalyticsSnapshot, SnapshotNotification, SnapshotSummary, TrendSeries } from '../../types/analytics';

export const AnalyticsDashboard: React.FC = () => {
  const toast = useToast();
  const [snapshot, setSnapshot] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isLoadingRef = useRef(false);

  const loadSnapshot = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      const response = await fetchSnapshot();
      setSnapshot(response);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load analytics snapshot', error);
      
      // Determine user-friendly error message
      let errorMessage = 'Unable to load analytics';
      if (error?.message) {
        if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
          errorMessage = 'Unable to connect to analytics server. Please check your connection or try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
      
      // Don't show toast notification - the error is already displayed prominently on the page
      // This prevents redundant notifications when the error state is visible
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []); // No dependencies - use refs instead

  useEffect(() => {
    loadSnapshot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleExport = async () => {
    if (!snapshot) return;
    setExporting(true);
    try {
      const start = snapshot.weekly_trend.points[0]?.timestamp.slice(0, 10);
      const end = snapshot.weekly_trend.points.at(-1)?.timestamp.slice(0, 10);
      if (!start || !end) {
        throw new Error('Unable to determine date range for export');
      }
      const exportData = await exportReports(start, end);
      const blob = new Blob([exportData.content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = exportData.filename;
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exported successfully.');
    } catch (error: any) {
      console.error('Export failed', error);
      toast.error(error?.message || 'Unable to export CSV');
    } finally {
      setExporting(false);
    }
  };

  const bestInsight = useMemo(() => snapshot?.ai_insights[0] ?? 'Consistent care keeps your pet thriving!', [snapshot]);

  const summaries = snapshot
    ? [snapshot.daily_summary, snapshot.weekly_summary, snapshot.monthly_summary]
    : [];

  const formattedSeries = useMemo(() => {
    if (!snapshot) {
      return {
        weekly: null,
        monthly: null,
        health: null,
      };
    }
    const renameSeries = (series: TrendSeries, label: string): TrendSeries => ({
      ...series,
      label,
    });
    return {
      weekly: renameSeries(snapshot.weekly_trend, 'Weekly Net Coins'),
      monthly: renameSeries(snapshot.monthly_trend, 'Monthly Net Coins'),
      health: renameSeries(snapshot.health_progression, 'Health Average'),
    };
  }, [snapshot]);

  const notificationStyles = (notification: SnapshotNotification) => {
    const base = 'rounded-2xl px-3 py-2 text-sm shadow-soft';
    switch (notification.severity) {
      case 'critical':
        return `${base} border border-rose-200 bg-rose-50 text-rose-700`;
      case 'warning':
        return `${base} border border-amber-200 bg-amber-50 text-amber-700`;
      case 'success':
        return `${base} border border-emerald-200 bg-emerald-50 text-emerald-700`;
      default:
        return `${base} border border-slate-200 bg-slate-50 text-slate-600`;
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!snapshot && !loading) {
    return (
      <div className="min-h-screen bg-cream px-6 py-24">
        <div className="mx-auto max-w-3xl space-y-4">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-rose-700">
            <h2 className="text-xl font-semibold mb-2">Unable to Load Analytics</h2>
            <p className="mb-4">{error || 'The analytics server is not available. Please check your connection or try again later.'}</p>
            <button
              onClick={() => {
                loadSnapshot();
              }}
              className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!snapshot) {
    return null;
  }

  const today = snapshot.end_of_day;

  return (
    <div className="min-h-screen bg-cream px-6 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Care Analytics</h1>
            <p className="text-sm text-slate-500">
              Track your pet&apos;s wellbeing, spending, and care trends with AI-guided insights.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadSnapshot}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary"
            >
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary/90 disabled:opacity-60"
            >
              {exporting ? 'Exporting…' : 'Export Weekly CSV'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-emerald-600">Coins earned</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">{today.coins_earned}</p>
            <p className="text-xs text-emerald-700">Spent: {today.coins_spent}</p>
          </div>
          <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-indigo-600">Happiness gain</p>
            <p className="mt-2 text-2xl font-bold text-indigo-800">+{today.happiness_gain}</p>
            <p className="text-xs text-indigo-700">Health change: {today.health_change}</p>
          </div>
          <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-xs font-semibold uppercase text-amber-600">AI insight</p>
            <p className="mt-2 text-sm text-amber-800">{bestInsight}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {summaries.map((summary: SnapshotSummary) => (
            <div key={summary.period} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase text-slate-500">{summary.period} snapshot</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{summary.net_coins >= 0 ? '+' : ''}{summary.net_coins} coins</p>
              <div className="mt-3 space-y-2 text-xs text-slate-600">
                <p>Avg health: {summary.avg_health.toFixed(0)} • Avg happiness: {summary.avg_happiness.toFixed(0)}</p>
                <p>Games played: {summary.games_played} • Pet actions: {summary.pet_actions}</p>
                {summary.ai_summary && <p className="rounded-2xl bg-slate-50 p-2 text-slate-600">{summary.ai_summary}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {formattedSeries.weekly && <TrendChart series={formattedSeries.weekly} color="#6366f1" />}
          {formattedSeries.health && <TrendChart series={formattedSeries.health} color="#10b981" />}
          {formattedSeries.monthly && <TrendChart series={formattedSeries.monthly} color="#f97316" />}
          <ExpensePieChart expenses={snapshot.expenses} />
        </div>

        <DailyChallengeCard
          challengeText="Keep a positive coin flow for the next three days to unlock a savings bonus."
          progress={`Daily coins: ${today.coins_earned - today.coins_spent} • Games played: ${today.games_played}`}
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <h2 className="text-lg font-semibold text-slate-800">AI Recommendations</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {snapshot.ai_insights.map((insight) => (
              <li key={insight} className="rounded-2xl bg-slate-50 px-3 py-2">
                {insight}
              </li>
            ))}
            {snapshot.ai_insights.length === 0 && <li>No recommendations right now. Keep up the great care!</li>}
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">Recent Notifications</h2>
            <span className="text-xs font-semibold text-slate-500">{snapshot.notifications.length} alerts</span>
          </div>
          <div className="mt-4 space-y-3">
            {snapshot.notifications.length === 0 && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                All clear! No critical changes detected.
              </div>
            )}
            {snapshot.notifications.map((notification) => (
              <div key={notification.id} className={notificationStyles(notification)}>
                <div className="flex items-center justify-between text-xs uppercase tracking-wide">
                  <span>{notification.period_type}</span>
                  <span>{new Date(notification.reference_date).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-sm">{notification.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

