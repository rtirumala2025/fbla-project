/**
 * Tests for useSyncManager hook
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSyncManager } from '../../hooks/useSyncManager';
import * as syncService from '../../services/syncService';
import { offlineStorage } from '../../services/offlineStorageService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../services/syncService');
jest.mock('../../services/offlineStorageService');
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

describe('useSyncManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigator.onLine = true;
    (offlineStorage.init as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue([]);
    (syncService.saveToCloud as jest.Mock).mockResolvedValue({
      success: true,
      conflicts: [],
      restored: false,
    });
    (syncService.restoreFromCloud as jest.Mock).mockResolvedValue({
      success: true,
      conflicts: [],
      restored: true,
    });
    (syncService.processSyncQueue as jest.Mock).mockResolvedValue({
      processed: 0,
      failed: 0,
    });
    (syncService.fetchCloudState as jest.Mock).mockResolvedValue({
      state: {
        snapshot: {},
        last_modified: new Date().toISOString(),
        device_id: 'device-1',
        version: 1,
      },
    });
  });

  it('should initialize with idle status', async () => {
    const { result } = renderHook(() => useSyncManager());

    expect(result.current.status).toBe('idle');
    expect(result.current.conflicts).toEqual([]);
    expect(result.current.cloudState).toBeNull();
  });

  it('should save state to cloud', async () => {
    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.save).toBeDefined();
    });

    await act(async () => {
      await result.current.save();
    });

    await waitFor(() => {
      expect(syncService.saveToCloud).toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });
  });

  it('should restore state from cloud', async () => {
    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.restore).toBeDefined();
    });

    await act(async () => {
      await result.current.restore();
    });

    await waitFor(() => {
      expect(syncService.restoreFromCloud).toHaveBeenCalled();
      expect(result.current.status).toBe('idle');
    });
  });

  it('should handle offline status', async () => {
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
      expect(result.current.status).toBe('offline');
    });
  });

  it('should process sync queue when coming online', async () => {
    mockNavigator.onLine = false;

    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.save).toBeDefined();
    });

    mockNavigator.onLine = true;
    const onlineEvent = new Event('online');
    window.dispatchEvent(onlineEvent);

    await waitFor(() => {
      expect(syncService.processSyncQueue).toHaveBeenCalled();
    });
  });

  it('should enqueue changes for offline sync', async () => {
    const change = { test: 'data' };

    (offlineStorage.queueOperation as jest.Mock).mockResolvedValue('op-id');
    (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue([{ id: 'op-id' }]);

    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.enqueueChange).toBeDefined();
    });

    await act(async () => {
      await result.current.enqueueChange(change);
    });

    await waitFor(() => {
      expect(offlineStorage.queueOperation).toHaveBeenCalledWith({
        type: 'update',
        table: 'app_state',
        data: change,
      });
    });
  });

  it('should clear conflicts', async () => {
    const { result } = renderHook(() => useSyncManager());

    await act(async () => {
      result.current.clearConflicts();
    });

    expect(result.current.conflicts).toEqual([]);
  });

  it('should track queued operations count', async () => {
    (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue([
      { id: 'op-1' },
      { id: 'op-2' },
    ]);

    const { result } = renderHook(() => useSyncManager());

    await waitFor(() => {
      expect(result.current.queuedOperations).toBe(2);
    });
  });
});
