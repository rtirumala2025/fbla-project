/**
 * Tests for offlineStorageService
 */
import { offlineStorage } from '../../services/offlineStorageService';

// Mock IndexedDB
const mockDB = {
  transaction: jest.fn(),
  objectStoreNames: {
    contains: jest.fn(() => false),
  },
};

const mockRequest = {
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
  result: mockDB,
  error: null,
};

const mockOpenRequest = {
  ...mockRequest,
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null,
};

// Mock indexedDB
const mockIndexedDB = {
  open: jest.fn(() => mockOpenRequest),
};

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
});

describe('offlineStorageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        get: jest.fn(() => mockRequest),
        put: jest.fn(() => mockRequest),
        add: jest.fn(() => mockRequest),
        delete: jest.fn(() => mockRequest),
        clear: jest.fn(() => mockRequest),
        getAll: jest.fn(() => mockRequest),
        index: jest.fn(() => ({
          openCursor: jest.fn(() => mockRequest),
        })),
        indexNames: {
          contains: jest.fn(() => false),
        },
        createIndex: jest.fn(),
      })),
      onerror: null,
    });
  });

  it('should initialize IndexedDB', async () => {
    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    expect(mockIndexedDB.open).toHaveBeenCalledWith('virtual-pet-offline', 1);
  });

  it('should handle IndexedDB not available', async () => {
    Object.defineProperty(window, 'indexedDB', {
      value: undefined,
      writable: true,
    });

    await offlineStorage.init();

    // Should not throw
    expect(true).toBe(true);
  });

  it('should save state to offline storage', async () => {
    const userId = 'user-1';
    const snapshot = { test: 'data' };
    const version = 1;

    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    const putRequest = {
      onsuccess: null,
      onerror: null,
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        put: jest.fn(() => putRequest),
      })),
    });

    const savePromise = offlineStorage.saveState(userId, snapshot, version);

    // Simulate successful put
    setTimeout(() => {
      if (putRequest.onsuccess) {
        putRequest.onsuccess({} as any);
      }
    }, 0);

    await savePromise;

    expect(mockDB.transaction).toHaveBeenCalled();
  });

  it('should load state from offline storage', async () => {
    const userId = 'user-1';
    const storedState = {
      userId,
      snapshot: { test: 'data' },
      lastModified: new Date().toISOString(),
      version: 1,
    };

    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    const getRequest = {
      onsuccess: null,
      onerror: null,
      result: storedState,
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        get: jest.fn(() => getRequest),
      })),
    });

    const loadPromise = offlineStorage.loadState(userId);

    setTimeout(() => {
      if (getRequest.onsuccess) {
        getRequest.onsuccess({} as any);
      }
    }, 0);

    const result = await loadPromise;

    expect(result).toBeTruthy();
    expect(result?.snapshot).toEqual(storedState.snapshot);
  });

  it('should queue operations for sync', async () => {
    const operation = {
      type: 'update' as const,
      table: 'pets',
      data: { id: 'pet-1' },
    };

    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    const addRequest = {
      onsuccess: null,
      onerror: null,
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        add: jest.fn(() => addRequest),
      })),
    });

    const queuePromise = offlineStorage.queueOperation(operation);

    setTimeout(() => {
      if (addRequest.onsuccess) {
        addRequest.onsuccess({} as any);
      }
    }, 0);

    const id = await queuePromise;

    expect(id).toBeTruthy();
    expect(typeof id).toBe('string');
  });

  it('should get queued operations', async () => {
    const queuedOps = [
      { id: 'op-1', type: 'update', table: 'pets', data: {}, timestamp: Date.now(), retries: 0 },
      { id: 'op-2', type: 'create', table: 'profiles', data: {}, timestamp: Date.now(), retries: 0 },
    ];

    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    const getAllRequest = {
      onsuccess: null,
      onerror: null,
      result: queuedOps,
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        getAll: jest.fn(() => getAllRequest),
      })),
    });

    const getPromise = offlineStorage.getQueuedOperations();

    setTimeout(() => {
      if (getAllRequest.onsuccess) {
        getAllRequest.onsuccess({} as any);
      }
    }, 0);

    const result = await getPromise;

    expect(result).toEqual(queuedOps);
  });

  it('should remove queued operation', async () => {
    const opId = 'op-1';

    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    const deleteRequest = {
      onsuccess: null,
      onerror: null,
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        delete: jest.fn(() => deleteRequest),
      })),
    });

    const removePromise = offlineStorage.removeQueuedOperation(opId);

    setTimeout(() => {
      if (deleteRequest.onsuccess) {
        deleteRequest.onsuccess({} as any);
      }
    }, 0);

    await removePromise;

    expect(mockDB.transaction).toHaveBeenCalled();
  });

  it('should cache items with expiration', async () => {
    const key = 'cache-key';
    const data = { test: 'cached data' };
    const ttl = 3600000; // 1 hour

    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    const putRequest = {
      onsuccess: null,
      onerror: null,
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        put: jest.fn(() => putRequest),
      })),
    });

    const cachePromise = offlineStorage.setCachedItem(key, data, ttl);

    setTimeout(() => {
      if (putRequest.onsuccess) {
        putRequest.onsuccess({} as any);
      }
    }, 0);

    await cachePromise;

    expect(mockDB.transaction).toHaveBeenCalled();
  });

  it('should get cached items', async () => {
    const key = 'cache-key';
    const cachedItem = {
      key,
      data: { test: 'data' },
      timestamp: Date.now(),
      expiresAt: Date.now() + 3600000,
    };

    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    const getRequest = {
      onsuccess: null,
      onerror: null,
      result: cachedItem,
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        get: jest.fn(() => getRequest),
      })),
    });

    const getPromise = offlineStorage.getCachedItem(key);

    setTimeout(() => {
      if (getRequest.onsuccess) {
        getRequest.onsuccess({} as any);
      }
    }, 0);

    const result = await getPromise;

    expect(result).toEqual(cachedItem);
  });

  it('should clear expired cache items', async () => {
    mockOpenRequest.onsuccess = jest.fn((event) => {
      if (event.target) {
        event.target.result = mockDB;
      }
    });

    await offlineStorage.init();

    const cursorRequest = {
      onsuccess: null,
      onerror: null,
      result: null,
    };

    mockDB.transaction.mockReturnValue({
      objectStore: jest.fn(() => ({
        index: jest.fn(() => ({
          openCursor: jest.fn(() => cursorRequest),
        })),
      })),
    });

    const clearPromise = offlineStorage.clearExpiredCache();

    setTimeout(() => {
      if (cursorRequest.onsuccess) {
        cursorRequest.onsuccess({} as any);
      }
    }, 0);

    const cleared = await clearPromise;

    expect(typeof cleared).toBe('number');
  });
});
