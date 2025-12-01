/**
 * Tests for minigameService
 */
import { minigameService } from '../../services/minigameService';
import { startGame, submitScore, getGameLeaderboard, getRewardsSummary } from '../../api/games';

// Mock API functions
jest.mock('../../api/games', () => ({
  startGame: jest.fn(),
  submitScore: jest.fn(),
  getGameLeaderboard: jest.fn(),
  getRewardsSummary: jest.fn(),
}));

const mockStartGame = startGame as jest.MockedFunction<typeof startGame>;
const mockSubmitScore = submitScore as jest.MockedFunction<typeof submitScore>;
const mockGetGameLeaderboard = getGameLeaderboard as jest.MockedFunction<typeof getGameLeaderboard>;
const mockGetRewardsSummary = getRewardsSummary as jest.MockedFunction<typeof getRewardsSummary>;

describe('minigameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('startRound', () => {
    it('should start a game round', async () => {
      const mockResponse = {
        session_id: 'session-123',
        difficulty: 'easy',
        ai_profile: {
          difficulty: 'easy',
          adaptive_level: 1,
        },
        longest_streak: 5,
      };

      mockStartGame.mockResolvedValue(mockResponse);

      const result = await minigameService.startRound({
        gameType: 'memory',
        preferredDifficulty: 'easy',
        practiceMode: false,
      });

      expect(result).toEqual(mockResponse);
      expect(mockStartGame).toHaveBeenCalledWith({
        gameType: 'memory',
        preferredDifficulty: 'easy',
        practiceMode: false,
      });
    });

    it('should start round in practice mode', async () => {
      const mockResponse = {
        session_id: 'session-456',
        difficulty: 'easy',
        ai_profile: null,
        longest_streak: 0,
      };

      mockStartGame.mockResolvedValue(mockResponse);

      const result = await minigameService.startRound({
        gameType: 'puzzle',
        preferredDifficulty: 'normal',
        practiceMode: true,
      });

      expect(result).toEqual(mockResponse);
      expect(mockStartGame).toHaveBeenCalledWith({
        gameType: 'puzzle',
        preferredDifficulty: 'normal',
        practiceMode: true,
      });
    });
  });

  describe('submitResult', () => {
    it('should submit score with existing session', async () => {
      const mockResponse = {
        session_id: 'session-123',
        score: 85,
        coins_earned: 10,
        xp_gained: 5,
        difficulty: 'easy',
      };

      mockSubmitScore.mockResolvedValue(mockResponse);

      const result = await minigameService.submitResult({
        session_id: 'session-123',
        gameType: 'memory',
        score: 85,
        durationSeconds: 60,
        difficulty: 'easy',
      });

      expect(result).toEqual(mockResponse);
      expect(mockSubmitScore).toHaveBeenCalledWith({
        session_id: 'session-123',
        score: 85,
        durationSeconds: 60,
        difficulty: 'easy',
        metadata: undefined,
      });
    });

    it('should create session if not provided', async () => {
      const mockStartResponse = {
        session_id: 'new-session',
        difficulty: 'normal',
        ai_profile: null,
        longest_streak: 0,
      };

      const mockSubmitResponse = {
        session_id: 'new-session',
        score: 90,
        coins_earned: 12,
        xp_gained: 6,
        difficulty: 'normal',
      };

      mockStartGame.mockResolvedValue(mockStartResponse);
      mockSubmitScore.mockResolvedValue(mockSubmitResponse);

      const result = await minigameService.submitResult({
        session_id: '',
        gameType: 'memory',
        score: 90,
        durationSeconds: 45,
        difficulty: 'normal',
      });

      expect(mockStartGame).toHaveBeenCalled();
      expect(result).toEqual(mockSubmitResponse);
    });
  });

  describe('fetchLeaderboard', () => {
    it('should fetch leaderboard entries', async () => {
      const mockLeaderboard = {
        entries: [
          { user_id: 'user-1', username: 'player1', score: 100, rank: 1 },
          { user_id: 'user-2', username: 'player2', score: 90, rank: 2 },
        ],
      };

      mockGetGameLeaderboard.mockResolvedValue(mockLeaderboard);

      const result = await minigameService.fetchLeaderboard('memory');

      expect(result).toEqual(mockLeaderboard.entries);
      expect(mockGetGameLeaderboard).toHaveBeenCalledWith('memory');
    });
  });

  describe('fetchRewards', () => {
    it('should fetch rewards summary', async () => {
      const mockRewards = {
        total_coins: 150,
        total_xp: 75,
        achievements: [],
      };

      mockGetRewardsSummary.mockResolvedValue(mockRewards);

      const result = await minigameService.fetchRewards('memory');

      expect(result).toEqual(mockRewards);
      expect(mockGetRewardsSummary).toHaveBeenCalledWith('memory');
    });
  });

  describe('suggestDifficulty', () => {
    it('should suggest easy difficulty for low scores', () => {
      const history = [30, 40, 35];
      const difficulty = minigameService.suggestDifficulty(history);

      expect(difficulty).toBe('easy');
    });

    it('should suggest normal difficulty for medium scores', () => {
      const history = [60, 65, 70];
      const difficulty = minigameService.suggestDifficulty(history);

      expect(difficulty).toBe('normal');
    });

    it('should suggest hard difficulty for high scores', () => {
      const history = [85, 90, 88];
      const difficulty = minigameService.suggestDifficulty(history);

      expect(difficulty).toBe('hard');
    });

    it('should default to easy for empty history', () => {
      const difficulty = minigameService.suggestDifficulty([]);

      expect(difficulty).toBe('easy');
    });
  });

  describe('cycleDifficulty', () => {
    it('should cycle from easy to normal', () => {
      const next = minigameService.cycleDifficulty('easy');
      expect(next).toBe('normal');
    });

    it('should cycle from normal to hard', () => {
      const next = minigameService.cycleDifficulty('normal');
      expect(next).toBe('hard');
    });

    it('should cycle from hard back to easy', () => {
      const next = minigameService.cycleDifficulty('hard');
      expect(next).toBe('easy');
    });
  });

  describe('computeRewards', () => {
    it('should compute rewards for easy difficulty', () => {
      const result = minigameService.computeRewards(80, 'easy');

      expect(result.score).toBe(80);
      expect(result.coinsEarned).toBe(8); // 80/10 * 1
      expect(result.happinessGain).toBe(20); // 80/4 * 1
    });

    it('should compute rewards for normal difficulty with multiplier', () => {
      const result = minigameService.computeRewards(80, 'normal');

      expect(result.score).toBe(80);
      expect(result.coinsEarned).toBe(10); // 80/10 * 1.2 = 9.6, rounded to 10
      expect(result.happinessGain).toBe(24); // 80/4 * 1.2 = 24
    });

    it('should compute rewards for hard difficulty with higher multiplier', () => {
      const result = minigameService.computeRewards(80, 'hard');

      expect(result.score).toBe(80);
      expect(result.coinsEarned).toBe(12); // 80/10 * 1.5 = 12
      expect(result.happinessGain).toBe(30); // 80/4 * 1.5 = 30
    });

    it('should cap happiness gain at 25', () => {
      const result = minigameService.computeRewards(200, 'easy');

      expect(result.happinessGain).toBe(25); // Capped at 25
    });
  });
});
