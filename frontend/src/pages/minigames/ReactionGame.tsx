import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { DailyChallengeCard } from '../../components/minigames/DailyChallengeCard';
import { GameLeaderboardPanel } from '../../components/minigames/GameLeaderboardPanel';
import { GameResultOverlay } from '../../components/minigames/GameResultOverlay';
import { GameRewardsSummary } from '../../components/minigames/GameRewardsSummary';
import { useToast } from '../../contexts/ToastContext';
import { usePet } from '../../context/PetContext';
import { useFinancial } from '../../context/FinancialContext';
import { useMiniGameRound } from '../../hooks/useMiniGameRound';
import type { GameDifficulty, GamePlayResponse } from '../../types/game';

type Props = { difficulty?: GameDifficulty };

const confidenceLabel = (confidence: number) => `${Math.round(confidence * 100)}%`;

export const ReactionGame: React.FC<Props> = ({ difficulty: defaultDifficulty = 'easy' }) => {
  const toast = useToast();
  const { refreshPet } = usePet();
  const { refreshBalance } = useFinancial();
  const [waiting, setWaiting] = useState(true);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [reaction, setReaction] = useState<number | null>(null);
  const [result, setResult] = useState<GamePlayResponse | null>(null);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const timeoutRef = useRef<number | null>(null);

  const {
    difficulty,
    aiProfile,
    leaderboard,
    submitScore,
    cycleDifficulty,
    rewardsRefreshKey,
    roundError,
    longestStreak,
    loadingRound,
    startRound,
  } = useMiniGameRound('reaction', defaultDifficulty);

  useEffect(() => {
    if (roundError) {
      toast.error(roundError);
    }
  }, [roundError, toast]);

  const schedule = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    setWaiting(true);
    const delay = 1000 + Math.random() * 2000;
    timeoutRef.current = window.setTimeout(() => {
      setWaiting(false);
      setStartTime(performance.now());
      timeoutRef.current = null;
    }, delay);
  };

  useEffect(() => {
    schedule();
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const submitRound = async (score: number, reactionTime: number) => {
    setSubmitting(true);
    try {
      const response = await submitScore({
        score,
        durationSeconds: Math.max(1, Math.round(reactionTime / 1000)),
        metadata: { reaction: reactionTime },
      });
      setResult(response);
      setScoreHistory((prev) => [...prev, score]);
      toast.success('Lightning reflexes! Rewards incoming.');
      // Refresh contexts to reflect updated balance and pet happiness
      await Promise.all([refreshPet(), refreshBalance()]);
    } catch (error: any) {
      console.error('Reaction submission error', error);
      toast.error(error?.message || 'Failed to submit reaction time');
    } finally {
      setSubmitting(false);
      setReaction(null);
      schedule();
    }
  };

  const onClick = () => {
    if (waiting || submitting || loadingRound) return;
    if (startTime) {
      const reactionTime = performance.now() - startTime;
      setReaction(reactionTime);
      const score = Math.max(10, 100 - Math.min(300, reactionTime) / 3);
      void submitRound(score, reactionTime);
    }
  };

  const challengeGoal = 200;
  const progress = reaction === null ? 0 : Math.max(0, 100 - Math.round((reaction / challengeGoal) * 100));
  const recentAverage = scoreHistory.length
    ? Math.round(scoreHistory.slice(-3).reduce((sum, value) => sum + value, 0) / Math.min(3, scoreHistory.length))
    : 0;

  return (
    <div className="min-h-screen bg-cream px-6 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Reaction Rush</h1>
                <p className="text-sm text-slate-500">Tap as soon as the panel turns green.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500">Difficulty</span>
                <button
                  onClick={() => cycleDifficulty().catch(() => undefined)}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold capitalize text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting || loadingRound}
                >
                  {difficulty}
                </button>
              </div>
            </div>

            <div className="mt-6">
              <motion.button
                className={`flex h-72 w-full items-center justify-center rounded-3xl text-2xl font-bold transition focus:outline-none focus:ring-4 focus:ring-primary ${
                  waiting ? 'bg-amber-300 text-amber-900' : 'bg-emerald-400 text-emerald-950'
                }`}
                whileTap={{ scale: waiting ? 1 : 0.98 }}
                onClick={onClick}
                disabled={submitting}
              >
                {waiting ? 'Wait for green…' : 'Tap now!'}
              </motion.button>
              {reaction !== null && (
                <p className="mt-4 text-center text-sm text-slate-600">Reaction time: {Math.round(reaction)} ms</p>
              )}
            </div>

            <button
              className="mt-4 rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                setReaction(null);
                schedule();
                startRound().catch(() => undefined);
              }}
              disabled={submitting}
            >
              Try again
            </button>
          </div>

          {aiProfile && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-soft">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-emerald-600">Adaptive insights</p>
              <div className="mt-2 space-y-1 text-sm text-emerald-800">
                <p>
                  Recommended difficulty:{' '}
                  <span className="font-semibold capitalize text-emerald-700">{aiProfile.recommended_difficulty}</span>{' '}
                  ({confidenceLabel(aiProfile.confidence)})
                </p>
                <p>
                  Recent average {aiProfile.recent_average.toFixed(1)} • Skill rating {aiProfile.skill_rating.toFixed(1)}
                </p>
                <p>
                  Current streak {aiProfile.current_streak ?? 0} day(s) • Daily streak {aiProfile.daily_streak ?? 0} day(s)
                </p>
                <p>Longest streak: {longestStreak}</p>
              </div>
            </div>
          )}

          <DailyChallengeCard
            challengeText="Keep your reaction below 200ms to uncover hidden streak bonuses."
            progress={`Challenge progress: ${progress}% • Recent average score: ${recentAverage}`}
          />
        </div>

        <div className="lg:w-80 lg:flex-shrink-0 space-y-4">
          <GameLeaderboardPanel entries={leaderboard} gameType="reaction" />
          <GameRewardsSummary gameType="reaction" refreshKey={rewardsRefreshKey} />
        </div>
      </div>

      {result && <GameResultOverlay result={result} onClose={() => setResult(null)} />}
    </div>
  );
};

export default ReactionGame;


