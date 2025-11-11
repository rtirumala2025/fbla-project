import { useCallback, useEffect, useRef, useState } from 'react';

import { minigameService } from '../services/minigameService';
import type {
  AdaptiveDifficultyProfile,
  GameDifficulty,
  GameLeaderboardEntry,
  GamePlayResponse,
  GameStartResponse,
  GameType,
} from '../types/game';

interface StartRoundOptions {
  preferredDifficulty?: GameDifficulty;
  practiceMode?: boolean;
}

interface SubmitScoreOptions {
  score: number;
  durationSeconds: number;
  metadata?: Record<string, unknown>;
  difficultyOverride?: GameDifficulty;
}

interface MiniGameRoundState {
  difficulty: GameDifficulty;
  preferredDifficulty: GameDifficulty;
  aiProfile: AdaptiveDifficultyProfile | null;
  leaderboard: GameLeaderboardEntry[];
  longestStreak: number;
  loadingRound: boolean;
  roundError: string | null;
  rewardsRefreshKey: number;
  isReady: boolean;
}

const DIFFICULTY_DEFAULT: GameDifficulty = 'easy';

export function useMiniGameRound(
  gameType: GameType,
  initialDifficulty: GameDifficulty = DIFFICULTY_DEFAULT,
): MiniGameRoundState & {
  submitScore: (options: SubmitScoreOptions) => Promise<GamePlayResponse>;
  startRound: (options?: StartRoundOptions) => Promise<GameStartResponse>;
  setPreferredDifficulty: (difficulty: GameDifficulty) => Promise<GameStartResponse>;
  cycleDifficulty: () => Promise<GameStartResponse>;
  refreshLeaderboard: () => Promise<void>;
} {
  const [difficulty, setDifficulty] = useState<GameDifficulty>(initialDifficulty);
  const [preferredDifficulty, setPreferredDifficultyState] = useState<GameDifficulty>(initialDifficulty);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [aiProfile, setAiProfile] = useState<AdaptiveDifficultyProfile | null>(null);
  const [leaderboard, setLeaderboard] = useState<GameLeaderboardEntry[]>([]);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [loadingRound, setLoadingRound] = useState<boolean>(false);
  const [roundError, setRoundError] = useState<string | null>(null);
  const [rewardsRefreshKey, setRewardsRefreshKey] = useState<number>(0);

  const initializedRef = useRef(false);

  useEffect(() => {
    setDifficulty(initialDifficulty);
    setPreferredDifficultyState(initialDifficulty);
  }, [initialDifficulty]);

  const refreshLeaderboard = useCallback(async () => {
    try {
      const entries = await minigameService.fetchLeaderboard(gameType);
      setLeaderboard(entries);
    } catch (error) {
      console.error(`Failed to load ${gameType} leaderboard`, error);
    }
  }, [gameType]);

  const startRound = useCallback(
    async (options?: StartRoundOptions): Promise<GameStartResponse> => {
      const preference = options?.preferredDifficulty ?? preferredDifficulty;
      if (options?.preferredDifficulty && options.preferredDifficulty !== preferredDifficulty) {
        setPreferredDifficultyState(options.preferredDifficulty);
      }

      setLoadingRound(true);
      setRoundError(null);
      try {
        const response = await minigameService.startRound({
          gameType,
          preferredDifficulty: preference,
          practiceMode: options?.practiceMode ?? false,
        });
        setSessionId(response.session_id);
        setAiProfile(response.ai_profile);
        setLongestStreak(response.longest_streak);
        setDifficulty(response.difficulty);
        return response;
      } catch (error: any) {
        const message = error?.message ?? 'Unable to start game round. Please try again.';
        setRoundError(message);
        throw error;
      } finally {
        setLoadingRound(false);
      }
    },
    [gameType, preferredDifficulty],
  );

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void refreshLeaderboard();
    startRound({ preferredDifficulty: initialDifficulty }).catch(() => undefined);
  }, [initialDifficulty, refreshLeaderboard, startRound]);

  const submitScore = useCallback(
    async ({ score, durationSeconds, metadata, difficultyOverride }: SubmitScoreOptions) => {
      const finalDifficulty = difficultyOverride ?? difficulty;
      let activeSessionId = sessionId;
      if (!activeSessionId) {
        const round = await startRound({ preferredDifficulty: finalDifficulty });
        activeSessionId = round.session_id;
      }

      if (!activeSessionId) {
        throw new Error('Unable to start a game session. Please try again.');
      }

      const response = await minigameService.submitResult({
        session_id: activeSessionId,
        gameType,
        score,
        durationSeconds,
        difficulty: finalDifficulty,
        metadata,
      });

      setRewardsRefreshKey((value) => value + 1);

      await refreshLeaderboard();
      startRound().catch(() => undefined);

      return response;
    },
    [difficulty, gameType, refreshLeaderboard, sessionId, startRound],
  );

  const setPreferredDifficulty = useCallback(
    async (nextDifficulty: GameDifficulty) => {
      return await startRound({ preferredDifficulty: nextDifficulty });
    },
    [startRound],
  );

  const cycleDifficulty = useCallback(async () => {
    const next = minigameService.cycleDifficulty(preferredDifficulty);
    return await startRound({ preferredDifficulty: next });
  }, [preferredDifficulty, startRound]);

  return {
    difficulty,
    preferredDifficulty,
    aiProfile,
    leaderboard,
    longestStreak,
    loadingRound,
    roundError,
    rewardsRefreshKey,
    isReady: sessionId !== null,
    submitScore,
    startRound: async (options?: StartRoundOptions) => {
      return await startRound(options);
    },
    setPreferredDifficulty,
    cycleDifficulty,
    refreshLeaderboard,
  };
}
