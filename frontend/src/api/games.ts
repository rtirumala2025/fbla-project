/**
 * API client for mini-games feature
 * Handles game sessions, score submission, leaderboards, and rewards
 */
import { apiRequest } from './httpClient';
import type {
  GameLeaderboardResponse,
  GamePlayResponse,
  GameRewardsResponse,
  GameScoreSubmissionPayload,
  GameStartRequestPayload,
  GameStartResponse,
  GameType,
} from '../types/game';

const API_BASE = '/api/games';

export async function startGame(data: GameStartRequestPayload): Promise<GameStartResponse> {
  return apiRequest<GameStartResponse>(`${API_BASE}/start`, {
    method: 'POST',
    body: JSON.stringify({
      game_type: data.gameType,
      preferred_difficulty: data.preferredDifficulty,
      practice_mode: data.practiceMode ?? false,
    }),
  });
}

export async function submitScore(data: GameScoreSubmissionPayload): Promise<GamePlayResponse> {
  return apiRequest<GamePlayResponse>(`${API_BASE}/submit-score`, {
    method: 'POST',
    body: JSON.stringify({
      session_id: data.session_id,
      score: data.score,
      duration_seconds: data.durationSeconds,
      difficulty: data.difficulty,
      metadata: data.metadata,
    }),
  });
}

export async function getGameLeaderboard(gameType: GameType): Promise<GameLeaderboardResponse> {
  return apiRequest<GameLeaderboardResponse>(`${API_BASE}/leaderboard?game_type=${gameType}`);
}

export async function getRewardsSummary(gameType: GameType): Promise<GameRewardsResponse> {
  return apiRequest<GameRewardsResponse>(`${API_BASE}/rewards?game_type=${gameType}`);
}

