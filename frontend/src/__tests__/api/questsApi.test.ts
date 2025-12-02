/**
 * Tests for Quests API integration
 * Tests API calls, error handling, and response parsing
 */

import * as questsApi from '../../api/quests';

// Mock fetch globally
global.fetch = jest.fn();

describe('Quests API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getActiveQuests', () => {
    it('fetches active quests successfully', async () => {
      const mockQuests = {
        daily: [
          {
            id: 'quest-1',
            title: 'Feed Pet',
            type: 'daily',
            status: 'active',
          },
        ],
        weekly: [],
        event: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockQuests }),
      });

      const result = await questsApi.getActiveQuests();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/quests'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );

      expect(result).toEqual(mockQuests);
    });

    it('handles API errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

      await expect(questsApi.fetchActiveQuests()).rejects.toThrow();
    });

    it('handles network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(questsApi.fetchActiveQuests()).rejects.toThrow('Network error');
    });
  });

  describe('completeQuest', () => {
    it('completes quest successfully', async () => {
      const mockResponse = {
        result: {
          quest: {
            id: 'quest-1',
            status: 'completed',
          },
          coins_awarded: 50,
          xp_awarded: 100,
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await questsApi.completeQuest('quest-1', { action: 'feed' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/quests/complete'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            quest_id: 'quest-1',
          }),
        })
      );

      expect(result).toEqual(mockResponse.result);
    });

    it('handles completion errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Quest not found' }),
      });

      await expect(questsApi.completeQuest('invalid-quest')).rejects.toThrow();
    });
  });

  describe('claimReward', () => {
    it('claims reward successfully', async () => {
      const mockResponse = {
        result: {
          quest: {
            id: 'quest-1',
            status: 'completed',
          },
          coins_awarded: 50,
          xp_awarded: 100,
          message: 'Reward claimed!',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await questsApi.claimReward('quest-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/quests/claim-reward'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ quest_id: 'quest-1' }),
        })
      );

      expect(result).toEqual(mockResponse.result);
    });

    it('handles claim errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Reward already claimed' }),
      });

      await expect(questsApi.claimQuestReward('quest-1')).rejects.toThrow();
    });
  });

  describe('getDailyQuests', () => {
    it('fetches daily quests with reset time', async () => {
      const mockResponse = {
        result: {
          quests: [
            {
              id: 'daily-1',
              title: 'Daily Challenge',
              type: 'daily',
            },
          ],
          next_reset_at: '2024-01-16T00:00:00Z',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await questsApi.getDailyQuests();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/quests/daily'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      expect(result).toEqual(mockResponse.result);
    });
  });
});
