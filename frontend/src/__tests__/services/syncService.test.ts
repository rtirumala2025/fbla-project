/**
 * Tests for syncService
 */
import {
  saveToCloud,
  restoreFromCloud,
  processSyncQueue,
  setupRealtimeSync,
} from '../../services/syncService';
import { offlineStorage } from '../../services/offlineStorageService';
import { captureAppState, restoreAppState } from '../../services/stateCaptureService';
import { fetchCloudState, pushCloudState } from '../../api/sync';
import { supabase, isSupabaseMock } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../services/offlineStorageService');
jest.mock('../../services/stateCaptureService');
jest.mock('../../api/sync');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
      })),
    })),
    removeChannel: jest.fn(),
  },
  isSupabaseMock: jest.fn(() => false),
}));

const mockNavigator = {
  onLine: true,
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

describe('syncService', () => {
  const userId = 'test-user-id';
  const mockSnapshot = { pet: { id: 'pet-1' }, profile: { coins: 100 } };

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigator.onLine = true;
    (isSupabaseMock as jest.Mock).mockReturnValue(false);
    (captureAppState as jest.Mock).mockResolvedValue(mockSnapshot);
    (offlineStorage.saveState as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.queueOperation as jest.Mock).mockResolvedValue('op-id');
    (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue([]);
    (offlineStorage.removeQueuedOperation as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.incrementRetry as jest.Mock).mockResolvedValue(undefined);
  });

  describe('saveToCloud', () => {
    it('should save state to cloud successfully', async () => {
      (fetchCloudState as jest.Mock).mockResolvedValue({
        state: { version: 1 },
      });
      (pushCloudState as jest.Mock).mockResolvedValue({
        state: { version: 2 },
        conflicts: [],
      });

      const result = await saveToCloud(userId);

      expect(result.success).toBe(true);
      expect(captureAppState).toHaveBeenCalledWith(userId);
      expect(pushCloudState).toHaveBeenCalled();
      expect(offlineStorage.saveState).toHaveBeenCalled();
    });

    it('should queue operation when offline', async () => {
      mockNavigator.onLine = false;

      const result = await saveToCloud(userId);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Offline');
      expect(offlineStorage.queueOperation).toHaveBeenCalled();
    });

    it('should retry on failure', async () => {
      (fetchCloudState as jest.Mock).mockResolvedValue({
        state: { version: 1 },
      });
      (pushCloudState as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          state: { version: 2 },
          conflicts: [],
        });

      const result = await saveToCloud(userId);

      expect(result.success).toBe(true);
      expect(pushCloudState).toHaveBeenCalledTimes(2);
    });

    it('should queue operation after max retries', async () => {
      (fetchCloudState as jest.Mock).mockResolvedValue({
        state: { version: 1 },
      });
      (pushCloudState as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await saveToCloud(userId);

      expect(result.success).toBe(false);
      expect(offlineStorage.queueOperation).toHaveBeenCalled();
    });

    it('should return error for invalid user', async () => {
      (isSupabaseMock as jest.Mock).mockReturnValue(true);

      const result = await saveToCloud('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid user');
    });
  });

  describe('restoreFromCloud', () => {
    it('should restore state from cloud', async () => {
      const cloudState = {
        snapshot: mockSnapshot,
        last_modified: new Date().toISOString(),
        device_id: 'device-1',
        version: 1,
      };

      (fetchCloudState as jest.Mock).mockResolvedValue({
        state: cloudState,
        conflicts: [],
      });
      (restoreAppState as jest.Mock).mockResolvedValue({
        restored: true,
        errors: [],
      });

      const result = await restoreFromCloud(userId);

      expect(result.success).toBe(true);
      expect(result.restored).toBe(true);
      expect(restoreAppState).toHaveBeenCalledWith(userId, mockSnapshot);
    });

    it('should fallback to offline storage when cloud unavailable', async () => {
      mockNavigator.onLine = false;
      (fetchCloudState as jest.Mock).mockRejectedValue(new Error('Network error'));

      const offlineState = {
        snapshot: mockSnapshot,
        lastModified: new Date().toISOString(),
        version: 1,
      };

      (offlineStorage.loadState as jest.Mock).mockResolvedValue(offlineState);
      (restoreAppState as jest.Mock).mockResolvedValue({
        restored: true,
        errors: [],
      });

      const result = await restoreFromCloud(userId);

      expect(result.success).toBe(true);
      expect(offlineStorage.loadState).toHaveBeenCalledWith(userId);
    });

    it('should return empty result when no state available', async () => {
      (fetchCloudState as jest.Mock).mockRejectedValue(new Error('Network error'));
      (offlineStorage.loadState as jest.Mock).mockResolvedValue(null);

      const result = await restoreFromCloud(userId);

      expect(result.success).toBe(true);
      expect(result.restored).toBe(false);
    });
  });

  describe('processSyncQueue', () => {
    it('should process queued operations', async () => {
      const queuedOps = [
        {
          id: 'op-1',
          type: 'update' as const,
          table: 'cloud_sync',
          data: mockSnapshot,
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue(queuedOps);
      (saveToCloud as jest.Mock).mockResolvedValue({
        success: true,
        conflicts: [],
        restored: false,
      });

      const result = await processSyncQueue(userId);

      expect(result.processed).toBe(1);
      expect(result.failed).toBe(0);
      expect(offlineStorage.removeQueuedOperation).toHaveBeenCalledWith('op-1');
    });

    it('should increment retry count on failure', async () => {
      const queuedOps = [
        {
          id: 'op-1',
          type: 'update' as const,
          table: 'cloud_sync',
          data: mockSnapshot,
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue(queuedOps);
      (saveToCloud as jest.Mock).mockResolvedValue({
        success: false,
        conflicts: [],
        restored: false,
        error: 'Sync failed',
      });

      const result = await processSyncQueue(userId);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(1);
      expect(offlineStorage.incrementRetry).toHaveBeenCalledWith('op-1');
    });

    it('should remove operations after max retries', async () => {
      const queuedOps = [
        {
          id: 'op-1',
          type: 'update' as const,
          table: 'cloud_sync',
          data: mockSnapshot,
          timestamp: Date.now(),
          retries: 3, // Max retries
        },
      ];

      (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue(queuedOps);
      (saveToCloud as jest.Mock).mockResolvedValue({
        success: false,
        conflicts: [],
        restored: false,
        error: 'Sync failed',
      });

      const result = await processSyncQueue(userId);

      expect(result.failed).toBe(1);
      expect(offlineStorage.removeQueuedOperation).toHaveBeenCalledWith('op-1');
    });

    it('should return early when offline', async () => {
      mockNavigator.onLine = false;

      const result = await processSyncQueue(userId);

      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('setupRealtimeSync', () => {
    it('should setup realtime subscription', () => {
      const onStateChange = jest.fn();
      const cleanup = setupRealtimeSync(userId, onStateChange);

      expect(supabase.channel).toHaveBeenCalledWith(`sync-${userId}`);
      expect(cleanup).toBeDefined();
    });

    it('should return no-op cleanup for mock mode', () => {
      (isSupabaseMock as jest.Mock).mockReturnValue(true);

      const cleanup = setupRealtimeSync('', jest.fn());

      expect(typeof cleanup).toBe('function');
      cleanup(); // Should not throw
    });
  });
});
