/**
 * Tests for useOfflineCache hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { offlineStorage } from '../../services/offlineStorageService';

// Mock offlineStorageService
jest.mock('../../services/offlineStorageService', () => ({
  offlineStorage: {
    init: jest.fn(() => Promise.resolve()),
    getCachedItem: jest.fn(),
    setCachedItem: jest.fn(),
    removeCachedItem: jest.fn(),
  },
}));

// Mock navigator.onLine
const mockNavigator = {
  onLine: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('useOfflineCache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigator.onLine = true;
  });

  it('should initialize and load cached data', async () => {
    const mockCachedData = {
      data: { test: 'value' },
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    (offlineStorage.getCachedItem as jest.Mock).mockResolvedValue(mockCachedData);

    const { result } = renderHook(() =>
      useOfflineCache({
        key: 'test-key',
        data: null,
      })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cached).toEqual(mockCachedData.data);
    expect(result.current.offline).toBe(false);
  });

  it('should handle expired cache', async () => {
    const expiredCache = {
      data: { test: 'value' },
      timestamp: Date.now() - 7200000,
      expiresAt: Date.now() - 3600000,
    };

    (offlineStorage.getCachedItem as jest.Mock).mockResolvedValue(expiredCache);
    (offlineStorage.removeCachedItem as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useOfflineCache({
        key: 'test-key',
        data: { new: 'data' },
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(offlineStorage.removeCachedItem).toHaveBeenCalledWith('test-key');
  });

  it('should save data to cache when it changes', async () => {
    const newData = { test: 'new value' };

    (offlineStorage.getCachedItem as jest.Mock).mockResolvedValue(null);

    const { result, rerender } = renderHook(
      ({ data }) =>
        useOfflineCache({
          key: 'test-key',
          data,
        }),
      {
        initialProps: { data: null },
      }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    rerender({ data: newData });

    await waitFor(() => {
      expect(offlineStorage.setCachedItem).toHaveBeenCalled();
    });
  });

  it('should detect offline status', async () => {
    mockNavigator.onLine = false;

    (offlineStorage.getCachedItem as jest.Mock).mockResolvedValue(null);

    const { result } = renderHook(() =>
      useOfflineCache({
        key: 'test-key',
        data: { test: 'value' },
      })
    );

    await waitFor(() => {
      expect(result.current.offline).toBe(true);
    });
  });

  it('should sync cache when coming back online', async () => {
    const cachedData = { test: 'cached' };
    const newData = { test: 'new' };

    (offlineStorage.getCachedItem as jest.Mock).mockResolvedValue({
      data: cachedData,
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000,
    });

    mockNavigator.onLine = false;

    const { result, rerender } = renderHook(
      ({ data }) =>
        useOfflineCache({
          key: 'test-key',
          data,
        }),
      {
        initialProps: { data: cachedData },
      }
    );

    await waitFor(() => {
      expect(result.current.offline).toBe(true);
    });

    mockNavigator.onLine = true;
    rerender({ data: newData });

    // Simulate online event
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    await waitFor(() => {
      expect(offlineStorage.setCachedItem).toHaveBeenCalled();
    });
  });

  it('should use custom TTL when provided', async () => {
    const customTTL = 5000; // 5 seconds

    (offlineStorage.getCachedItem as jest.Mock).mockResolvedValue(null);

    renderHook(() =>
      useOfflineCache({
        key: 'test-key',
        data: { test: 'value' },
        ttl: customTTL,
      })
    );

    await waitFor(() => {
      expect(offlineStorage.setCachedItem).toHaveBeenCalled();
    });

    const callArgs = (offlineStorage.setCachedItem as jest.Mock).mock.calls[0];
    expect(callArgs[2]).toBe(customTTL);
  });
});
