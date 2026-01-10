/**
 * Enhanced Sync Service
 * Handles cloud save, offline mode, and conflict resolution with retry logic
 */
import { fetchCloudState, pushCloudState } from '../api/sync';
import { captureAppState, restoreAppState } from './stateCaptureService';
import { offlineStorage } from './offlineStorageService';
import type { CloudSyncState, SyncSnapshot } from '../types/sync';
import { supabase, isSupabaseMock } from '../lib/supabase';

export interface SyncOptions {
  force?: boolean;
  silent?: boolean;
}

export interface SyncResult {
  success: boolean;
  conflicts: Array<Record<string, unknown>>;
  restored: boolean;
  error?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000; // Start with 3 seconds
const MAX_RETRY_DELAY_MS = 60000; // Max 60 seconds

// Global circuit breaker for rate limiting (shared across all hook instances)
let globalRateLimitUntil = 0;

/**
 * Exponential backoff delay calculation
 */
function getRetryDelay(retryCount: number): number {
  const delay = Math.min(RETRY_DELAY_MS * Math.pow(2, retryCount), MAX_RETRY_DELAY_MS);
  return delay + Math.random() * 1000; // Add jitter
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Save state to cloud with retry logic
 */
export async function saveToCloud(
  userId: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  if (isSupabaseMock() || !userId) {
    return { success: false, conflicts: [], restored: false, error: 'Invalid user or mock mode' };
  }

  // Global circuit breaker check
  if (Date.now() < globalRateLimitUntil && !options.force) {
    const waitSeconds = Math.ceil((globalRateLimitUntil - Date.now()) / 1000);
    if (!options.silent) console.warn(`Sync blocked: Global rate limit active for ${waitSeconds}s`);
    return { success: false, conflicts: [], restored: false, error: `Rate limited (wait ${waitSeconds}s)` };
  }

  try {
    // Capture current app state
    const snapshot = await captureAppState(userId);

    // Also save to offline storage
    const cloudState = await fetchCloudState().catch(() => null);
    const version = cloudState?.state.version || 1;
    await offlineStorage.saveState(userId, snapshot, version);

    // If offline, queue for later
    if (!navigator.onLine) {
      await offlineStorage.queueOperation({
        type: 'update',
        table: 'cloud_sync',
        data: snapshot,
      });
      return { success: false, conflicts: [], restored: false, error: 'Offline - queued for sync' };
    }

    // Push to cloud with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await pushCloudState({
          snapshot,
          last_modified: new Date().toISOString(),
          device_id: await getDeviceId(),
          version: cloudState?.state.version || 1,
        });

        // Update offline storage with new version
        await offlineStorage.saveState(userId, snapshot, response.state.version);

        return {
          success: true,
          conflicts: response.conflicts || [],
          restored: false,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Stop retrying on client errors (4xx) or if rate limited (429)
        const isClientError = lastError.message.includes('406') || lastError.message.includes('429');
        if (isClientError) {
          console.warn('Sync aborted due to client/rate-limit error:', lastError.message);

          if (lastError.message.includes('429')) {
            console.warn('Hit 429 rate limit. Activating global circuit breaker for 60s.');
            globalRateLimitUntil = Date.now() + 60000;
          }

          // Don't just break, throw to stop the queue processor too
          throw lastError;
        }

        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          if (!options.silent) {
            console.log(`Sync attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
          }
          await sleep(delay);
        }
      }
    }

    // All retries failed, queue for later
    await offlineStorage.queueOperation({
      type: 'update',
      table: 'cloud_sync',
      data: snapshot,
    });

    return {
      success: false,
      conflicts: [],
      restored: false,
      error: lastError?.message || 'Sync failed after retries',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      conflicts: [],
      restored: false,
      error: errorMessage,
    };
  }
}

/**
 * Restore state from cloud or offline storage
 */
export async function restoreFromCloud(
  userId: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  if (isSupabaseMock() || !userId) {
    return { success: false, conflicts: [], restored: false, error: 'Invalid user or mock mode' };
  }

  try {
    let cloudState: CloudSyncState | null = null;
    let conflicts: Array<Record<string, unknown>> = [];

    // Try to fetch from cloud first
    if (navigator.onLine) {
      try {
        const response = await fetchCloudState();
        cloudState = response.state;
        conflicts = response.conflicts || [];
      } catch (error) {
        console.warn('Failed to fetch from cloud, trying offline storage:', error);
      }
    }

    // If no cloud state, try offline storage
    if (!cloudState) {
      const offlineState = await offlineStorage.loadState(userId);
      if (offlineState) {
        cloudState = {
          snapshot: offlineState.snapshot as SyncSnapshot,
          last_modified: offlineState.lastModified,
          device_id: await getDeviceId(),
          version: offlineState.version,
        };
      }
    }

    // If still no state, return empty
    if (!cloudState) {
      return { success: true, conflicts: [], restored: false };
    }

    // Restore state
    const restoreResult = await restoreAppState(userId, cloudState.snapshot);

    return {
      success: restoreResult.restored,
      conflicts,
      restored: restoreResult.restored,
      error: restoreResult.errors.length > 0 ? restoreResult.errors.join('; ') : undefined,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      conflicts: [],
      restored: false,
      error: errorMessage,
    };
  }
}

/**
 * Process queued operations when back online
 */
export async function processSyncQueue(userId: string): Promise<{ processed: number; failed: number }> {
  if (isSupabaseMock() || !userId || !navigator.onLine) {
    return { processed: 0, failed: 0 };
  }

  const queuedOps = await offlineStorage.getQueuedOperations();
  if (queuedOps.length === 0) {
    return { processed: 0, failed: 0 };
  }

  console.log(`Processing ${queuedOps.length} queued sync operations...`);
  let processed = 0;
  let failed = 0;

  try {
    // Since saveToCloud captures the ENTIRE current state, one save covers all pending updates.
    // We don't need to save for every queued op.
    const result = await saveToCloud(userId, { silent: true });

    if (result.success) {
      // If successful, we can clear ALL queued operations
      for (const op of queuedOps) {
        await offlineStorage.removeQueuedOperation(op.id);
        processed++;
      }
    } else {
      // If failed, increment retries for all
      for (const op of queuedOps) {
        await offlineStorage.incrementRetry(op.id);
        if (op.retries >= MAX_RETRIES) {
          await offlineStorage.removeQueuedOperation(op.id);
          failed++;
        }
      }
      failed += queuedOps.length; // Count as failed attempt
    }

  } catch (error: any) {
    // Check for rate limit
    if (error?.message?.includes('429')) {
      console.warn('Rate limited processing queue, halting for 30s');
      globalRateLimitUntil = Date.now() + 60000;
    }
    failed++;
  }


  return { processed, failed };
}

/**
 * Get or generate device ID
 */
async function getDeviceId(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'server';
  }

  // Try to get from sessionStorage first
  let deviceId = sessionStorage.getItem('device_id');
  if (deviceId) {
    return deviceId;
  }

  // Generate new device ID
  deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  sessionStorage.setItem('device_id', deviceId);
  return deviceId;
}

/**
 * Setup real-time subscription for sync state changes
 */
export function setupRealtimeSync(
  userId: string,
  onStateChange: (state: CloudSyncState) => void,
): () => void {
  if (isSupabaseMock() || !userId) {
    return () => { }; // No-op cleanup
  }

  const channel = supabase
    .channel(`sync-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'cloud_sync_snapshots',
        filter: `user_id=eq.${userId}`,
      },
      async (payload) => {
        // Fetch latest state when cloud snapshot changes
        try {
          const response = await fetchCloudState();
          onStateChange(response.state);
        } catch (error) {
          console.warn('Failed to fetch state after realtime change:', error);
        }
      },
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(channel);
  };
}
