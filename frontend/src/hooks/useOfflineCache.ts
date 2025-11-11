import { useEffect, useState } from 'react';

interface OfflineOptions<T> {
  key: string;
  data: T | null;
}

export function useOfflineCache<T>({ key, data }: OfflineOptions<T>) {
  const [cached, setCached] = useState<T | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(key);
    if (stored) {
      try {
        setCached(JSON.parse(stored));
      } catch (error) {
        console.warn('Failed to parse cached data', error);
      }
    }
  }, [key]);

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
    if (data) {
      try {
        window.localStorage.setItem(key, JSON.stringify(data));
        setCached(data);
      } catch (error) {
        console.warn('Unable to cache data', error);
      }
    }
  }, [data, key]);

  return { cached, offline };
}

