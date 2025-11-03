export type GameDifficulty = 'easy' | 'normal' | 'hard';
export type GameResult = {
  score: number;
  coinsEarned: number;
  happinessGain: number;
};

export type GameCompletionHandler = (result: GameResult) => void;

export const minigameService = {
  // Simple scaler to turn score into rewards, can be customized per game
  computeRewards(score: number, difficulty: GameDifficulty = 'normal'): GameResult {
    const diffMultiplier = difficulty === 'easy' ? 1 : difficulty === 'normal' ? 1.5 : 2;
    const coinsEarned = Math.round((score / 100) * 20 * diffMultiplier);
    const happinessGain = Math.min(30, Math.round((score / 100) * 25 * (difficulty === 'hard' ? 1.2 : 1)));
    return { score, coinsEarned, happinessGain };
  },
};


