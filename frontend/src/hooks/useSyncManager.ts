/**
 * useSyncManager Hook
 * Manages cloud sync state, conflict resolution, and offline queue
 * Uses Supabase cloud_sync_snapshots table instead of localStorage
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCloudState, pushCloudState } from '../api/sync';
import { supabase, isSupabaseMock } from '../lib/supabase';
import type { CloudSyncState, SyncPushRequest } from '../types/sync';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'conflict';

interface ChangeRecord {
  snapshot: CloudSyncState['snapshot'];
  last_modified: string;
  enqueued_at: number;
}

// Device ID stored in component state (no localStorage)
// Future: Could store in Supabase user_preferences or device table
function generateDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  return `device-${crypto.randomUUID()}`;
}

// Load queue from Supabase cloud_sync_snapshots (no localStorage)
async function loadQueueFromSupabase(userId: string | null): Promise<ChangeRecord[]> {
  if (!userId || isSupabaseMock()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('cloud_sync_snapshots')
      .select('snapshot, last_modified')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('Failed to load sync queue from Supabase:', error);
      return [];
    }

    if (data && data.snapshot) {
      // Convert Supabase snapshot to ChangeRecord format
      return [{
        snapshot: data.snapshot as CloudSyncState['snapshot'],
        last_modified: data.last_modified || new Date().toISOString(),
        enqueued_at: Date.now(),
      }];
    }

    return [];
  } catch (error) {
    console.warn('Error loading sync queue:', error);
    return [];
  }
}

// Save queue to Supabase (no localStorage)
async function saveQueueToSupabase(userId: string | null, queue: ChangeRecord[], deviceId: string): Promise<void> {
  if (!userId || isSupabaseMock() || !queue.length) {
    return;
  }

  try {
    // Use the latest change in the queue
    const latestChange = queue[queue.length - 1];
    
    await supabase
      .from('cloud_sync_snapshots')
      .upsert({
        user_id: userId,
        snapshot: latestChange.snapshot,
        last_modified: latestChange.last_modified,
        last_device_id: deviceId,
      }, {
        onConflict: 'user_id',
      });
  } catch (error) {
    console.warn('Failed to save sync queue to Supabase:', error);
  }
}

export function useSyncManager() {
  const [cloudState, setCloudState] = useState<CloudSyncState | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [conflicts, setConflicts] = useState<Array<Record<string, unknown>>>([]);
  const queueRef = useRef<ChangeRecord[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const deviceId = useMemo(() => (typeof window !== 'undefined' ? generateDeviceId() : 'server'), []);

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

  const enqueueChange = useCallback(async (snapshot: CloudSyncState['snapshot'], lastModified: string) => {
    const queue = [...queueRef.current, { snapshot, last_modified: lastModified, enqueued_at: Date.now() }];
    queueRef.current = queue;
    // Save to Supabase instead of localStorage
    await saveQueueToSupabase(userId, queue, deviceId);
    setStatus((prev) => (prev === 'offline' ? prev : 'syncing'));
  }, [userId, deviceId]);

  const flushQueue = useCallback(async () => {
    if (!queueRef.current.length || !cloudState) return;
    setStatus('syncing');
    const queue = [...queueRef.current];
    for (const change of queue) {
      try {
        const payload: SyncPushRequest = {
          snapshot: change.snapshot,
          last_modified: change.last_modified,
          device_id: deviceId,
          version: cloudState.version,
        };
        const response = await pushCloudState(payload);
        setCloudState(response.state);
        if (response.conflicts.length) {
          setConflicts(response.conflicts);
          setStatus('conflict');
        }
        queueRef.current = queueRef.current.filter((item) => item !== change);
        // Save to Supabase instead of localStorage
        await saveQueueToSupabase(userId, queueRef.current, deviceId);
      } catch (error) {
        console.warn('Sync flush failed', error);
        setStatus('offline');
        return;
      }
    }
    if (!queueRef.current.length && status !== 'conflict') {
      setStatus('idle');
    }
  }, [cloudState, deviceId, status, userId]);

  const pullCloudState = useCallback(async () => {
    setStatus('syncing');
    try {
      const response = await fetchCloudState();
      setCloudState(response.state);
      setConflicts(response.conflicts ?? []);
      // Load from Supabase instead of localStorage
      queueRef.current = await loadQueueFromSupabase(userId);
      setStatus(queueRef.current.length ? 'syncing' : 'idle');
    } catch (error) {
      console.warn('Failed to fetch cloud state', error);
      // Load from Supabase even on error
      queueRef.current = await loadQueueFromSupabase(userId);
      setStatus('offline');
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load queue from Supabase on mount
    loadQueueFromSupabase(userId).then((queue) => {
      queueRef.current = queue;
    });
    
    void pullCloudState();

    const onOnline = () => {
      setStatus(queueRef.current.length ? 'syncing' : 'idle');
      void pullCloudState().then(flushQueue).catch(() => {
        setStatus('offline');
      });
    };
    const onOffline = () => setStatus('offline');

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [flushQueue, pullCloudState, userId]);

  useEffect(() => {
    if (status === 'syncing') {
      void flushQueue();
    }
  }, [flushQueue, status]);

  const clearConflicts = useCallback(() => {
    setConflicts([]);
    setStatus(queueRef.current.length ? 'syncing' : 'idle');
  }, []);

  return {
    status,
    conflicts,
    cloudState,
    enqueueChange,
    refresh: pullCloudState,
    flush: flushQueue,
    deviceId,
    clearConflicts,
  };
}

