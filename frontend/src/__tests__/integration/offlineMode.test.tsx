/**
 * Integration tests for offline mode functionality
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useOfflineCache } from '../../hooks/useOfflineCache';
import { useSyncManager } from '../../hooks/useSyncManager';
import { offlineStorage } from '../../services/offlineStorageService';
import * as syncService from '../../services/syncService';

// Mock dependencies
jest.mock('../../services/offlineStorageService');
jest.mock('../../services/syncService');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: { user: { id: 'test-user' } } } })),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      })),
    })),
    removeChannel: jest.fn(),
  },
  isSupabaseMock: jest.fn(() => false),
}));

jest.mock('../../hooks/useOfflineStatus', () => ({
  useOfflineStatus: () => ({ offline: false }),
}));

const mockNavigator = {
  onLine: true,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('Offline Mode Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigator.onLine = true;
    (offlineStorage.init as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.getCachedItem as jest.Mock).mockResolvedValue(null);
    (offlineStorage.setCachedItem as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.queueOperation as jest.Mock).mockResolvedValue('op-id');
    (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue([]);
    (syncService.saveToCloud as jest.Mock).mockResolvedValue({
      success: true,
      conflicts: [],
      restored: false,
    });
    (syncService.processSyncQueue as jest.Mock).mockResolvedValue({
      processed: 0,
      failed: 0,
    });
  });

  it('should cache data when going offline', async () => {
    const testData = { pet: { id: 'pet-1', name: 'Fluffy' } };

    mockNavigator.onLine = true;

    const { result } = renderHook(() =>
      useOfflineCache({
        key: 'pet-data',
        data: testData,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Simulate going offline
    mockNavigator.onLine = false;
    const offlineEvent = new Event('offline');
    window.dispatchEvent(offlineEvent);

    await waitFor(() => {
      expect(result.current.offline).toBe(true);
    });

    // Data should still be available from cache
    expect(result.current.cached).toBeTruthy();
  });

  it('should queue operations when offline', async () => {
    mockNavigator.onLine = false;

    (syncService.saveToCloud as jest.Mock).mockResolvedValue({
      success: false,
      conflicts: [],
      restored: false,
      error: 'Offline - queued for sync',
    });

    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.save).toBeDefined();
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(offlineStorage.queueOperation).toHaveBeenCalled();
    });
  });

  it('should sync queued operations when coming back online', async () => {
    const queuedOps = [
      {
        id: 'op-1',
        type: 'update' as const,
        table: 'pets',
        data: { id: 'pet-1', name: 'Fluffy' },
        timestamp: Date.now(),
        retries: 0,
      },
    ];

    mockNavigator.onLine = false;

    (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue(queuedOps);
    (syncService.saveToCloud as jest.Mock).mockResolvedValue({
      success: false,
      conflicts: [],
      restored: false,
      error: 'Offline - queued for sync',
    });

    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.save).toBeDefined();
    });

    // Queue an operation while offline
    await act(async () => {
      await result.current.save();
    });

    // Come back online
    mockNavigator.onLine = true;
    (syncService.saveToCloud as jest.Mock).mockResolvedValue({
      success: true,
      conflicts: [],
      restored: false,
    });
    (syncService.processSyncQueue as jest.Mock).mockResolvedValue({
      processed: 1,
      failed: 0,
    });

    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    await waitFor(() => {
      expect(syncService.processSyncQueue).toHaveBeenCalled();
    });
  });

  it('should restore from cache when offline', async () => {
    const cachedData = {
      data: { pet: { id: 'pet-1', name: 'Fluffy' } },
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    mockNavigator.onLine = false;
    (offlineStorage.getCachedItem as jest.Mock).mockResolvedValue(cachedData);

    const { result } = renderHook(() =>
      useOfflineCache({
        key: 'pet-data',
        data: null,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.cached).toEqual(cachedData.data);
    expect(result.current.offline).toBe(true);
  });

  it('should handle IndexedDB errors gracefully', async () => {
    (offlineStorage.init as jest.Mock).mockRejectedValue(new Error('IndexedDB error'));
    (offlineStorage.getCachedItem as jest.Mock).mockRejectedValue(new Error('Read error'));

    const { result } = renderHook(() =>
      useOfflineCache({
        key: 'test-key',
        data: { test: 'data' },
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should not crash, should fall back to provided data
    expect(result.current.cached).toEqual({ test: 'data' });
  });

  it('should handle sync conflicts', async () => {
    const conflicts = [
      {
        field: 'pet.stats.hunger',
        local: 80,
        remote: 90,
        resolution: 'merge',
      },
    ];

    (syncService.saveToCloud as jest.Mock).mockResolvedValue({
      success: true,
      conflicts,
      restored: false,
    });

    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.save).toBeDefined();
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(result.current.conflicts).toEqual(conflicts);
    });
  });

  it('should retry failed sync operations', async () => {
    mockNavigator.onLine = true;

    (syncService.saveToCloud as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        success: true,
        conflicts: [],
        restored: false,
      });

    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.save).toBeDefined();
    });

    await act(async () => {
      await result.current.save();
    });

    // Should retry and eventually succeed
    await waitFor(() => {
      expect(syncService.saveToCloud).toHaveBeenCalledTimes(2);
    });
  });
});
