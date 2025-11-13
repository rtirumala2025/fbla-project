/**
 * GameLeaderboardPanel Component
 * Displays game leaderboard entries
 */
import React from 'react';
import type { GameLeaderboardEntry, GameType } from '../../types/game';

type Props = {
  entries: GameLeaderboardEntry[];
  gameType: GameType;
};

export const GameLeaderboardPanel: React.FC<Props> = ({ entries, gameType }) => {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 capitalize">{gameType} leaderboard</h3>
        <span className="text-xs font-medium text-slate-500">{entries.length} players</span>
      </div>
      <ul className="mt-3 space-y-2 text-sm">
        {entries.length === 0 && (
          <li className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 text-center text-xs text-slate-500">
            Be the first to set a high score today!
          </li>
        )}
        {entries.map((entry, index) => (
          <li
            key={`${entry.user_id}-${index}`}
            className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 shadow-sm"
          >
            <div>
              <p className="font-semibold text-slate-800">
                #{index + 1} • {entry.user_id.slice(0, 6)}…
              </p>
              <p className="text-xs text-slate-500">
                Wins: {entry.total_wins} • Avg:{' '}
                {entry.average_score !== undefined && entry.average_score !== null
                  ? entry.average_score.toFixed(1)
                  : '—'}
              </p>
              {(entry.current_streak ?? 0) > 0 || (entry.daily_streak ?? 0) > 0 ? (
                <p className="text-xs text-emerald-600">
                  Streaks — current: {entry.current_streak ?? 0} / daily: {entry.daily_streak ?? 0}
                </p>
              ) : null}
            </div>
            <span className="text-sm font-semibold text-emerald-600">{entry.best_score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default GameLeaderboardPanel;

