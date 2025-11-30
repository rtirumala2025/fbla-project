/**
 * useOfflineCache Hook
 * Provides full offline mode with IndexedDB caching and seamless sync
 * 
 * Features:
 * - IndexedDB persistence for offline access
 * - Automatic cache updates when online
 * - Seamless sync when connection restores
 * - Multi-tab support via BroadcastChannel
 */
import { useEffect, useState } from 'react';
import { offlineStorage } from '../services/offlineStorageService';

interface OfflineOptions<T> {
  key: string;
  data: T | null;
  ttl?: number; // Time to live in milliseconds (default: 1 hour)
}

interface CachedData<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DEFAULT_TTL = 60 * 60 * 1000; // 1 hour

export function useOfflineCache<T>({ key, data, ttl = DEFAULT_TTL }: OfflineOptions<T>) {
  const [cached, setCached] = useState<T | null>(null);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize offline storage and load cached data
  useEffect(() => {
    const init = async () => {
      try {
        await offlineStorage.init();
        
        // Load cached data from IndexedDB
        const cachedItem = await offlineStorage.getCachedItem<CachedData<T>>(key);
        
        if (cachedItem) {
          const now = Date.now();
          // Check if cache is still valid
          if (cachedItem.expiresAt > now) {
            setCached(cachedItem.data);
            setLoading(false);
            return;
          } else {
            // Cache expired, remove it
            await offlineStorage.removeCachedItem(key);
          }
        }
      } catch (error) {
        console.warn('Failed to load cached data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [key]);

  // Update offline status
  useEffect(() => {
    const updateStatus = () => setOffline(!navigator.onLine);
    window.addEventListener('offline', updateStatus);
    window.addEventListener('online', updateStatus);
    updateStatus();
    return () => {
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener('online', updateStatus);
    };
  }, []);

  // Save data to cache when it changes
  useEffect(() => {
    if (data === null || loading) return;

    const saveToCache = async () => {
      try {
        await offlineStorage.init();
        const now = Date.now();
        const cachedData: CachedData<T> = {
          data,
          timestamp: now,
          expiresAt: now + ttl,
        };
        await offlineStorage.setCachedItem(key, cachedData, ttl);
        setCached(data);
      } catch (error) {
        console.warn('Failed to save data to cache:', error);
      }
    };

    saveToCache();
  }, [data, key, ttl, loading]);

  // Sync when coming back online
  useEffect(() => {
    if (!offline && cached && data && JSON.stringify(cached) !== JSON.stringify(data)) {
      // Data changed while offline, update cache
      const saveToCache = async () => {
        try {
          await offlineStorage.init();
          const now = Date.now();
          const cachedData: CachedData<T> = {
            data,
            timestamp: now,
            expiresAt: now + ttl,
          };
          await offlineStorage.setCachedItem(key, cachedData, ttl);
          setCached(data);
        } catch (error) {
          console.warn('Failed to sync cache after coming online:', error);
        }
      };
      saveToCache();
    }
  }, [offline, cached, data, key, ttl]);

  return { cached: cached || data, offline, loading };
}
