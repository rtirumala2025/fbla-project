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

interface RequestOptions {
  token: string;
}

const headers = (token: string) => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

export async function startGame(
  data: GameStartRequestPayload,
  options: RequestOptions,
): Promise<GameStartResponse> {
  const response = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify({
      game_type: data.gameType,
      preferred_difficulty: data.preferredDifficulty,
      practice_mode: data.practiceMode ?? false,
    }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function submitScore(
  data: GameScoreSubmissionPayload,
  options: RequestOptions,
): Promise<GamePlayResponse> {
  const response = await fetch(`${API_BASE}/submit-score`, {
    method: 'POST',
    headers: headers(options.token),
    body: JSON.stringify({
      session_id: data.session_id,
      score: data.score,
      duration_seconds: data.durationSeconds,
      difficulty: data.difficulty,
      metadata: data.metadata,
    }),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function getGameLeaderboard(
  gameType: GameType,
  options: RequestOptions,
): Promise<GameLeaderboardResponse> {
  const response = await fetch(`${API_BASE}/leaderboard?game_type=${gameType}`, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

export async function getRewardsSummary(
  gameType: GameType,
  options: RequestOptions,
): Promise<GameRewardsResponse> {
  const response = await fetch(`${API_BASE}/rewards?game_type=${gameType}`, {
    method: 'GET',
    headers: headers(options.token),
  });
  if (!response.ok) {
    throw new Error(await response.text());
  }
  return response.json();
}

