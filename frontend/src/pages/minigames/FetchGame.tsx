import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

import { GameLeaderboardPanel } from '../../components/minigames/GameLeaderboardPanel';
import { DailyChallengeCard } from '../../components/minigames/DailyChallengeCard';
import { GameResultOverlay } from '../../components/minigames/GameResultOverlay';
import { GameRewardsSummary } from '../../components/minigames/GameRewardsSummary';
import { useToast } from '../../contexts/ToastContext';
import { useMiniGameRound } from '../../hooks/useMiniGameRound';
import type { GameDifficulty, GamePlayResponse } from '../../types/game';

const TOTAL_ROUNDS = 3;

const confidenceLabel = (confidence: number) => `${Math.round(confidence * 100)}%`;

type Props = {
  difficulty?: GameDifficulty;
};

export const FetchGame: React.FC<Props> = ({ difficulty: initialDifficulty = 'easy' }) => {
  const toast = useToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(performance.now());

  const [round, setRound] = useState(1);
  const [hits, setHits] = useState(0);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GamePlayResponse | null>(null);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);

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
  } = useMiniGameRound('fetch', initialDifficulty);

  useEffect(() => {
    if (roundError) {
      toast.error(roundError);
    }
  }, [roundError, toast]);

  const randomize = useCallback(() => {
    const width = containerRef.current?.clientWidth || 300;
    const height = containerRef.current?.clientHeight || 300;
    setTargetPos({ x: Math.random() * (width - 60) + 20, y: Math.random() * (height - 60) + 20 });
  }, []);

  useEffect(() => {
    randomize();
    startTimeRef.current = performance.now();
  }, [randomize]);

  const resetGame = useCallback(
    (requestNewRound = false) => {
      setRound(1);
      setHits(0);
      randomize();
      startTimeRef.current = performance.now();
      if (requestNewRound) {
        startRound().catch(() => undefined);
      }
    },
    [randomize, startRound],
  );

  const finalizeGame = useCallback(
    async (score: number, finalHits: number) => {
      setSubmitting(true);
      const durationSeconds = Math.max(1, Math.round((performance.now() - startTimeRef.current) / 1000));

      try {
        const response = await submitScore({
          score,
          durationSeconds,
          metadata: { hits: finalHits, rounds: TOTAL_ROUNDS },
        });
        setResult(response);
        setScoreHistory((prev) => [...prev, score]);
        toast.success('Rewards delivered! 🎉');
      } catch (error: any) {
        console.error('Failed to submit fetch mini-game result', error);
        toast.error(error?.message || 'Unable to record your score');
      } finally {
        setSubmitting(false);
        resetGame();
      }
    },
    [resetGame, submitScore, toast],
  );

  const handleCatch = useCallback(() => {
    if (submitting || loadingRound) return;

    const nextHits = hits + 1;
    setHits(nextHits);

    if (round >= TOTAL_ROUNDS) {
      const score = Math.min(100, nextHits * 33 + 34);
      void finalizeGame(score, nextHits);
    } else {
      setRound((value) => value + 1);
      randomize();
    }
  }, [finalizeGame, hits, loadingRound, randomize, round, submitting]);

  const challengeProgress = Math.round(Math.min(100, (hits / TOTAL_ROUNDS) * 100));
  const averageRecentScore = scoreHistory.length
    ? Math.round(scoreHistory.slice(-3).reduce((sum, value) => sum + value, 0) / Math.min(3, scoreHistory.length))
    : 0;

  return (
    <div className="min-h-screen bg-cream px-6 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Fetch Frenzy</h1>
                <p className="text-sm text-slate-500">Catch the ball {TOTAL_ROUNDS} times to earn streak bonuses.</p>
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

            <div className="flex gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                Round {round} / {TOTAL_ROUNDS}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                Hits {hits}
              </div>
              {loadingRound && (
                <div className="rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                  Syncing AI difficulty…
                </div>
              )}
            </div>

            <div
              ref={containerRef}
              className="relative h-80 w-full overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-emerald-50"
            >
              <motion.button
                onClick={handleCatch}
                className="absolute flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl text-white shadow-lg"
                animate={{ x: targetPos.x, y: targetPos.y }}
                transition={{ type: 'spring', stiffness: 150, damping: 12 }}
                aria-label="Catch the ball"
                disabled={submitting || loadingRound}
              >
                ⚽
              </motion.button>
            </div>

            <div className="flex gap-3">
              <button
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90"
                onClick={randomize}
                disabled={submitting || loadingRound}
              >
                Throw again
              </button>
              <button
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => resetGame(true)}
                disabled={submitting}
              >
                Reset
              </button>
            </div>
          </div>

          {aiProfile && (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">Adaptive insights</p>
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
                {aiProfile.pet_mood && <p>Pet mood influence: {aiProfile.pet_mood}</p>}
              </div>
            </div>
          )}

          <DailyChallengeCard
            challengeText={`Hit ${TOTAL_ROUNDS} catches with a score above 80 to earn bonus coins.`}
            progress={`Progress: ${challengeProgress}% • Recent average score: ${averageRecentScore}`}
          />
        </div>

        <div className="lg:w-80 lg:flex-shrink-0">
          <GameLeaderboardPanel entries={leaderboard} gameType="fetch" />
          <GameRewardsSummary gameType="fetch" refreshKey={rewardsRefreshKey} />
        </div>
      </div>

      {result && <GameResultOverlay result={result} onClose={() => setResult(null)} />}
    </div>
  );
};

export default FetchGame;


