/**
 * Tests for useMiniGameRound hook
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useMiniGameRound } from '../../hooks/useMiniGameRound';
import { minigameService } from '../../services/minigameService';
import type { GameType, GameDifficulty } from '../../types/game';

// Mock minigameService
jest.mock('../../services/minigameService');

const mockMinigameService = minigameService as jest.Mocked<typeof minigameService>;

describe('useMiniGameRound', () => {
  const mockGameType: GameType = 'memory';
  const mockStartResponse = {
    session_id: 'session-123',
    difficulty: 'easy' as GameDifficulty,
    ai_profile: {
      difficulty: 'easy',
      adaptive_level: 1,
    },
    longest_streak: 5,
  };

  const mockLeaderboard = [
    { user_id: 'user-1', username: 'player1', score: 100, rank: 1 },
    { user_id: 'user-2', username: 'player2', score: 90, rank: 2 },
  ];

  const mockPlayResponse = {
    session_id: 'session-123',
    score: 85,
    coins_earned: 10,
    xp_gained: 5,
    difficulty: 'easy' as GameDifficulty,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockMinigameService.startRound.mockResolvedValue(mockStartResponse);
    mockMinigameService.fetchLeaderboard.mockResolvedValue(mockLeaderboard);
    mockMinigameService.submitResult.mockResolvedValue(mockPlayResponse);
    mockMinigameService.cycleDifficulty.mockReturnValue('normal');
  });

  it('should initialize with default difficulty', () => {
    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    expect(result.current.difficulty).toBe('easy');
    expect(result.current.preferredDifficulty).toBe('easy');
  });

  it('should start a round on mount', async () => {
    renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(mockMinigameService.startRound).toHaveBeenCalled();
    });

    expect(mockMinigameService.fetchLeaderboard).toHaveBeenCalledWith(mockGameType);
  });

  it('should update state after starting round', async () => {
    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    expect(result.current.difficulty).toBe('easy');
    expect(result.current.aiProfile).toEqual(mockStartResponse.ai_profile);
    expect(result.current.longestStreak).toBe(5);
  });

  it('should submit score successfully', async () => {
    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    let submitResult: any;
    await act(async () => {
      submitResult = await result.current.submitScore({
        score: 85,
        durationSeconds: 60,
      });
    });

    expect(submitResult).toEqual(mockPlayResponse);
    expect(mockMinigameService.submitResult).toHaveBeenCalled();
  });

  it('should start new round if no session exists when submitting score', async () => {
    mockMinigameService.startRound.mockResolvedValueOnce({
      ...mockStartResponse,
      session_id: 'new-session',
    });

    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    // Clear the initial startRound call
    jest.clearAllMocks();

    await act(async () => {
      await result.current.submitScore({
        score: 85,
        durationSeconds: 60,
      });
    });

    expect(mockMinigameService.startRound).toHaveBeenCalled();
    expect(mockMinigameService.submitResult).toHaveBeenCalled();
  });

  it('should refresh leaderboard', async () => {
    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(result.current.leaderboard).toEqual(mockLeaderboard);
    });

    jest.clearAllMocks();

    await act(async () => {
      await result.current.refreshLeaderboard();
    });

    expect(mockMinigameService.fetchLeaderboard).toHaveBeenCalledWith(mockGameType);
  });

  it('should set preferred difficulty', async () => {
    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    await act(async () => {
      await result.current.setPreferredDifficulty('hard');
    });

    expect(mockMinigameService.startRound).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredDifficulty: 'hard',
      })
    );
  });

  it('should cycle difficulty', async () => {
    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    await act(async () => {
      await result.current.cycleDifficulty();
    });

    expect(mockMinigameService.cycleDifficulty).toHaveBeenCalledWith('easy');
    expect(mockMinigameService.startRound).toHaveBeenCalled();
  });

  it('should handle start round errors', async () => {
    const error = new Error('Failed to start round');
    mockMinigameService.startRound.mockRejectedValueOnce(error);

    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(result.current.roundError).toBeTruthy();
    });

    expect(result.current.loadingRound).toBe(false);
  });

  it('should update rewards refresh key after score submission', async () => {
    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    const initialKey = result.current.rewardsRefreshKey;

    await act(async () => {
      await result.current.submitScore({
        score: 85,
        durationSeconds: 60,
      });
    });

    expect(result.current.rewardsRefreshKey).toBe(initialKey + 1);
  });

  it('should start new round after score submission', async () => {
    const { result } = renderHook(() => useMiniGameRound(mockGameType, 'easy'));

    await waitFor(() => {
      expect(result.current.isReady).toBe(true);
    });

    jest.clearAllMocks();

    await act(async () => {
      await result.current.submitScore({
        score: 85,
        durationSeconds: 60,
      });
    });

    // Should start a new round after submission
    expect(mockMinigameService.startRound).toHaveBeenCalled();
  });
});
