/**
 * useDataCache Hook
 * 
 * A lightweight data caching hook that provides:
 * - In-memory caching with TTL
 * - Automatic stale-while-revalidate
 * - Manual refresh capability
 * - Background refetching
 * 
 * This avoids adding external dependencies like React Query
 * while providing essential caching functionality.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    isStale: boolean;
}

// Global cache store (survives component unmounts)
const globalCache = new Map<string, CacheEntry<any>>();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

// Stale time: 1 minute (after this, data is considered stale but still usable)
const DEFAULT_STALE_TIME = 60 * 1000;

interface UseDataCacheOptions {
    /** Time-to-live in milliseconds (default: 5 minutes) */
    ttl?: number;
    /** Time until data is considered stale (default: 1 minute) */
    staleTime?: number;
    /** Whether to refetch on window focus */
    refetchOnFocus?: boolean;
    /** Whether to enable caching (useful for debugging) */
    enabled?: boolean;
}

interface UseDataCacheResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    isStale: boolean;
    refresh: (force?: boolean) => Promise<void>;
    invalidate: () => void;
}

export function useDataCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: UseDataCacheOptions = {}
): UseDataCacheResult<T> {
    const {
        ttl = DEFAULT_TTL,
        staleTime = DEFAULT_STALE_TIME,
        refetchOnFocus = false,
        enabled = true,
    } = options;

    const [data, setData] = useState<T | null>(() => {
        const cached = globalCache.get(key);
        return cached?.data ?? null;
    });
    const [loading, setLoading] = useState(!globalCache.has(key));
    const [error, setError] = useState<Error | null>(null);
    const [isStale, setIsStale] = useState(false);

    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;

    const isFetchingRef = useRef(false);

    const fetchData = useCallback(async (force = false) => {
        if (!enabled) return;
        if (isFetchingRef.current && !force) return;

        const cached = globalCache.get(key);
        const now = Date.now();

        // Check if we have valid cached data
        if (!force && cached) {
            const age = now - cached.timestamp;

            // If not expired, use cache
            if (age < ttl) {
                setData(cached.data);
                setIsStale(age > staleTime);
                setLoading(false);

                // If stale, refetch in background
                if (age > staleTime && !isFetchingRef.current) {
                    isFetchingRef.current = true;
                    fetcherRef.current()
                        .then((freshData) => {
                            globalCache.set(key, { data: freshData, timestamp: Date.now(), isStale: false });
                            setData(freshData);
                            setIsStale(false);
                        })
                        .catch(console.error)
                        .finally(() => {
                            isFetchingRef.current = false;
                        });
                }
                return;
            }
        }

        // No valid cache, fetch fresh data
        isFetchingRef.current = true;
        setLoading(true);
        setError(null);

        try {
            const freshData = await fetcherRef.current();
            globalCache.set(key, { data: freshData, timestamp: Date.now(), isStale: false });
            setData(freshData);
            setIsStale(false);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            setError(error);
            console.error(`[useDataCache] Error fetching ${key}:`, error);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, [key, ttl, staleTime, enabled]);

    const invalidate = useCallback(() => {
        globalCache.delete(key);
        setIsStale(true);
    }, [key]);

    const refresh = useCallback(async (force = true) => {
        await fetchData(force);
    }, [fetchData]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Refetch on window focus (optional)
    useEffect(() => {
        if (!refetchOnFocus) return;

        const handleFocus = () => {
            const cached = globalCache.get(key);
            if (cached && Date.now() - cached.timestamp > staleTime) {
                fetchData(false);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [key, staleTime, refetchOnFocus, fetchData]);

    return { data, loading, error, isStale, refresh, invalidate };
}

/**
 * Prefetch data into the cache without mounting a component
 * Useful for route prefetching
 */
export async function prefetchData<T>(
    key: string,
    fetcher: () => Promise<T>
): Promise<void> {
    const cached = globalCache.get(key);
    if (cached && Date.now() - cached.timestamp < DEFAULT_STALE_TIME) {
        return; // Already fresh in cache
    }

    try {
        const data = await fetcher();
        globalCache.set(key, { data, timestamp: Date.now(), isStale: false });
    } catch (err) {
        console.error(`[prefetchData] Error prefetching ${key}:`, err);
    }
}

/**
 * Invalidate a specific cache key
 */
export function invalidateCache(key: string): void {
    globalCache.delete(key);
}

/**
 * Clear all cached data
 */
export function clearAllCache(): void {
    globalCache.clear();
}

/**
 * Get cache statistics for debugging
 */
export function getCacheStats(): { keys: string[]; size: number } {
    return {
        keys: Array.from(globalCache.keys()),
        size: globalCache.size,
    };
}
