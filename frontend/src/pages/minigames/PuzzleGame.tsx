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

type Props = { difficulty?: GameDifficulty };

const originalTiles = ['🐶', '🐱', '🐰', '🐦', '🐶', '🐱', '🐰', '🐦', '⭐'];

const confidenceLabel = (confidence: number) => `${Math.round(confidence * 100)}%`;

export const PuzzleGame: React.FC<Props> = ({ difficulty: defaultDifficulty = 'easy' }) => {
  const toast = useToast();
  const { refreshPet } = usePet();
  const { refreshBalance } = useFinancial();
  const startTimeRef = useRef<number>(performance.now());

  const [tiles, setTiles] = useState(() => [...originalTiles].sort(() => Math.random() - 0.5));
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
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
  } = useMiniGameRound('puzzle', defaultDifficulty);

  useEffect(() => {
    if (roundError) {
      toast.error(roundError);
    }
  }, [roundError, toast]);

  const resetBoard = useCallback(
    (requestNewRound = false) => {
      setTiles([...originalTiles].sort(() => Math.random() - 0.5));
      setSelectedIndex(null);
      setMoves(0);
      startTimeRef.current = performance.now();
      if (requestNewRound) {
        startRound().catch(() => undefined);
      }
    },
    [startRound],
  );

  useEffect(() => {
    resetBoard();
  }, [resetBoard]);

  const submitRound = useCallback(
    async (score: number) => {
      setSubmitting(true);
      const durationSeconds = Math.max(1, Math.round((performance.now() - startTimeRef.current) / 1000));

      try {
        const response = await submitScore({
          score,
          durationSeconds,
          metadata: { moves },
        });
        setResult(response);
        setScoreHistory((prev) => [...prev, score]);
        toast.success('Puzzle complete! Rewards delivered.');
        // Refresh contexts to reflect updated balance and pet happiness
        await Promise.all([refreshPet(), refreshBalance()]);
      } catch (error: any) {
        console.error('Puzzle submission error', error);
        toast.error(error?.message || 'Could not submit puzzle score');
      } finally {
        setSubmitting(false);
        resetBoard();
      }
    },
    [moves, resetBoard, submitScore, toast, refreshPet, refreshBalance],
  );

  const handleSelect = (index: number) => {
    if (submitting || loadingRound) return;

    if (selectedIndex === null) {
      setSelectedIndex(index);
      return;
    }

    const copy = [...tiles];
    [copy[selectedIndex], copy[index]] = [copy[index], copy[selectedIndex]];
    setTiles(copy);
    setSelectedIndex(null);
    setMoves((value) => value + 1);

    if (JSON.stringify(copy) === JSON.stringify(originalTiles)) {
      const score = Math.max(20, 100 - (moves + 1) * 8);
      void submitRound(score);
    }
  };

  const isSolved = useMemo(() => JSON.stringify(tiles) === JSON.stringify(originalTiles), [tiles]);

  const challengeGoal = 12;
  const challengeProgress = Math.round(Math.min(100, (moves / challengeGoal) * 100));
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
                <h1 className="text-2xl font-black text-slate-900">Pattern Puzzle</h1>
                <p className="text-sm text-slate-500">Swap tiles to restore the original companion lineup.</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase text-slate-500">Difficulty</span>
                <button
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold capitalize text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => cycleDifficulty().catch(() => undefined)}
                  disabled={submitting || loadingRound}
                >
                  Difficulty: {difficulty}
                </button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                Moves: {moves}
              </div>
              {isSolved && <span className="text-sm font-semibold text-emerald-600">Solved!</span>}
              {loadingRound && (
                <div className="rounded-2xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary">
                  Syncing AI difficulty…
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              {tiles.map((tile, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(index)}
                  className={`flex h-24 items-center justify-center rounded-2xl border text-3xl transition ${
                    selectedIndex === index ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 bg-white'
                  }`}
                  aria-label={`Tile ${index + 1}`}
                  disabled={submitting}
                >
                  {tile}
                </button>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                className="rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-primary/90"
                onClick={() => resetBoard(true)}
                disabled={submitting}
              >
                Shuffle again
              </button>
              <button
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => !isSolved && void submitRound(Math.max(20, 100 - moves * 8))}
                disabled={submitting}
              >
                Finish early
              </button>
            </div>
          </div>

          {aiProfile && (
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Adaptive insights</p>
              <div className="mt-2 space-y-1 text-sm text-slate-700">
                <p>
                  Recommended difficulty:{' '}
                  <span className="font-semibold capitalize text-slate-900">{aiProfile.recommended_difficulty}</span>{' '}
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
            challengeText={`Solve the puzzle in under ${challengeGoal} moves for a secret achievement.`}
            progress={`Progress: ${challengeProgress}% • Recent average score: ${recentAverage}`}
          />
        </div>

        <div className="lg:w-80 lg:flex-shrink-0 space-y-4">
          <GameLeaderboardPanel entries={leaderboard} gameType="puzzle" />
          <GameRewardsSummary gameType="puzzle" refreshKey={rewardsRefreshKey} />
        </div>
      </div>

      {result && <GameResultOverlay result={result} onClose={() => setResult(null)} />}
    </div>
  );
};

export default PuzzleGame;


