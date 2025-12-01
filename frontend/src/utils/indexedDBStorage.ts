/**
 * IndexedDB utility for storing tutorial and tooltip progress
 * Provides persistent storage across browser sessions
 */

const DB_NAME = 'VirtualPetApp';
const DB_VERSION = 1;
const STORE_NAMES = {
  TUTORIAL: 'tutorial_progress',
  TOOLTIP: 'tooltip_dismissed',
  SETTINGS: 'user_settings',
} as const;

type StoreName = typeof STORE_NAMES[keyof typeof STORE_NAMES];

class IndexedDBStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB initialization failed:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORE_NAMES.TUTORIAL)) {
          const tutorialStore = db.createObjectStore(STORE_NAMES.TUTORIAL, {
            keyPath: 'id',
          });
          tutorialStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.TOOLTIP)) {
          const tooltipStore = db.createObjectStore(STORE_NAMES.TOOLTIP, {
            keyPath: 'key',
          });
          tooltipStore.createIndex('dismissedAt', 'dismissedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_NAMES.SETTINGS)) {
          db.createObjectStore(STORE_NAMES.SETTINGS, {
            keyPath: 'key',
          });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get a value from IndexedDB
   */
  private async get<T>(storeName: StoreName, key: string): Promise<T | null> {
    await this.init();

    if (!this.db) {
      console.warn('IndexedDB not initialized');
      return null;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onerror = () => {
        console.error(`Failed to get ${key} from ${storeName}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve(request.result?.value ?? null);
      };
    });
  }

  /**
   * Set a value in IndexedDB
   */
  private async set(storeName: StoreName, key: string, value: unknown): Promise<void> {
    await this.init();

    if (!this.db) {
      console.warn('IndexedDB not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Prepare the object based on store structure
      let data: any;
      if (storeName === STORE_NAMES.TUTORIAL) {
        data = { id: key, value, timestamp: Date.now() };
      } else {
        data = { key, value };
        if (storeName === STORE_NAMES.TOOLTIP) {
          data.dismissedAt = Date.now();
        }
      }

      const request = store.put(data);

      request.onerror = () => {
        console.error(`Failed to set ${key} in ${storeName}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Delete a value from IndexedDB
   */
  private async delete(storeName: StoreName, key: string): Promise<void> {
    await this.init();

    if (!this.db) {
      console.warn('IndexedDB not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => {
        console.error(`Failed to delete ${key} from ${storeName}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  /**
   * Clear all data from a store
   */
  private async clear(storeName: StoreName): Promise<void> {
    await this.init();

    if (!this.db) {
      console.warn('IndexedDB not initialized');
      return;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onerror = () => {
        console.error(`Failed to clear ${storeName}:`, request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  }

  // Tutorial progress methods
  async getTutorialProgress(tutorialId: string): Promise<number | null> {
    return this.get<number>(STORE_NAMES.TUTORIAL, tutorialId);
  }

  async saveTutorialProgress(tutorialId: string, stepIndex: number): Promise<void> {
    return this.set(STORE_NAMES.TUTORIAL, tutorialId, stepIndex);
  }

  async clearTutorialProgress(tutorialId: string): Promise<void> {
    return this.delete(STORE_NAMES.TUTORIAL, tutorialId);
  }

  async isTutorialCompleted(tutorialId: string, totalSteps: number): Promise<boolean> {
    const progress = await this.getTutorialProgress(tutorialId);
    return progress !== null && progress >= totalSteps - 1;
  }

  // Tooltip methods
  async isTooltipDismissed(tooltipKey: string): Promise<boolean> {
    const dismissed = await this.get<boolean>(STORE_NAMES.TOOLTIP, tooltipKey);
    return dismissed === true;
  }

  async dismissTooltip(tooltipKey: string): Promise<void> {
    return this.set(STORE_NAMES.TOOLTIP, tooltipKey, true);
  }

  async resetTooltip(tooltipKey: string): Promise<void> {
    return this.delete(STORE_NAMES.TOOLTIP, tooltipKey);
  }

  async resetAllTooltips(): Promise<void> {
    return this.clear(STORE_NAMES.TOOLTIP);
  }

  // Settings methods
  async getSetting<T>(key: string): Promise<T | null> {
    return this.get<T>(STORE_NAMES.SETTINGS, key);
  }

  async setSetting<T>(key: string, value: T): Promise<void> {
    return this.set(STORE_NAMES.SETTINGS, key, value);
  }

  /**
   * Check if IndexedDB is supported (instance method)
   */
  isSupported(): boolean {
    return IndexedDBStorage.isSupported();
  }

  /**
   * Check if IndexedDB is supported (static method)
   */
  static isSupported(): boolean {
    return typeof indexedDB !== 'undefined';
  }

  /**
   * Reset all stored data (for testing or user reset)
   */
  async resetAll(): Promise<void> {
    await Promise.all([
      this.clear(STORE_NAMES.TUTORIAL),
      this.clear(STORE_NAMES.TOOLTIP),
      this.clear(STORE_NAMES.SETTINGS),
    ]);
  }
}

// Export singleton instance
export const indexedDBStorage = new IndexedDBStorage();

// Export class for static methods
export { IndexedDBStorage };

// Export types for use in components
export type { StoreName };
export { STORE_NAMES };
