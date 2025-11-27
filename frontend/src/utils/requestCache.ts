/**
 * Request Cache Utility
 * Provides caching for API requests to reduce redundant network calls
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

class RequestCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 30000; // 30 seconds default

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry with optional TTL
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Singleton instance
export const requestCache = new RequestCache();

// Clean up expired entries every minute
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestCache.clearExpired();
  }, 60000);
}

/**
 * Cached API request wrapper
 */
export async function cachedRequest<T>(
  key: string,
  requestFn: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Check cache first
  const cached = requestCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Make request
  const data = await requestFn();
  
  // Cache result
  requestCache.set(key, data, ttl);
  
  return data;
}

