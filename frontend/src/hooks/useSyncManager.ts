import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchCloudState, pushCloudState } from '../api/sync';
import type { CloudSyncState, SyncPushRequest } from '../types/sync';

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'conflict';

const LOCAL_QUEUE_KEY = 'virtual-pet.sync.queue';
const DEVICE_ID_KEY = 'virtual-pet.sync.device';

interface ChangeRecord {
  snapshot: CloudSyncState['snapshot'];
  last_modified: string;
  enqueued_at: number;
}

function loadQueue(): ChangeRecord[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChangeRecord[];
  } catch (error) {
    console.warn('Failed to read sync queue', error);
    return [];
  }
}

function saveQueue(queue: ChangeRecord[]) {
  try {
    window.localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(queue));
  } catch (error) {
    console.warn('Failed to write sync queue', error);
  }
}

function getDeviceId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const generated = `device-${crypto.randomUUID()}`;
  window.localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

export function useSyncManager() {
  const [cloudState, setCloudState] = useState<CloudSyncState | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [conflicts, setConflicts] = useState<Array<Record<string, unknown>>>([]);
  const queueRef = useRef<ChangeRecord[]>([]);
  const deviceId = useMemo(() => (typeof window !== 'undefined' ? getDeviceId() : 'server'), []);

  const enqueueChange = useCallback((snapshot: CloudSyncState['snapshot'], lastModified: string) => {
    const queue = [...queueRef.current, { snapshot, last_modified: lastModified, enqueued_at: Date.now() }];
    queueRef.current = queue;
    saveQueue(queue);
    setStatus((prev) => (prev === 'offline' ? prev : 'syncing'));
  }, []);

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
        saveQueue(queueRef.current);
      } catch (error) {
        console.warn('Sync flush failed', error);
        setStatus('offline');
        return;
      }
    }
    if (!queueRef.current.length && status !== 'conflict') {
      setStatus('idle');
    }
  }, [cloudState, deviceId, status]);

  const pullCloudState = useCallback(async () => {
    setStatus('syncing');
    try {
      const response = await fetchCloudState();
      setCloudState(response.state);
      setConflicts(response.conflicts ?? []);
      queueRef.current = loadQueue();
      setStatus(queueRef.current.length ? 'syncing' : 'idle');
    } catch (error) {
      console.warn('Failed to fetch cloud state', error);
      queueRef.current = loadQueue();
      setStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    queueRef.current = loadQueue();
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
  }, [flushQueue, pullCloudState]);

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


