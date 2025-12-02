/**
 * Integration tests for store synchronization
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useStoreSync } from '../../hooks/useStoreSync';
import { useAppStore } from '../../store/useAppStore';
import { usePet } from '../../context/PetContext';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../services/profileService';
import { fetchActiveQuests } from '../../api/quests';

// Mock dependencies
jest.mock('../../context/PetContext');
jest.mock('../../contexts/AuthContext');
jest.mock('../../services/profileService');
jest.mock('../../api/quests');

const mockUsePet = usePet as jest.MockedFunction<typeof usePet>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockProfileService = profileService as jest.Mocked<typeof profileService>;
const mockFetchActiveQuests = fetchActiveQuests as jest.MockedFunction<typeof fetchActiveQuests>;

describe('useStoreSync Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAppStore.getState().reset();
  });

  it('should sync pet state from PetContext', async () => {
    const mockPet = {
      id: 'pet-1',
      name: 'Fluffy',
      species: 'dog' as const,
      breed: 'Golden Retriever',
      age: 2,
      level: 5,
      experience: 1000,
      ownerId: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        health: 80,
        hunger: 60,
        happiness: 70,
        cleanliness: 90,
        energy: 75,
        lastUpdated: new Date(),
      },
    };

    mockUsePet.mockReturnValue({
      pet: mockPet,
      loading: false,
      error: null,
      updating: false,
      updatePetStats: jest.fn(),
      feed: jest.fn(),
      play: jest.fn(),
      bathe: jest.fn(),
      rest: jest.fn(),
      createPet: jest.fn(),
      refreshPet: jest.fn(),
    });

    mockUseAuth.mockReturnValue({
      currentUser: { uid: 'user-1', email: 'test@example.com' },
      loading: false,
      hasPet: true,
      isNewUser: false,
      isTransitioning: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshUserState: jest.fn(),
    });

    mockProfileService.getProfile.mockResolvedValue({
      id: 'profile-1',
      user_id: 'user-1',
      coins: 100,
      total_xp: 50,
      username: 'testuser',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    mockFetchActiveQuests.mockResolvedValue({
      daily: [],
      weekly: [],
      event: [],
      refreshed_at: new Date().toISOString(),
    });

    renderHook(() => useStoreSync());

    await waitFor(() => {
      expect(useAppStore.getState().pet).toEqual(mockPet);
      expect(useAppStore.getState().coins).toBe(100);
      expect(useAppStore.getState().xp).toBe(50);
    });
  });

  it('should sync profile when user changes', async () => {
    mockUsePet.mockReturnValue({
      pet: null,
      loading: false,
      error: null,
      updating: false,
      updatePetStats: jest.fn(),
      feed: jest.fn(),
      play: jest.fn(),
      bathe: jest.fn(),
      rest: jest.fn(),
      createPet: jest.fn(),
      refreshPet: jest.fn(),
    });

    mockUseAuth.mockReturnValue({
      currentUser: { uid: 'user-2', email: 'test2@example.com' },
      loading: false,
      hasPet: false,
      isNewUser: false,
      isTransitioning: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshUserState: jest.fn(),
    });

    mockProfileService.getProfile.mockResolvedValue({
      id: 'profile-2',
      user_id: 'user-2',
      coins: 200,
      total_xp: 100,
      username: 'testuser2',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any);

    mockFetchActiveQuests.mockResolvedValue({
      daily: [],
      weekly: [],
      event: [],
      refreshed_at: new Date().toISOString(),
    });

    renderHook(() => useStoreSync());

    await waitFor(() => {
      expect(mockProfileService.getProfile).toHaveBeenCalledWith('user-2', false);
      expect(useAppStore.getState().coins).toBe(200);
      expect(useAppStore.getState().xp).toBe(100);
    });
  });

  it('should handle errors gracefully', async () => {
    mockUsePet.mockReturnValue({
      pet: null,
      loading: false,
      error: null,
      updating: false,
      updatePetStats: jest.fn(),
      feed: jest.fn(),
      play: jest.fn(),
      bathe: jest.fn(),
      rest: jest.fn(),
      createPet: jest.fn(),
      refreshPet: jest.fn(),
    });

    mockUseAuth.mockReturnValue({
      currentUser: { uid: 'user-1', email: 'test@example.com' },
      loading: false,
      hasPet: false,
      isNewUser: false,
      isTransitioning: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      refreshUserState: jest.fn(),
    });

    mockProfileService.getProfile.mockRejectedValue(new Error('Network error'));
    mockFetchActiveQuests.mockRejectedValue(new Error('Network error'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    renderHook(() => useStoreSync());

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});
