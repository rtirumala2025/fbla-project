import React, { useCallback, useEffect, useRef, useState } from 'react';

import { DailyChallengeCard } from '../../components/minigames/DailyChallengeCard';
import { GameLeaderboardPanel } from '../../components/minigames/GameLeaderboardPanel';
import { GameResultOverlay } from '../../components/minigames/GameResultOverlay';
import { GameRewardsSummary } from '../../components/minigames/GameRewardsSummary';
import { useToast } from '../../contexts/ToastContext';
import { useMiniGameRound } from '../../hooks/useMiniGameRound';
import type { GameDifficulty, GamePlayResponse } from '../../types/game';

const symbols = ['🟦', '🟥', '🟨', '🟩'];

const baseLengthMap: Record<GameDifficulty, number> = {
  easy: 3,
  normal: 4,
  hard: 5,
};

const speedMap: Record<GameDifficulty, number> = {
  easy: 900,
  normal: 700,
  hard: 520,
};

const MAX_LEVEL = 5;

const confidenceLabel = (confidence: number) => `${Math.round(confidence * 100)}%`;

const difficultyLabel: Record<GameDifficulty, string> = {
  easy: 'Lucid Stroll',
  normal: 'Aurora Chase',
  hard: 'Nebula Sprint',
};

type Props = { difficulty?: GameDifficulty };

