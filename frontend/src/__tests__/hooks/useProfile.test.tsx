/**
 * Tests for useProfile hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useProfile } from '../../hooks/useProfile';
import { profileService } from '../../services/profileService';
import { useAuth } from '../../contexts/AuthContext';

// Mock dependencies
jest.mock('../../services/profileService');
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const mockProfileService = profileService as jest.Mocked<typeof profileService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('useProfile', () => {
  const mockUser = {
    uid: 'test-user-id',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      currentUser: mockUser,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      refreshUserState: jest.fn(),
      markUserAsReturning: jest.fn(),
    } as any);
  });

  it('should load profile on mount', async () => {
    const mockProfile = {
      id: 'profile-id',
      user_id: 'test-user-id',
      username: 'testuser',
      coins: 100,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockProfileService.getProfile.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useProfile());

    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.profile).toEqual(mockProfile);
    expect(mockProfileService.getProfile).toHaveBeenCalledWith('test-user-id');
  });

  it('should handle profile loading error', async () => {
    const error = new Error('Failed to load profile');
    mockProfileService.getProfile.mockRejectedValue(error);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.profile).toBe(null);
  });

  it('should return null profile when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      refreshUserState: jest.fn(),
      markUserAsReturning: jest.fn(),
    } as any);

    const { result } = renderHook(() => useProfile());

    expect(result.current.profile).toBe(null);
    expect(mockProfileService.getProfile).not.toHaveBeenCalled();
  });

  it('should refresh profile when refresh is called', async () => {
    const mockProfile = {
      id: 'profile-id',
      user_id: 'test-user-id',
      username: 'testuser',
      coins: 100,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    mockProfileService.getProfile.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Call refresh
    await result.current.refresh();

    expect(mockProfileService.getProfile).toHaveBeenCalledWith('test-user-id');
  });

  it('should update profile when updateProfile is called', async () => {
    const initialProfile = {
      id: 'profile-id',
      user_id: 'test-user-id',
      username: 'testuser',
      coins: 100,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    const updatedProfile = {
      ...initialProfile,
      username: 'newusername',
      coins: 150,
    };

    mockProfileService.getProfile.mockResolvedValue(initialProfile);
    mockProfileService.updateProfile.mockResolvedValue(updatedProfile);

    const { result } = renderHook(() => useProfile());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updateResult = await result.current.updateProfile({ coins: 150 });

    expect(updateResult).toEqual(updatedProfile);
    expect(result.current.profile).toEqual(updatedProfile);
    expect(mockProfileService.updateProfile).toHaveBeenCalledWith('test-user-id', { coins: 150 });
  });

  it('should throw error when updateProfile is called without authentication', async () => {
    mockUseAuth.mockReturnValue({
      currentUser: null,
      loading: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      signInWithGoogle: jest.fn(),
      refreshUserState: jest.fn(),
      markUserAsReturning: jest.fn(),
    } as any);

    const { result } = renderHook(() => useProfile());

    await expect(result.current.updateProfile({ coins: 100 })).rejects.toThrow('Not authenticated');
  });
});
