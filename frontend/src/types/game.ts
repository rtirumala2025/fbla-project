export type GameType = 'fetch' | 'memory' | 'puzzle' | 'reaction' | 'clicker';

export type GameDifficulty = 'easy' | 'normal' | 'hard';

export interface GameReward {
  coins: number;
  happiness: number;
  streak_bonus: number;
  achievement_unlocked?: string | null;
}

export interface AdaptiveDifficultyProfile {
  recommended_difficulty: GameDifficulty;
  confidence: number;
  skill_rating: number;
  recent_average: number;
  current_streak: number;
  daily_streak: number;
  pet_mood?: string | null;
}

export interface GameStartRequestPayload {
  gameType: GameType;
  preferredDifficulty?: GameDifficulty;
  practiceMode?: boolean;
}

export interface GameStartResponse {
  session_id: string;
  game_type: GameType;
  difficulty: GameDifficulty;
  expires_at: string;
  ai_profile: AdaptiveDifficultyProfile;
  longest_streak: number;
}

export interface GameScoreSubmissionPayload {
  session_id?: string;
  score: number;
  durationSeconds: number;
  difficulty?: GameDifficulty;
  metadata?: Record<string, unknown>;
}

export interface GamePlayRequestPayload extends GameScoreSubmissionPayload {
  gameType: GameType;
  difficulty: GameDifficulty;
}

export interface GamePlayResponse {
  reward: GameReward;
  finance: import('./finance').FinanceSummary;
  mood?: string | null;
  message: string;
  streak_days?: number | null;
  daily_streak?: number | null;
}

export interface GameLeaderboardEntry {
  user_id: string;
  game_type: GameType;
  best_score: number;
  total_wins: number;
  last_played_at: string;
  average_score?: number | null;
  current_streak?: number | null;
  daily_streak?: number | null;
}

export interface GameLeaderboardResponse {
  entries: GameLeaderboardEntry[];
}

export interface GameRewardHistory {
  session_id: string;
  game_type: GameType;
  difficulty: GameDifficulty;
  score: number;
  coins: number;
  happiness: number;
  played_at: string;
}

export interface GameRewardsResponse {
  streak_days: number;
  daily_streak: number;
  longest_streak: number;
  next_streak_bonus: number | null;
  leaderboard_rank: number | null;
  average_score: number | null;
  recent_rewards: GameRewardHistory[];
}

