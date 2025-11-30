/**
 * Enhanced useSyncManager Hook
 * Manages cloud sync state, conflict resolution, offline queue, and real-time subscriptions
 * Integrates with state capture service and offline storage
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCloudState } from '../api/sync';
import { supabase, isSupabaseMock } from '../lib/supabase';
import type { CloudSyncState } from '../types/sync';
import { saveToCloud, restoreFromCloud, processSyncQueue, setupRealtimeSync } from '../services/syncService';
import { captureAppState } from '../services/stateCaptureService';
import { offlineStorage } from '../services/offlineStorageService';
import { useOfflineStatus } from './useOfflineStatus';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'conflict' | 'restoring';

export interface SyncManagerResult {
  status: SyncStatus;
  conflicts: Array<Record<string, unknown>>;
  cloudState: CloudSyncState | null;
  lastSynced: number | null;
  queuedOperations: number;
  save: (options?: { force?: boolean; silent?: boolean }) => Promise<void>;
  restore: (options?: { force?: boolean; silent?: boolean }) => Promise<void>;
  refresh: (options?: { force?: boolean; silent?: boolean }) => Promise<void>;
  clearConflicts: () => void;
  enqueueChange: (change: Record<string, unknown>) => Promise<void>;
  deviceId: string;
}

export function useSyncManager(): SyncManagerResult {
  const [cloudState, setCloudState] = useState<CloudSyncState | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [conflicts, setConflicts] = useState<Array<Record<string, unknown>>>([]);
  const [lastSynced, setLastSynced] = useState<number | null>(null);
  const [queuedOperations, setQueuedOperations] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const deviceId = useMemo(() => {
    if (typeof window === 'undefined') return 'server';
    let id = sessionStorage.getItem('device_id');
    if (!id) {
      id = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('device_id', id);
    }
    return id;
  }, []);
  const offlineStatus = useOfflineStatus();
  const realtimeCleanupRef = useRef<(() => void) | null>(null);

  // Get user ID from Supabase session
  useEffect(() => {
    const getUserId = async () => {
      if (isSupabaseMock()) {
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUserId(session?.user?.id || null);
      } catch (error) {
        console.warn('Failed to get user ID:', error);
      }
    };
    getUserId();
  }, []);

  // Save state to cloud
  const save = useCallback(
    async (options: { force?: boolean; silent?: boolean } = {}) => {
      if (!userId) return;

      setStatus('syncing');
      try {
        const result = await saveToCloud(userId, options);
        if (result.success) {
          setStatus('idle');
          setConflicts(result.conflicts);
          setLastSynced(Date.now());
          
          // Update cloud state
          const response = await fetchCloudState();
          setCloudState(response.state);
        } else {
          if (result.error?.includes('Offline')) {
            setStatus('offline');
          } else {
            setStatus('idle');
          }
        }
      } catch (error) {
        console.error('Save failed:', error);
        setStatus(offlineStatus.offline ? 'offline' : 'idle');
      }
    },
    [userId, offlineStatus.offline],
  );

  // Restore state from cloud or offline
  const restore = useCallback(
    async (options: { force?: boolean; silent?: boolean } = {}) => {
      if (!userId) return;

      setStatus('restoring');
      try {
        const result = await restoreFromCloud(userId, options);
        if (result.success || result.restored) {
          setStatus('idle');
          setConflicts(result.conflicts);
          
          // Update cloud state
          const response = await fetchCloudState();
          setCloudState(response.state);
        } else {
          setStatus('idle');
        }
      } catch (error) {
        console.error('Restore failed:', error);
        setStatus('idle');
      }
    },
    [userId],
  );

  // Clear conflicts
  const clearConflicts = useCallback(() => {
    setConflicts([]);
    if (status === 'conflict') {
      setStatus('idle');
    }
  }, [status]);

  // Initialize: restore state on mount
  useEffect(() => {
    if (!userId) return;

    const initialize = async () => {
      // Initialize offline storage
      await offlineStorage.init();

      // Try to restore from cloud/offline
      await restore({ silent: true });

      // Process any queued operations
      if (navigator.onLine) {
        const { processed, failed } = await processSyncQueue(userId);
        if (processed > 0 || failed > 0) {
          // Refresh state after processing queue
          await save({ silent: true });
        }
      }

      // Update queued operations count
      const queued = await offlineStorage.getQueuedOperations();
      setQueuedOperations(queued.length);
    };

    void initialize();
  }, [userId, restore, save]);

  // Setup real-time subscription for sync changes
  useEffect(() => {
    if (!userId || isSupabaseMock()) return;

    const cleanup = setupRealtimeSync(userId, (state) => {
      setCloudState(state);
      setLastSynced(Date.now());
    });

    realtimeCleanupRef.current = cleanup;

    return () => {
      if (realtimeCleanupRef.current) {
        realtimeCleanupRef.current();
      }
    };
  }, [userId]);

  // Handle online/offline transitions
  useEffect(() => {
    if (!userId) return;

    const handleOnline = async () => {
      setStatus('syncing');
      
      // Process queued operations
      const { processed, failed } = await processSyncQueue(userId);
      
      // Update queued count
      const queued = await offlineStorage.getQueuedOperations();
      setQueuedOperations(queued.length);

      // Save current state
      await save({ silent: true });
    };

    const handleOffline = () => {
      setStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [userId, save]);

  // Auto-save on state changes (debounced)
  useEffect(() => {
    if (!userId || status === 'syncing' || status === 'restoring') return;

    const timeoutId = setTimeout(() => {
      // Only auto-save if online and not recently synced
      if (navigator.onLine && (!lastSynced || Date.now() - lastSynced > 30000)) {
        void save({ silent: true });
      }
    }, 5000); // 5 second debounce

    return () => clearTimeout(timeoutId);
  }, [userId, status, lastSynced, save]);

  // Update queued operations count periodically
  useEffect(() => {
    if (!userId) return;

    const updateQueueCount = async () => {
      const queued = await offlineStorage.getQueuedOperations();
      setQueuedOperations(queued.length);
    };

    const interval = setInterval(updateQueueCount, 10000); // Every 10 seconds
    updateQueueCount();

    return () => clearInterval(interval);
  }, [userId]);

  // Refresh function (alias for restore)
  const refresh = useCallback(
    async (options?: { force?: boolean; silent?: boolean }) => {
      await restore(options);
    },
    [restore],
  );

  // Enqueue change for offline sync
  const enqueueChange = useCallback(
    async (change: Record<string, unknown>) => {
      if (!userId) return;
      
      try {
        await offlineStorage.queueOperation({
          type: 'update',
          table: 'app_state',
          data: change,
        });
        
        // Update queued count
        const queued = await offlineStorage.getQueuedOperations();
        setQueuedOperations(queued.length);
      } catch (error) {
        console.error('Failed to enqueue change:', error);
      }
    },
    [userId],
  );

  return {
    status,
    conflicts,
    cloudState,
    lastSynced,
    queuedOperations,
    save,
    restore,
    refresh,
    clearConflicts,
    enqueueChange,
    deviceId,
  };
}

