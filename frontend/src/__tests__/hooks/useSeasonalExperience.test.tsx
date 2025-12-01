/**
 * Tests for useSeasonalExperience hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useSeasonalExperience } from '../../hooks/useSeasonalExperience';
import { seasonalService } from '../../services/seasonalService';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';

// Mock dependencies
jest.mock('../../services/seasonalService');
jest.mock('../../hooks/useOfflineCache');
jest.mock('../../hooks/useOfflineStatus');

const mockSeasonalService = seasonalService as jest.Mocked<typeof seasonalService>;
const mockUseOfflineCache = useOfflineCache as jest.MockedFunction<typeof useOfflineCache>;
const mockUseOfflineStatus = useOfflineStatus as jest.MockedFunction<typeof useOfflineStatus>;

describe('useSeasonalExperience', () => {
  const mockEvents = {
    events: [
      { id: '1', name: 'Spring Festival', start_date: '2024-03-01', end_date: '2024-03-31' },
    ],
  };

  const mockWeather = {
    temperature: 72,
    condition: 'sunny',
    humidity: 50,
  };

  const mockPetStats = {
    health: 80,
    hunger: 70,
    happiness: 75,
    cleanliness: 85,
    energy: 90,
  };

  const mockSeasonalMood = {
    mood: 'happy',
    modifiers: { happiness: 10 },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseOfflineStatus.mockReturnValue({
      offline: false,
      lastSyncedAt: Date.now(),
      connectionType: '4g',
    });
    mockUseOfflineCache.mockReturnValue({
      cached: null,
      offline: false,
      loading: false,
    });
  });

  it('should fetch seasonal data on mount', async () => {
    mockSeasonalService.fetchEvents.mockResolvedValue(mockEvents);
    mockSeasonalService.fetchWeather.mockResolvedValue(mockWeather);
    mockSeasonalService.fetchPetSeasonalState.mockResolvedValue({
      pet: { id: 'pet-1', stats: mockPetStats } as any,
      seasonalMood: mockSeasonalMood,
    });

    const { result } = renderHook(() => useSeasonalExperience(mockPetStats));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.weather).toEqual(mockWeather);
    expect(result.current.seasonalMood).toEqual(mockSeasonalMood);
    expect(mockSeasonalService.fetchEvents).toHaveBeenCalled();
    expect(mockSeasonalService.fetchWeather).toHaveBeenCalled();
    expect(mockSeasonalService.fetchPetSeasonalState).toHaveBeenCalled();
  });

  it('should use cached data when available', () => {
    const cachedSnapshot = {
      events: mockEvents,
      weather: mockWeather,
      seasonalMood: mockSeasonalMood,
      fetchedAt: Date.now() - 1000,
      petStats: mockPetStats,
    };

    mockUseOfflineCache.mockReturnValue({
      cached: cachedSnapshot,
      offline: false,
      loading: false,
    });

    const { result } = renderHook(() => useSeasonalExperience(mockPetStats));

    expect(result.current.events).toEqual(mockEvents);
    expect(result.current.weather).toEqual(mockWeather);
    expect(result.current.usingCache).toBe(true);
  });

  it('should handle fetch errors gracefully', async () => {
    const error = new Error('Failed to fetch');
    mockSeasonalService.fetchEvents.mockRejectedValue(error);

    const { result } = renderHook(() => useSeasonalExperience(mockPetStats));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to fetch');
  });

  it('should handle 404 errors by setting null values', async () => {
    const apiError = { status: 404, message: 'Not found' } as any;
    mockSeasonalService.fetchEvents.mockRejectedValue(apiError);

    const { result } = renderHook(() => useSeasonalExperience(mockPetStats));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.events).toBe(null);
    expect(result.current.weather).toBe(null);
    expect(result.current.seasonalMood).toBe(null);
  });

  it('should use base stats when no pet stats available', () => {
    mockUseOfflineCache.mockReturnValue({
      cached: null,
      offline: false,
      loading: false,
    });

    const { result } = renderHook(() => useSeasonalExperience(mockPetStats));

    expect(result.current.adjustedStats).toEqual(mockPetStats);
  });

  it('should refresh data when refresh is called', async () => {
    mockSeasonalService.fetchEvents.mockResolvedValue(mockEvents);
    mockSeasonalService.fetchWeather.mockResolvedValue(mockWeather);
    mockSeasonalService.fetchPetSeasonalState.mockResolvedValue({
      pet: { id: 'pet-1', stats: mockPetStats } as any,
      seasonalMood: mockSeasonalMood,
    });

    const { result } = renderHook(() => useSeasonalExperience(mockPetStats));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    jest.clearAllMocks();

    await result.current.refresh();

    expect(mockSeasonalService.fetchEvents).toHaveBeenCalled();
    expect(mockSeasonalService.fetchWeather).toHaveBeenCalled();
    expect(mockSeasonalService.fetchPetSeasonalState).toHaveBeenCalled();
  });

  it('should include coordinates in weather fetch when available', async () => {
    // Mock geolocation
    const mockGeolocation = {
      getCurrentPosition: jest.fn((success) => {
        success({
          coords: {
            latitude: 40.7128,
            longitude: -74.0060,
          },
        });
      }),
    };
    (global.navigator as any).geolocation = mockGeolocation;

    mockSeasonalService.fetchEvents.mockResolvedValue(mockEvents);
    mockSeasonalService.fetchWeather.mockResolvedValue(mockWeather);
    mockSeasonalService.fetchPetSeasonalState.mockResolvedValue({
      pet: { id: 'pet-1', stats: mockPetStats } as any,
      seasonalMood: mockSeasonalMood,
    });

    renderHook(() => useSeasonalExperience(mockPetStats));

    await waitFor(() => {
      expect(mockSeasonalService.fetchWeather).toHaveBeenCalled();
    });
  });

  it('should indicate offline status', () => {
    mockUseOfflineStatus.mockReturnValue({
      offline: true,
      lastSyncedAt: null,
      connectionType: undefined,
    });

    const { result } = renderHook(() => useSeasonalExperience(mockPetStats));

    expect(result.current.offline).toBe(true);
  });
});
