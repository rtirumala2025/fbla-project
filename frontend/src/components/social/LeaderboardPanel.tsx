/**
 * LeaderboardPanel Component
 * Displays social leaderboard with different metrics
 */
import React from 'react';
import { Trophy, Coins, Award, Medal, Crown } from 'lucide-react';
import type { LeaderboardEntry, LeaderboardMetric } from '../../api/social';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[];
  metric: LeaderboardMetric;
  loading?: boolean;
  onMetricChange?: (metric: LeaderboardMetric) => void;
  onViewProfile?: (userId: string) => void;
  currentUserId?: string;
}

const metricLabels: Record<LeaderboardMetric, string> = {
  xp: 'Experience Points',
  coins: 'Coins',
  achievements: 'Achievements',
};

const metricIcons: Record<LeaderboardMetric, React.ReactNode> = {
  xp: <Trophy className="w-4 h-4" />,
  coins: <Coins className="w-4 h-4" />,
  achievements: <Award className="w-4 h-4" />,
};

const getRankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return null;
};

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({
  entries,
  metric,
  loading,
  onMetricChange,
  onViewProfile,
  currentUserId,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 font-medium">No leaderboard data</p>
        <p className="text-sm text-gray-500 mt-2">Add friends to see rankings!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Metric Selector */}
      {onMetricChange && (
        <div className="flex gap-2">
          {(['xp', 'coins', 'achievements'] as LeaderboardMetric[]).map((m) => (
            <button
              key={m}
              onClick={() => onMetricChange(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                metric === m
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {metricIcons[m]}
              <span className="capitalize">{m}</span>
            </button>
          ))}
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2">
        {entries.map((entry, index) => {
          const isCurrentUser = currentUserId && entry.user_id === currentUserId;
          const rankIcon = getRankIcon(entry.rank);

          return (
            <div
              key={entry.user_id}
              className={`bg-white border-2 rounded-xl p-4 transition-colors ${
                isCurrentUser
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-indigo-300'
              } ${onViewProfile ? 'cursor-pointer' : ''}`}
              onClick={() => onViewProfile?.(entry.user_id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex items-center justify-center w-10 h-10">
                    {rankIcon || (
                      <span
                        className={`text-lg font-bold ${
                          entry.rank <= 3 ? 'text-indigo-600' : 'text-gray-500'
                        }`}
                      >
                        #{entry.rank}
                      </span>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {entry.display_name[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900 truncate">{entry.display_name}</h3>
                      {isCurrentUser && (
                        <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {entry.total_xp} XP
                      </span>
                      <span className="flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {entry.total_coins}
                      </span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" />
                        {entry.achievements_count}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-lg font-bold text-indigo-600">{entry.metric_value}</div>
                    <div className="text-xs text-gray-500">{metricLabels[metric]}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