export const DreamWorld: React.FC<Props> = ({ difficulty: initialDifficulty = 'normal' }) => {
  const toast = useToast();
  const [sequence, setSequence] = useState<number[]>([]);
  const [displayIndex, setDisplayIndex] = useState<number>(-1);
  const [inputIndex, setInputIndex] = useState(0);
  const [level, setLevel] = useState(1);
  const [mistakes, setMistakes] = useState(0);
  const [showing, setShowing] = useState(true);
  const [result, setResult] = useState<GamePlayResponse | null>(null);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const runStartRef = useRef<number>(performance.now());
  const intervalRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);

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
  } = useMiniGameRound('clicker', initialDifficulty);

  useEffect(() => {
    if (roundError) {
      toast.error(roundError);
    }
  }, [roundError, toast]);

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  const playSequence = useCallback(
    (pattern: number[]) => {
      clearTimers();
      if (pattern.length === 0) {
        setShowing(false);
        setDisplayIndex(-1);
        return;
      }

      setShowing(true);
      setDisplayIndex(pattern[0]);
      let current = 0;
      const speed = speedMap[difficulty];
      intervalRef.current = window.setInterval(() => {
        current += 1;
        if (current >= pattern.length) {
          clearTimers();
          hideTimeoutRef.current = window.setTimeout(() => {
            setDisplayIndex(-1);
            setShowing(false);
          }, Math.round(speed / 2));
        } else {
          setDisplayIndex(pattern[current]);
        }
      }, speed);
    },
    [clearTimers, difficulty],
  );

  const prepareLevel = useCallback(
    (nextLevel: number, requestNewRound = false) => {
      const baseLength = baseLengthMap[difficulty];
      const patternLength = baseLength + Math.max(0, nextLevel - 1);
      const pattern = Array.from({ length: patternLength }, () => Math.floor(Math.random() * symbols.length));
      setSequence(pattern);
      setDisplayIndex(-1);
      setInputIndex(0);
      setLevel(nextLevel);
      if (nextLevel === 1) {
        setMistakes(0);
        runStartRef.current = performance.now();
      }
      playSequence(pattern);
      if (requestNewRound) {
        startRound().catch(() => undefined);
      }
    },
    [difficulty, playSequence, startRound],
  );

  useEffect(() => {
    prepareLevel(1);
  }, [prepareLevel]);

  useEffect(
    () => () => {
      clearTimers();
    },
    [clearTimers],
  );

  const finalizeRun = useCallback(
    async (score: number, success: boolean, finalLevel: number, finalMistakes: number) => {
      setSubmitting(true);
      clearTimers();
      const durationSeconds = Math.max(1, Math.round((performance.now() - runStartRef.current) / 1000));
      try {
        const response = await submitScore({
          score,
          durationSeconds,
          metadata: {
            success,
            levelReached: finalLevel,
            mistakes: finalMistakes,
            patternLength: sequence.length,
          },
        });
        setResult(response);
        setScoreHistory((prev) => [...prev, score]);
        toast.success(success ? 'Dream sequence conquered! ✨' : 'Dream sync completed. Rewards unlocked.');
      } catch (error: any) {
        console.error('DreamWorld submission error', error);
        toast.error(error?.message || 'Unable to sync dream rewards.');
      } finally {
        setSubmitting(false);
        prepareLevel(1);
      }
    },
    [clearTimers, prepareLevel, sequence.length, submitScore, toast],
  );

  const handleInput = (index: number) => {
    if (showing || submitting || loadingRound) return;
    if (sequence[inputIndex] === index) {
      if (inputIndex + 1 === sequence.length) {
        if (level >= MAX_LEVEL) {
          const score = Math.max(60, Math.min(100, 90 - mistakes * 4));
          void finalizeRun(score, true, level, mistakes);
        } else {
          toast.success(`Level ${level} cleared!`);
          prepareLevel(level + 1);
        }
      } else {
        setInputIndex((value) => value + 1);
      }
    } else {
      const nextMistakes = mistakes + 1;
      setMistakes(nextMistakes);
      const progress = (level - 1 + inputIndex / Math.max(1, sequence.length)) / MAX_LEVEL;
      const penalty = Math.min(40, nextMistakes * 6);
      const score = Math.max(20, Math.round(progress * 100 - penalty));
      void finalizeRun(score, false, level, nextMistakes);
    }
  };

  const manualFinish = () => {
    const progress = (level - 1 + inputIndex / Math.max(1, sequence.length)) / MAX_LEVEL;
    const score = Math.max(25, Math.round(progress * 100 - mistakes * 5));
    void finalizeRun(score, false, level, mistakes);
  };

  const challengeProgress = Math.round(Math.min(100, ((level - 1) / MAX_LEVEL) * 100));
  const recentAverage = scoreHistory.length
    ? Math.round(scoreHistory.slice(-3).reduce((sum, value) => sum + value, 0) / Math.min(3, scoreHistory.length))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-800 px-6 pb-16 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="rounded-3xl border border-indigo-500/40 bg-indigo-900/40 p-6 shadow-xl backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white">DreamWorld Sequence</h1>
                <p className="text-sm text-indigo-100/80">Echo the shimmering pattern to level up your companion&apos;s dreams.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-indigo-200">Mode</span>
                <button
                  onClick={() => cycleDifficulty().catch(() => undefined)}
                  className="rounded-full border border-indigo-400/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-100 transition hover:border-rose-300 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={submitting || loadingRound}
                >
                  {difficultyLabel[difficulty]}
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {symbols.map((symbol, index) => {
                const isActive = displayIndex === index && showing;
                return (
                  <button
                    key={symbol}
                    onClick={() => handleInput(index)}
                    className={`flex h-32 items-center justify-center rounded-3xl border-2 text-5xl transition ${
                      isActive
                        ? 'border-rose-300 bg-rose-300/30 shadow-[0_0_25px_rgba(249,168,212,0.6)]'
                        : 'border-indigo-400/40 bg-indigo-800/40 hover:border-indigo-200/60'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                    disabled={submitting}
                  >
                    {symbol}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-indigo-100">
              <span className="rounded-2xl border border-indigo-400/50 px-3 py-1">Level {level} / {MAX_LEVEL}</span>
              <span className="rounded-2xl border border-indigo-400/50 px-3 py-1">Step {showing ? 0 : inputIndex + 1} / {sequence.length}</span>
              <span className="rounded-2xl border border-indigo-400/50 px-3 py-1">Mistakes {mistakes}</span>
              {loadingRound && (
                <span className="rounded-2xl border border-rose-400/70 px-3 py-1 text-rose-100">Syncing AI insights…</span>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                className="flex-1 rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => prepareLevel(1, true)}
                disabled={submitting}
              >
                Start new dream
              </button>
              <button
                className="flex-1 rounded-2xl border border-indigo-400/60 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:border-indigo-200 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={manualFinish}
                disabled={submitting}
              >
                Sync progress
              </button>
            </div>
          </div>

          {aiProfile && (
            <div className="rounded-3xl border border-indigo-400/40 bg-indigo-900/40 p-4 shadow-lg backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">Adaptive insights</p>
              <div className="mt-2 space-y-1 text-sm text-indigo-100">
                <p>
                  Recommended difficulty:{' '}
                  <span className="font-semibold capitalize text-white">{aiProfile.recommended_difficulty}</span>{' '}
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
            challengeText="Complete five lucid rounds without a miss to unlock the Aurora badge."
            progress={`Dream depth: ${challengeProgress}% • Mistakes: ${mistakes} • Recent average score: ${recentAverage}`}
          />
        </div>

        <div className="lg:w-80 lg:flex-shrink-0 space-y-4">
          <GameLeaderboardPanel entries={leaderboard} gameType="clicker" />
          <GameRewardsSummary gameType="clicker" refreshKey={rewardsRefreshKey} />
        </div>
      </div>

      {result && <GameResultOverlay result={result} onClose={() => setResult(null)} />}
    </div>
  );
};

export default DreamWorld;


