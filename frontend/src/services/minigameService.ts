import { getGameLeaderboard, getRewardsSummary, startGame, submitScore } from '../api/games';
import { supabase } from '../lib/supabase';
import type {
  GameDifficulty,
  GameLeaderboardEntry,
  GamePlayResponse,
  GameRewardsResponse,
  GameScoreSubmissionPayload,
  GameStartRequestPayload,
  GameStartResponse,
  GameType,
} from '../types/game';

export type GameCompletionHandler = (result: GamePlayResponse) => void;

async function getAuthToken(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new Error('Authentication required to play mini-games.');
  }
  return token;
}

const difficultyOrder: GameDifficulty[] = ['easy', 'normal', 'hard'];

function recommendDifficulty(previousScores: number[]): GameDifficulty {
  if (previousScores.length === 0) return 'easy';
  const recent = previousScores.slice(-3);
  const avg = recent.reduce((sum, value) => sum + value, 0) / recent.length;
  if (avg >= 85) return 'hard';
  if (avg >= 60) return 'normal';
  return 'easy';
}

const computeRewards = (score: number, difficulty: GameDifficulty) => {
  const multiplier = difficulty === 'hard' ? 1.5 : difficulty === 'normal' ? 1.2 : 1;
  const coinsEarned = Math.round((score / 10) * multiplier);
  const happinessGain = Math.min(25, Math.round((score / 4) * multiplier));
  return {
    score,
    coinsEarned,
    happinessGain,
  };
};

export type GameResult = ReturnType<typeof computeRewards>;

export const minigameService = {
  async startRound(params: GameStartRequestPayload): Promise<GameStartResponse> {
    const token = await getAuthToken();
    return await startGame(
      {
        gameType: params.gameType,
        preferredDifficulty: params.preferredDifficulty,
        practiceMode: params.practiceMode ?? false,
      },
      { token },
    );
  },

  async submitResult(params: GameScoreSubmissionPayload & { gameType: GameType }): Promise<GamePlayResponse> {
    const token = await getAuthToken();
    let sessionId = params.session_id;
    let finalDifficulty = params.difficulty;

    if (!sessionId) {
      const round = await startGame(
        {
          gameType: params.gameType,
          preferredDifficulty: params.difficulty,
          practiceMode: false,
        },
        { token },
      );
      sessionId = round.session_id;
      finalDifficulty = finalDifficulty ?? round.difficulty;
    }

    return await submitScore(
      {
        session_id: sessionId,
        score: params.score,
        durationSeconds: params.durationSeconds,
        difficulty: finalDifficulty,
        metadata: params.metadata,
      },
      { token },
    );
  },

  async fetchLeaderboard(gameType: GameType): Promise<GameLeaderboardEntry[]> {
    const token = await getAuthToken();
    const response = await getGameLeaderboard(gameType, { token });
    return response.entries;
  },

  async fetchRewards(gameType: GameType): Promise<GameRewardsResponse> {
    const token = await getAuthToken();
    return await getRewardsSummary(gameType, { token });
  },

  suggestDifficulty(history: number[]): GameDifficulty {
    return recommendDifficulty(history);
  },

  cycleDifficulty(current: GameDifficulty): GameDifficulty {
    const index = difficultyOrder.indexOf(current);
    return difficultyOrder[(index + 1) % difficultyOrder.length];
  },

  computeRewards,
};
