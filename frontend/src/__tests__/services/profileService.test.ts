/**
 * Tests for profileService
 */
import { profileService } from '../../services/profileService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
  },
  withTimeout: jest.fn((promise) => promise),
  withRetry: jest.fn((fn) => fn()),
}));

const mockSupabase = supabase as any;

describe('profileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should fetch profile from database', async () => {
      const mockProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        username: 'testuser',
        coins: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await profileService.getProfile('user-id');

      expect(result).toEqual(mockProfile);
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockEq).toHaveBeenCalledWith('user_id', 'user-id');
    });

    it('should return null when profile does not exist', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        single: mockSingle,
      });

      const result = await profileService.getProfile('user-id');

      expect(result).toBe(null);
    });

    it('should use cache when available', async () => {
      const mockProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        username: 'testuser',
        coins: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      // First call
      const mockSelect1 = jest.fn().mockReturnThis();
      const mockEq1 = jest.fn().mockReturnThis();
      const mockSingle1 = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect1,
      });
      mockSelect1.mockReturnValue({
        eq: mockEq1,
      });
      mockEq1.mockReturnValue({
        single: mockSingle1,
      });

      await profileService.getProfile('user-id', true);

      // Second call should use cache
      jest.clearAllMocks();

      const result = await profileService.getProfile('user-id', true);

      expect(result).toEqual(mockProfile);
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('should clear cache when requested', () => {
      profileService.clearCache('user-id');
      profileService.clearCache(); // Clear all
    });
  });

  describe('createProfile', () => {
    it('should create profile with authenticated user', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'test@example.com',
      };

      const mockProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        username: 'testuser',
        coins: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockInsert = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
      });
      mockInsert.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await profileService.createProfile('testuser');

      expect(result).toEqual(mockProfile);
      expect(mockInsert).toHaveBeenCalledWith([
        expect.objectContaining({
          user_id: 'user-id',
          username: 'testuser',
          coins: 100,
        }),
      ]);
    });

    it('should throw error when username is empty', async () => {
      await expect(profileService.createProfile('')).rejects.toThrow('Username is required');
      await expect(profileService.createProfile('   ')).rejects.toThrow('Username is required');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockUpdatedProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        username: 'newusername',
        coins: 150,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await profileService.updateProfile('user-id', { coins: 150 });

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          coins: 150,
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error when user ID is missing', async () => {
      await expect(profileService.updateProfile('', { coins: 100 })).rejects.toThrow('User ID is required');
    });
  });

  describe('updateUsername', () => {
    it('should update username in profile and auth metadata', async () => {
      const mockUpdatedProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        username: 'newusername',
        coins: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await profileService.updateUsername('user-id', 'newusername');

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        data: { display_name: 'newusername' },
      });
    });

    it('should handle auth metadata update failure gracefully', async () => {
      const mockUpdatedProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        username: 'newusername',
        coins: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Auth update failed' },
      });

      // Should not throw even if auth update fails
      const result = await profileService.updateUsername('user-id', 'newusername');

      expect(result).toEqual(mockUpdatedProfile);
    });
  });

  describe('updateAvatar', () => {
    it('should update avatar URL', async () => {
      const mockUpdatedProfile = {
        id: 'profile-id',
        user_id: 'user-id',
        username: 'testuser',
        avatar_url: 'https://example.com/avatar.jpg',
        coins: 100,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockSelect = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockUpdatedProfile,
        error: null,
      });

      mockSupabase.from.mockReturnValue({
        update: mockUpdate,
      });
      mockUpdate.mockReturnValue({
        eq: mockEq,
      });
      mockEq.mockReturnValue({
        select: mockSelect,
      });
      mockSelect.mockReturnValue({
        single: mockSingle,
      });

      const result = await profileService.updateAvatar('user-id', 'https://example.com/avatar.jpg');

      expect(result).toEqual(mockUpdatedProfile);
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar_url: 'https://example.com/avatar.jpg',
        })
      );
    });
  });
});
