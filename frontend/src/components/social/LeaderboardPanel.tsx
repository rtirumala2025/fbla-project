/**
 * LeaderboardPanel Component
 * Displays social leaderboard with different metrics
 */
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { LeaderboardMetric, LeaderboardResponse } from '../../types/social';

const metricLabels: Record<LeaderboardMetric, string> = {
  xp: 'Experience',
  coins: 'Coins',
  achievements: 'Achievements',
};

interface LeaderboardPanelProps {
  data?: LeaderboardResponse | null;
  metric: LeaderboardMetric;
  isLoading: boolean;
  onMetricChange: (metric: LeaderboardMetric) => void;
}

export const LeaderboardPanel = ({ data, metric, isLoading, onMetricChange }: LeaderboardPanelProps) => {
  const entries = data?.entries ?? [];

  const emptyMessage = useMemo(() => {
    if (isLoading) return 'Calculating standings...';
    if (!entries.length) return 'Your social circle is quiet. Add friends to unlock rankings!';
    return null;
  }, [isLoading, entries.length]);

  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Social Leaderboard</h2>
          <p className="text-sm text-slate-500">
            Track how you rank against friends across experience, coins, and achievements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['xp', 'coins', 'achievements'] as LeaderboardMetric[]).map((metricOption) => {
            const active = metricOption === metric;
            return (
              <button
                key={metricOption}
                onClick={() => onMetricChange(metricOption)}
                className={`rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100'
                }`}
              >
                {metricLabels[metricOption]}
              </button>
            );
          })}
        </div>
      </div>

      {emptyMessage ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-8 text-center text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Companion</th>
                <th className="px-4 py-3 text-right">XP</th>
                <th className="px-4 py-3 text-right">Coins</th>
                <th className="px-4 py-3 text-right">Achievements</th>
                <th className="px-4 py-3 text-right">{metricLabels[metric]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <motion.tr
                  key={entry.user_id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-slate-700"
                >
                  <td className="px-4 py-3 font-semibold text-indigo-600">{entry.rank}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{entry.display_name}</div>
                    <div className="text-xs text-slate-500">Pet #{entry.pet_id.slice(0, 6)}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">{entry.total_xp}</td>
                  <td className="px-4 py-3 text-right font-semibold text-amber-600">{entry.total_coins}</td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">{entry.achievements_count}</td>
                  <td className="px-4 py-3 text-right font-semibold text-indigo-600">
                    {entry.metric_value}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default LeaderboardPanel;

