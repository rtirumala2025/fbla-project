/**
 * useOfflineCache Hook
 * Provides offline status detection (localStorage caching removed)
 * 
 * Note: Caching removed - data should be fetched from Supabase or API directly
 * This hook now only provides offline status detection
 */
import { useEffect, useState } from 'react';

interface OfflineOptions<T> {
  key: string;
  data: T | null;
}

export function useOfflineCache<T>({ key, data }: OfflineOptions<T>) {
  // Removed localStorage caching - cached now just mirrors current data
  const [cached, setCached] = useState<T | null>(null);
  const [offline, setOffline] = useState(false);

  // Removed localStorage.getItem for cached data

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

  useEffect(() => {
    // Removed localStorage.setItem - just store in component state
    if (data) {
      setCached(data);
    }
  }, [data, key]);

  // Note: cached now just mirrors current data prop (no persistence)
  // Future: Components should fetch from Supabase directly instead of using cache
  return { cached, offline };
}

