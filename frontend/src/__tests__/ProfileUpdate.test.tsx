/**
 * Test: Username Update and Persistence
 * Verifies that username changes persist in Supabase and are reflected in the UI
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { profileService } from '../services/profileService';
import { supabase } from '../lib/supabase';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      updateUser: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

describe('Username Update and Persistence', () => {
  const mockUserId = 'test-user-123';
  const oldUsername = 'oldUsername';
  const newUsername = 'newUsername';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('updateUsername updates profile in database', async () => {
    // Mock database update - need to include .select() in chain
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: '1',
        user_id: mockUserId,
        username: newUsername,
        coins: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: null,
      },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({
      single: mockSingle,
    });

    const mockEq = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: mockEq,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
    });

    // Mock auth metadata update
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Call updateUsername
    const result = await profileService.updateUsername(mockUserId, newUsername);

    // Verify database was updated
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(mockEq).toHaveBeenCalledWith('user_id', mockUserId);
    expect(result.username).toBe(newUsername);

    // Verify auth metadata was updated
    expect(supabase.auth.updateUser).toHaveBeenCalledWith({
      data: {
        display_name: newUsername,
      },
    });
  });

  test('updateUsername handles auth metadata update failure gracefully', async () => {
    // Mock successful database update
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: '1',
        user_id: mockUserId,
        username: newUsername,
        coins: 100,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        avatar_url: null,
      },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({
      single: mockSingle,
    });

    const mockEq = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: mockEq,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
    });

    // Mock auth metadata update failure
    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'Auth update failed' },
    });

    // Call updateUsername - should not throw even if auth update fails
    const result = await profileService.updateUsername(mockUserId, newUsername);

    // Verify database update succeeded
    expect(result.username).toBe(newUsername);
    
    // Verify auth update was attempted
    expect(supabase.auth.updateUser).toHaveBeenCalled();
  });

  test('getProfile fetches profile from database', async () => {
    const mockProfile = {
      id: '1',
      user_id: mockUserId,
      username: oldUsername,
      coins: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      avatar_url: null,
    };

    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockProfile,
            error: null,
          }),
        }),
      }),
    });

    const result = await profileService.getProfile(mockUserId);

    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(result).toEqual(mockProfile);
  });

  test('updateProfile updates the updated_at timestamp', async () => {
    const now = new Date().toISOString();
    
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: '1',
        user_id: mockUserId,
        username: newUsername,
        coins: 100,
        created_at: now,
        updated_at: now,
        avatar_url: null,
      },
      error: null,
    });

    const mockSelect = jest.fn().mockReturnValue({
      single: mockSingle,
    });

    const mockEq = jest.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockUpdate = jest.fn().mockReturnValue({
      eq: mockEq,
    });

    (supabase.from as jest.Mock).mockReturnValue({
      update: mockUpdate,
    });

    (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    await profileService.updateUsername(mockUserId, newUsername);

    // Verify updated_at is set
    const updateCall = (supabase.from as jest.Mock).mock.results[0].value.update.mock.calls[0][0];
    expect(updateCall).toHaveProperty('updated_at');
  });
});

