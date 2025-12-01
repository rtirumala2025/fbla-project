/**
 * Leaderboard Component
 * Displays friend leaderboard with different metrics (XP, coins, achievements)
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { getLeaderboard, type LeaderboardResponse, type LeaderboardMetric } from '../../api/social';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardResponse | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<LeaderboardMetric>('xp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeaderboard = async (metric: LeaderboardMetric) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLeaderboard(metric, 20);
      setLeaderboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(selectedMetric);
  }, [selectedMetric]);

  const metrics: { id: LeaderboardMetric; label: string; icon: React.ReactNode }[] = [
    { id: 'xp', label: 'Experience Points', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'coins', label: 'Coins', icon: <Medal className="w-4 h-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
        {error}
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No leaderboard data available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Selector */}
      <div className="flex gap-2 flex-wrap">
        {metrics.map((metric) => (
          <button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedMetric === metric.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {metric.icon}
            {metric.label}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboardData.entries.map((entry, index) => (
          <LeaderboardEntry key={entry.user_id} entry={entry} rank={entry.rank} />
        ))}
      </div>
    </div>
  );
}

function LeaderboardEntry({ entry, rank }: { entry: any; rank: number }) {
  const getRankIcon = () => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };

  const getRankColor = () => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-200';
    if (rank === 2) return 'bg-gray-50 border-gray-200';
    if (rank === 3) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-gray-200';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`flex items-center justify-between p-4 rounded-lg border ${getRankColor()} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10">
          {getRankIcon()}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{entry.display_name}</p>
          <p className="text-sm text-gray-500">
            {entry.metric_value.toLocaleString()} {entry.metric === 'xp' ? 'XP' : entry.metric === 'coins' ? 'coins' : 'achievements'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium text-gray-700">
          {entry.total_xp.toLocaleString()} XP
        </p>
        <p className="text-xs text-gray-500">
          {entry.total_coins.toLocaleString()} coins
        </p>
      </div>
    </motion.div>
  );
}
