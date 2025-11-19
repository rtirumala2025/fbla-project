import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DailyChallengeCard } from '../../components/minigames/DailyChallengeCard';
import { GameLeaderboardPanel } from '../../components/minigames/GameLeaderboardPanel';
import { GameResultOverlay } from '../../components/minigames/GameResultOverlay';
import { GameRewardsSummary } from '../../components/minigames/GameRewardsSummary';
import { useToast } from '../../contexts/ToastContext';
import { usePet } from '../../context/PetContext';
import { useFinancial } from '../../context/FinancialContext';
import { useMiniGameRound } from '../../hooks/useMiniGameRound';
import type { GameDifficulty, GamePlayResponse } from '../../types/game';

const icons = ['🐾', '🦴', '🪄', '🪁', '🍖', '🎾', '🧸', '🍪', '🪙', '💎'];

const difficultyLengths: Record<GameDifficulty, number> = {
  easy: 4,
  normal: 6,
  hard: 8,
};

const previewDurationMs = 2500;

const confidenceLabel = (confidence: number) => `${Math.round(confidence * 100)}%`;

export const MemoryMatchGame: React.FC = () => {
  const toast = useToast();
  const { refreshPet } = usePet();
  const { refreshBalance } = useFinancial();
  const startTimeRef = useRef<number>(performance.now());
  const previewTimeoutRef = useRef<number | null>(null);

  const [sequence, setSequence] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [previewing, setPreviewing] = useState(true);
  const [mistakes, setMistakes] = useState(0);
  const [result, setResult] = useState<GamePlayResponse | null>(null);
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
  } = useMiniGameRound('memory', 'easy');

  useEffect(() => {
    if (roundError) {
      toast.error(roundError);
    }
  }, [roundError, toast]);

  const generateSequence = useCallback((length: number) => {
    const shuffled = [...icons].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, length);
  }, []);

  const resetGame = useCallback(
    (requestNewRound = false) => {
      if (previewTimeoutRef.current) {
        window.clearTimeout(previewTimeoutRef.current);
      }

      const length = difficultyLengths[difficulty];
      setSequence(generateSequence(length));
      setActiveIndex(0);
      setMistakes(0);
      setPreviewing(true);
      startTimeRef.current = performance.now();
      previewTimeoutRef.current = window.setTimeout(() => setPreviewing(false), previewDurationMs);

      if (requestNewRound) {
        startRound().catch(() => undefined);
      }
    },
    [difficulty, generateSequence, startRound],
  );

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => () => {
    if (previewTimeoutRef.current) {
      window.clearTimeout(previewTimeoutRef.current);
    }
  }, []);

  const submitRound = useCallback(
    async (score: number) => {
      setSubmitting(true);
      const durationSeconds = Math.max(1, Math.round((performance.now() - startTimeRef.current) / 1000));

      try {
        const response = await submitScore({
          score,
          durationSeconds,
          metadata: { mistakes, sequenceLength: sequence.length },
        });
        setResult(response);
        setScoreHistory((prev) => [...prev, score]);
        toast.success('Pattern remembered! Rewards unlocked.');
        // Refresh contexts to reflect updated balance and pet happiness
        await Promise.all([refreshPet(), refreshBalance()]);
      } catch (error: any) {
        console.error('Memory game submission failed', error);
        toast.error(error?.message || 'Could not submit memory game score');
      } finally {
        setSubmitting(false);
        resetGame();
      }
    },
    [mistakes, resetGame, sequence.length, submitScore, toast, refreshPet, refreshBalance],
  );

  const handleGuess = (icon: string) => {
    if (previewing || submitting || loadingRound) return;

    if (icon === sequence[activeIndex]) {
      if (activeIndex + 1 === sequence.length) {
        const accuracy = 1 - mistakes / Math.max(1, sequence.length);
        const timeBonus = Math.max(0, 30 - Math.round((performance.now() - startTimeRef.current) / 1000));
        const score = Math.min(100, Math.round(accuracy * 70 + timeBonus));
        void submitRound(score);
      } else {
        setActiveIndex((value) => value + 1);
      }
    } else {
      setMistakes((value) => value + 1);
      toast.error('Oops! Wrong symbol.');
    }
  };

  const challengeGoal = sequence.length || 1;
  const challengeProgress = sequence.length === 0 ? 0 : Math.round(Math.min(100, (activeIndex / challengeGoal) * 100));
  const recentAverage = scoreHistory.length
    ? Math.round(scoreHistory.slice(-3).reduce((sum, value) => sum + value, 0) / Math.min(3, scoreHistory.length))
    : 0;

  const previewContent = useMemo(
    () => (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/80 p-4 text-2xl">
        {sequence.map((icon, index) => (
          <span key={index}>{icon}</span>
        ))}
      </div>
    ),
    [sequence],
  );

  return (
    <div className="min-h-screen bg-cream px-6 pb-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Memory Match</h1>
                <p className="text-sm text-slate-500">Memorise the sequence and tap the icons in order.</p>
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

            <div className="mt-4 space-y-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Step {previewing ? 0 : activeIndex} / {sequence.length}
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                  Mistakes {mistakes}
                </div>
                {loadingRound && (
                  <div className="rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                    Syncing AI difficulty…
                  </div>
                )}
              </div>

              {previewing ? (
                <div>
                  <p className="mb-2 text-sm font-semibold text-indigo-600">Memorise this pattern!</p>
                  {previewContent}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-3">
                  {icons.slice(0, 8).map((icon) => (
                    <button
                      key={icon}
                      className="flex h-20 items-center justify-center rounded-2xl border border-slate-200 bg-white text-2xl transition hover:border-primary hover:text-primary"
                      onClick={() => handleGuess(icon)}
                      disabled={submitting}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => resetGame(true)}
                  disabled={submitting}
                >
                  Restart sequence
                </button>
                <button
                  className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90"
                  onClick={() => !previewing && void submitRound(Math.max(20, 100 - mistakes * 8))}
                  disabled={submitting || previewing}
                >
                  Finish early
                </button>
              </div>
            </div>
          </div>

          {aiProfile && (
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50/80 p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">Adaptive insights</p>
              <div className="mt-2 space-y-1 text-sm text-indigo-900">
                <p>
                  Recommended difficulty:{' '}
                  <span className="font-semibold capitalize text-indigo-700">{aiProfile.recommended_difficulty}</span>{' '}
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
            challengeText={`Complete the sequence without mistakes to reveal a hidden achievement.`}
            progress={`Progress: ${challengeProgress}% • Accuracy so far: ${sequence.length === 0 ? 0 : Math.round(((activeIndex - mistakes) / Math.max(1, activeIndex || 1)) * 100)}% • Recent average score: ${recentAverage}`}
          />
        </div>

        <div className="lg:w-80 lg:flex-shrink-0 space-y-4">
          <GameLeaderboardPanel entries={leaderboard} gameType="memory" />
          <GameRewardsSummary gameType="memory" refreshKey={rewardsRefreshKey} />
        </div>
      </div>

      {result && <GameResultOverlay result={result} onClose={() => setResult(null)} />}
    </div>
  );
};

export default MemoryMatchGame;

