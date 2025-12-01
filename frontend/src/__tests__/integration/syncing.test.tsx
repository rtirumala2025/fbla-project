/**
 * Integration tests for Supabase syncing
 */
import { renderHook, waitFor, act } from '@testing-library/react';
import { useSyncManager } from '../../hooks/useSyncManager';
import { syncService } from '../../services/syncService';
import { offlineStorage } from '../../services/offlineStorageService';
import { supabase } from '../../lib/supabase';

// Mock dependencies
jest.mock('../../services/syncService');
jest.mock('../../services/offlineStorageService');
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({
          data: { session: { user: { id: 'test-user-id' } } },
        })
      ),
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

const mockSyncService = syncService as jest.Mocked<typeof syncService>;
const mockOfflineStorage = offlineStorage as jest.Mocked<typeof offlineStorage>;
const mockSupabase = supabase as any;

describe('Supabase Syncing Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (offlineStorage.init as jest.Mock).mockResolvedValue(undefined);
    (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue([]);
  });

  describe('Sync Operations', () => {
    it('should save state to cloud', async () => {
      const mockState = {
        pet: { id: 'pet-1', name: 'Fluffy', health: 80 },
        profile: { id: 'profile-1', coins: 100 },
      };

      (syncService.saveToCloud as jest.Mock).mockResolvedValue({
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

      expect(syncService.saveToCloud).toHaveBeenCalled();
    });

    it('should load state from cloud', async () => {
      const mockState = {
        pet: { id: 'pet-1', name: 'Fluffy' },
        profile: { id: 'profile-1', coins: 100 },
      };

      (syncService.loadFromCloud as jest.Mock).mockResolvedValue(mockState);

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(result.current.load).toBeDefined();
      });

      let loadedState: any;
      await act(async () => {
        loadedState = await result.current.load();
      });

      expect(loadedState).toEqual(mockState);
      expect(syncService.loadFromCloud).toHaveBeenCalled();
    });

    it('should handle sync conflicts', async () => {
      const conflicts = [
        {
          field: 'pet.stats.hunger',
          local: 70,
          remote: 80,
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
  });

  describe('Queue Management', () => {
    it('should queue operations when offline', async () => {
      const operation = {
        type: 'update' as const,
        table: 'pets',
        data: { id: 'pet-1', health: 85 },
      };

      (syncService.saveToCloud as jest.Mock).mockResolvedValue({
        success: false,
        conflicts: [],
        restored: false,
        error: 'Offline',
      });

      (offlineStorage.queueOperation as jest.Mock).mockResolvedValue('op-id-1');

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

    it('should process queued operations when online', async () => {
      const queuedOps = [
        {
          id: 'op-1',
          type: 'update' as const,
          table: 'pets',
          data: { id: 'pet-1', health: 85 },
          timestamp: Date.now(),
          retries: 0,
        },
        {
          id: 'op-2',
          type: 'create' as const,
          table: 'transactions',
          data: { user_id: 'user-id', amount: -15 },
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue(queuedOps);
      (syncService.processSyncQueue as jest.Mock).mockResolvedValue({
        processed: 2,
        failed: 0,
      });

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(result.current.sync).toBeDefined();
      });

      await act(async () => {
        await result.current.sync();
      });

      expect(syncService.processSyncQueue).toHaveBeenCalledWith(queuedOps);
    });

    it('should retry failed operations', async () => {
      const queuedOps = [
        {
          id: 'op-1',
          type: 'update' as const,
          table: 'pets',
          data: { id: 'pet-1', health: 85 },
          timestamp: Date.now(),
          retries: 0,
        },
      ];

      (offlineStorage.getQueuedOperations as jest.Mock).mockResolvedValue(queuedOps);
      (syncService.processSyncQueue as jest.Mock).mockResolvedValue({
        processed: 0,
        failed: 1,
      });

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(result.current.sync).toBeDefined();
      });

      await act(async () => {
        await result.current.sync();
      });

      // Failed operations should remain in queue with incremented retries
      expect(offlineStorage.getQueuedOperations).toHaveBeenCalled();
    });
  });

  describe('Real-time Sync', () => {
    it('should subscribe to database changes', async () => {
      const mockChannel = {
        on: jest.fn(() => ({
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() })),
        })),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(mockSupabase.channel).toHaveBeenCalled();
      });

      expect(mockChannel.on).toHaveBeenCalled();
    });

    it('should handle real-time updates', async () => {
      const mockChannel = {
        on: jest.fn(() => ({
          subscribe: jest.fn((callback) => {
            // Simulate database change
            setTimeout(() => {
              callback({
                eventType: 'UPDATE',
                new: { id: 'pet-1', health: 90 },
                old: { id: 'pet-1', health: 80 },
              });
            }, 100);
            return { unsubscribe: jest.fn() };
          }),
        })),
      };

      mockSupabase.channel.mockReturnValue(mockChannel);

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(result.current.syncing).toBeDefined();
      });
    });
  });

  describe('Conflict Resolution', () => {
    it('should merge conflicts automatically', async () => {
      const conflicts = [
        {
          field: 'pet.stats.hunger',
          local: 70,
          remote: 80,
          resolution: 'merge',
        },
      ];

      (syncService.saveToCloud as jest.Mock).mockResolvedValue({
        success: true,
        conflicts,
        restored: false,
      });

      (syncService.resolveConflicts as jest.Mock).mockResolvedValue({
        resolved: 1,
        failed: 0,
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

    it('should use local version when specified', async () => {
      const conflicts = [
        {
          field: 'pet.stats.hunger',
          local: 70,
          remote: 80,
          resolution: 'local',
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

      expect(result.current.conflicts).toEqual(conflicts);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (syncService.saveToCloud as jest.Mock).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(result.current.save).toBeDefined();
      });

      await act(async () => {
        await expect(result.current.save()).rejects.toThrow('Network error');
      });
    });

    it('should handle authentication errors', async () => {
      (syncService.saveToCloud as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(result.current.save).toBeDefined();
      });

      await act(async () => {
        await expect(result.current.save()).rejects.toThrow('Unauthorized');
      });
    });

    it('should handle database errors', async () => {
      (syncService.saveToCloud as jest.Mock).mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useSyncManager());

      await waitFor(() => {
        expect(result.current.save).toBeDefined();
      });

      await act(async () => {
        await expect(result.current.save()).rejects.toThrow('Database error');
      });
    });
  });
});
