/**
 * GameRewardsSummary Component
 * Displays game rewards summary with streaks and recent rewards
 */
import React, { useEffect, useState } from 'react';
import { minigameService } from '../../services/minigameService';
import type { GameRewardsResponse, GameType } from '../../types/game';

type Props = {
  gameType: GameType;
  refreshKey?: number;
};

export const GameRewardsSummary: React.FC<Props> = ({ gameType, refreshKey = 0 }) => {
  const [summary, setSummary] = useState<GameRewardsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    minigameService
      .fetchRewards(gameType)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((error) => {
        console.warn('Unable to load rewards summary', error);
        if (active) setSummary(null);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [gameType, refreshKey]);

  return (
    <div className="mt-4 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700">{gameType} rewards</h3>
        {loading && <span className="text-xs font-medium text-emerald-600">Syncing…</span>}
      </div>

      {summary ? (
        <div className="mt-3 space-y-3 text-sm text-emerald-800">
          <div className="flex justify-between">
            <span className="font-semibold text-emerald-700">Current streak</span>
            <span>{summary.streak_days} day(s)</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-emerald-700">Daily streak</span>
            <span>{summary.daily_streak} day(s)</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-emerald-700">Longest streak</span>
            <span>{summary.longest_streak}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-emerald-700">Next streak bonus</span>
            <span>{summary.next_streak_bonus ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-emerald-700">Average score</span>
            <span>{summary.average_score ? `${summary.average_score.toFixed(1)}` : '—'}</span>
          </div>
          {summary.leaderboard_rank && (
            <div className="rounded-2xl bg-white/70 px-3 py-2 text-center text-xs font-semibold text-emerald-700">
              Leaderboard rank • #{summary.leaderboard_rank}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Recent rewards</p>
            <ul className="mt-2 space-y-1 text-xs">
              {summary.recent_rewards.slice(0, 3).map((reward) => (
                <li
                  key={reward.session_id}
                  className="flex items-center justify-between rounded-2xl bg-white/80 px-3 py-2 text-emerald-700"
                >
                  <span>
                    {new Date(reward.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {reward.score} pts
                  </span>
                  <span className="font-semibold text-emerald-600">
                    +{reward.coins}c / +{reward.happiness}☺
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : !loading ? (
        <p className="mt-3 text-xs text-emerald-700">Play a round to unlock streak bonuses and rewards.</p>
      ) : null}
    </div>
  );
};

export default GameRewardsSummary;

