/**
 * Tests for Social API integration
 * Tests friend requests, leaderboard, and public profiles
 */

import { socialApi } from '../../api/social';

global.fetch = jest.fn();

describe('Social API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getFriends', () => {
    it('fetches friends list successfully', async () => {
      const mockFriends = {
        friends: [
          { id: 'user-1', username: 'Friend1', pet_name: 'Pet1' },
          { id: 'user-2', username: 'Friend2', pet_name: 'Pet2' },
        ],
        pending_requests: [],
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockFriends }),
      });

      const result = await socialApi.getFriends();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/friends'),
        expect.objectContaining({ method: 'GET' })
      );

      expect(result).toEqual(mockFriends);
    });
  });

  describe('sendFriendRequest', () => {
    it('sends friend request successfully', async () => {
      const mockResponse = {
        result: {
          request_id: 'req-1',
          status: 'pending',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await socialApi.sendFriendRequest('user-2');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/friends/request'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ target_user_id: 'user-2' }),
        })
      );

      expect(result).toEqual(mockResponse.result);
    });

    it('handles duplicate friend request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Friend request already sent' }),
      });

      await expect(socialApi.sendFriendRequest('user-2')).rejects.toThrow();
    });
  });

  describe('respondToFriendRequest', () => {
    it('accepts friend request', async () => {
      const mockResponse = {
        result: {
          status: 'accepted',
          friendship_id: 'friendship-1',
        },
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await socialApi.respondToFriendRequest('req-1', 'accept');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/friends/respond'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({
            request_id: 'req-1',
            action: 'accept',
          }),
        })
      );

      expect(result).toEqual(mockResponse.result);
    });

    it('declines friend request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { status: 'declined' } }),
      });

      const result = await socialApi.respondToFriendRequest('req-1', 'decline');

      expect(result.status).toBe('declined');
    });
  });

  describe('getLeaderboard', () => {
    it('fetches leaderboard successfully', async () => {
      const mockLeaderboard = {
        top_users: [
          { user_id: 'user-1', username: 'TopUser', score: 1000 },
          { user_id: 'user-2', username: 'SecondUser', score: 900 },
        ],
        user_rank: 5,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: mockLeaderboard }),
      });

      const result = await socialApi.getLeaderboard();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/leaderboard'),
        expect.objectContaining({ method: 'GET' })
      );

      expect(result).toEqual(mockLeaderboard);
    });
  });

  describe('getPublicProfiles', () => {
    it('fetches public profiles successfully', async () => {
      const mockProfiles = [
        { user_id: 'user-1', username: 'User1', pet_name: 'Pet1' },
        { user_id: 'user-2', username: 'User2', pet_name: 'Pet2' },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { profiles: mockProfiles } }),
      });

      const result = await socialApi.getPublicProfiles();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/social/public_profiles'),
        expect.objectContaining({ method: 'GET' })
      );

      expect(result).toEqual(mockProfiles);
    });
  });
});
