import { logger } from "./logger";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      logger.debug(`Cache entry expired and removed: ${key}`);
      return null;
    }

    logger.debug(`Cache hit: ${key}`);
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const timeToLive = ttl || this.defaultTTL;
    const expiresAt = Date.now() + timeToLive;

    this.cache.set(key, { value, expiresAt });
    logger.debug(`Cache set: ${key}, TTL: ${timeToLive}ms`);
  }

  async delete(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache entry deleted: ${key}`);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    logger.debug("Cache cleared");
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cache cleanup: removed ${cleanedCount} expired entries`);
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Cache keys constants
export const CACHE_KEYS = {
  PACKAGED_COURSE: (id: string) => `packaged_course:${id}`,
  COURSE: (id: string) => `course:${id}`,
  COURSE_LIST: (filters: string) => `courses:${filters}`,
} as const;

// Singleton cache instance
export const cacheService = new CacheService();

// Set up periodic cleanup (every 10 minutes)
setInterval(
  () => {
    cacheService.cleanup();
  },
  10 * 60 * 1000,
);
