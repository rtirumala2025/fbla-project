/**
 * ReportView Component
 * Displays filtered analytics reports with charts and data tables
 */
import React, { useMemo } from 'react';
import ExpensePieChart from '../analytics/ExpensePieChart';
import TrendChart from '../analytics/TrendChart';
import type { AnalyticsSnapshot, ReportFilters, TrendSeries } from '../../types/analytics';

interface Props {
  snapshot: AnalyticsSnapshot | null;
  filters: ReportFilters;
  loading?: boolean;
}

export const ReportView: React.FC<Props> = ({ snapshot, filters, loading = false }) => {
  const filteredData = useMemo(() => {
    if (!snapshot) return null;

    // Filter data based on selected metrics
    const data: any = {};

    if (filters.selectedMetrics.includes('coins_earned') || filters.selectedMetrics.length === 0) {
      data.coins_earned = snapshot.daily_summary.coins_earned;
    }
    if (filters.selectedMetrics.includes('coins_spent') || filters.selectedMetrics.length === 0) {
      data.coins_spent = snapshot.daily_summary.coins_spent;
    }
    if (filters.selectedMetrics.includes('net_coins') || filters.selectedMetrics.length === 0) {
      data.net_coins = snapshot.daily_summary.net_coins;
    }
    if (filters.selectedMetrics.includes('games_played') || filters.selectedMetrics.length === 0) {
      data.games_played = snapshot.daily_summary.games_played;
    }
    if (filters.selectedMetrics.includes('pet_actions') || filters.selectedMetrics.length === 0) {
      data.pet_actions = snapshot.daily_summary.pet_actions;
    }
    if (filters.selectedMetrics.includes('happiness_gain') || filters.selectedMetrics.length === 0) {
      data.happiness_gain = snapshot.daily_summary.happiness_gain;
    }
    if (filters.selectedMetrics.includes('health_change') || filters.selectedMetrics.length === 0) {
      data.health_change = snapshot.daily_summary.health_change;
    }

    return data;
  }, [snapshot, filters]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-slate-500">Loading report data...</div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-slate-600">No data available for the selected period.</p>
      </div>
    );
  }

  const showExpenses = filters.selectedMetrics.includes('expenses') || filters.selectedMetrics.length === 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {filteredData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filters.selectedMetrics.includes('coins_earned') && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/70 p-4">
              <p className="text-xs font-semibold uppercase text-emerald-600">Coins Earned</p>
              <p className="mt-2 text-2xl font-bold text-emerald-800">{filteredData.coins_earned || 0}</p>
            </div>
          )}
          {filters.selectedMetrics.includes('coins_spent') && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-xs font-semibold uppercase text-rose-600">Coins Spent</p>
              <p className="mt-2 text-2xl font-bold text-rose-800">{filteredData.coins_spent || 0}</p>
            </div>
          )}
          {filters.selectedMetrics.includes('net_coins') && (
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-4">
              <p className="text-xs font-semibold uppercase text-indigo-600">Net Coins</p>
              <p className="mt-2 text-2xl font-bold text-indigo-800">{filteredData.net_coins || 0}</p>
            </div>
          )}
          {filters.selectedMetrics.includes('games_played') && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-4">
              <p className="text-xs font-semibold uppercase text-amber-600">Games Played</p>
              <p className="mt-2 text-2xl font-bold text-amber-800">{filteredData.games_played || 0}</p>
            </div>
          )}
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {filters.selectedMetrics.length === 0 || filters.selectedMetrics.includes('net_coins') ? (
          <>
            {snapshot.weekly_trend && <TrendChart series={snapshot.weekly_trend} color="#6366f1" />}
            {snapshot.health_progression && <TrendChart series={snapshot.health_progression} color="#10b981" />}
          </>
        ) : null}
        {showExpenses && snapshot.expenses.length > 0 && (
          <ExpensePieChart expenses={snapshot.expenses} />
        )}
      </div>

      {/* Period Summaries */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-500">Daily Summary</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {snapshot.daily_summary.net_coins >= 0 ? '+' : ''}
            {snapshot.daily_summary.net_coins} coins
          </p>
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <p>
              Avg health: {snapshot.daily_summary.avg_health.toFixed(0)} • Avg happiness:{' '}
              {snapshot.daily_summary.avg_happiness.toFixed(0)}
            </p>
            <p>
              Games: {snapshot.daily_summary.games_played} • Actions: {snapshot.daily_summary.pet_actions}
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-500">Weekly Summary</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {snapshot.weekly_summary.net_coins >= 0 ? '+' : ''}
            {snapshot.weekly_summary.net_coins} coins
          </p>
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <p>
              Avg health: {snapshot.weekly_summary.avg_health.toFixed(0)} • Avg happiness:{' '}
              {snapshot.weekly_summary.avg_happiness.toFixed(0)}
            </p>
            <p>
              Games: {snapshot.weekly_summary.games_played} • Actions: {snapshot.weekly_summary.pet_actions}
            </p>
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
          <p className="text-xs font-semibold uppercase text-slate-500">Monthly Summary</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {snapshot.monthly_summary.net_coins >= 0 ? '+' : ''}
            {snapshot.monthly_summary.net_coins} coins
          </p>
          <div className="mt-3 space-y-2 text-xs text-slate-600">
            <p>
              Avg health: {snapshot.monthly_summary.avg_health.toFixed(0)} • Avg happiness:{' '}
              {snapshot.monthly_summary.avg_happiness.toFixed(0)}
            </p>
            <p>
              Games: {snapshot.monthly_summary.games_played} • Actions: {snapshot.monthly_summary.pet_actions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportView;
