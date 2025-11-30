/**
 * Offline Storage Service
 * Uses IndexedDB for persistent offline storage
 */
const DB_NAME = 'virtual-pet-offline';
const DB_VERSION = 1;
const STORE_NAMES = {
  STATE: 'app_state',
  QUEUE: 'sync_queue',
  CACHE: 'cache',
} as const;

interface StoredState {
  snapshot: unknown;
  lastModified: string;
  version: number;
}

interface QueuedOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: unknown;
  timestamp: number;
  retries: number;
}

class OfflineStorageService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB database
   */
  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        console.warn('IndexedDB not available');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAMES.STATE)) {
          const stateStore = db.createObjectStore(STORE_NAMES.STATE, { keyPath: 'userId' });
          stateStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.QUEUE)) {
          const queueStore = db.createObjectStore(STORE_NAMES.QUEUE, { keyPath: 'id' });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('retries', 'retries', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.CACHE)) {
          const cacheStore = db.createObjectStore(STORE_NAMES.CACHE, { keyPath: 'key' });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        } else {
          // Ensure index exists for existing stores
          const cacheStore = (event.target as IDBOpenDBRequest).transaction?.objectStore(STORE_NAMES.CACHE);
          if (cacheStore && !cacheStore.indexNames.contains('expiresAt')) {
            cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          }
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Save app state to offline storage
   */
  async saveState(userId: string, snapshot: unknown, version: number): Promise<void> {
    await this.init();

    if (!this.db) {
      console.warn('IndexedDB not available, cannot save state');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.STATE], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.STATE);

      const state: StoredState = {
        snapshot,
        lastModified: new Date().toISOString(),
        version,
      };

      const request = store.put({ userId, ...state });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Load app state from offline storage
   */
  async loadState(userId: string): Promise<StoredState | null> {
    await this.init();

    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.STATE], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.STATE);
      const request = store.get(userId);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            snapshot: result.snapshot,
            lastModified: result.lastModified,
            version: result.version,
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Queue an operation for sync when online
   */
  async queueOperation(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    await this.init();

    if (!this.db) {
      throw new Error('IndexedDB not available');
    }

    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const queuedOp: QueuedOperation = {
      id,
      ...operation,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.QUEUE);
      const request = store.add(queuedOp);

      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all queued operations
   */
  async getQueuedOperations(): Promise<QueuedOperation[]> {
    await this.init();

    if (!this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.QUEUE], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.QUEUE);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove a queued operation (after successful sync)
   */
  async removeQueuedOperation(id: string): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Increment retry count for a queued operation
   */
  async incrementRetry(id: string): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.QUEUE], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.QUEUE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.retries += 1;
          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Clear all offline storage
   */
  async clear(): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [STORE_NAMES.STATE, STORE_NAMES.QUEUE, STORE_NAMES.CACHE],
        'readwrite',
      );

      let completed = 0;
      const total = 3;

      const checkComplete = () => {
        completed++;
        if (completed === total) {
          resolve();
        }
      };

      transaction.objectStore(STORE_NAMES.STATE).clear().onsuccess = checkComplete;
      transaction.objectStore(STORE_NAMES.QUEUE).clear().onsuccess = checkComplete;
      transaction.objectStore(STORE_NAMES.CACHE).clear().onsuccess = checkComplete;

      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Get cached item by key
   */
  async getCachedItem<T>(key: string): Promise<T | null> {
    await this.init();

    if (!this.db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.CACHE], 'readonly');
      const store = transaction.objectStore(STORE_NAMES.CACHE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if expired
          const now = Date.now();
          if (result.expiresAt && result.expiresAt < now) {
            // Expired, remove it
            this.removeCachedItem(key).then(() => resolve(null)).catch(() => resolve(null));
            return;
          }
          // Return the full cached data structure
          resolve(result as T);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Set cached item with expiration
   */
  async setCachedItem<T>(key: string, data: T | { data: T; timestamp: number; expiresAt: number }, ttl?: number): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    const now = Date.now();
    let cachedItem: { key: string; data: T; timestamp: number; expiresAt: number };
    
    // Handle both direct data and CachedData format
    if (data && typeof data === 'object' && 'data' in data && 'timestamp' in data && 'expiresAt' in data) {
      // Already in CachedData format
      cachedItem = {
        key,
        data: (data as { data: T; timestamp: number; expiresAt: number }).data,
        timestamp: (data as { data: T; timestamp: number; expiresAt: number }).timestamp,
        expiresAt: (data as { data: T; timestamp: number; expiresAt: number }).expiresAt,
      };
    } else {
      // Direct data, wrap it
      const ttlMs = ttl || DEFAULT_TTL;
      cachedItem = {
        key,
        data: data as T,
        timestamp: now,
        expiresAt: now + ttlMs,
      };
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.CACHE);
      const request = store.put(cachedItem);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove cached item
   */
  async removeCachedItem(key: string): Promise<void> {
    await this.init();

    if (!this.db) {
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.CACHE);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear expired cache items
   */
  async clearExpiredCache(): Promise<number> {
    await this.init();

    if (!this.db) {
      return 0;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAMES.CACHE], 'readwrite');
      const store = transaction.objectStore(STORE_NAMES.CACHE);
      const index = store.index('expiresAt');
      const request = index.openCursor();
      const now = Date.now();
      let cleared = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          if (cursor.value.expiresAt < now) {
            cursor.delete();
            cleared++;
            cursor.continue();
          } else {
            // Items are ordered by expiresAt, so we can stop here
            resolve(cleared);
          }
        } else {
          resolve(cleared);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage size estimate
   */
  async getStorageSize(): Promise<{ state: number; queue: number; total: number }> {
    await this.init();

    if (!this.db || !navigator.storage || !navigator.storage.estimate) {
      return { state: 0, queue: 0, total: 0 };
    }

    try {
      const estimate = await navigator.storage.estimate();
      return {
        state: 0, // Can't get per-store size easily
        queue: 0,
        total: estimate.usage || 0,
      };
    } catch {
      return { state: 0, queue: 0, total: 0 };
    }
  }
}

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

// Export singleton instance
export const offlineStorage = new OfflineStorageService();

