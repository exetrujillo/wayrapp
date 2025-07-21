import { logger } from "./logger";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  size?: number; // Estimated size in bytes
}

export interface CacheStats {
  size: number;
  keys: string[];
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  totalSets: number;
  memoryUsage: number;
  averageAccessCount: number;
  oldestEntry: number;
  newestEntry: number;
}

export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
  private maxSize = parseInt(process.env['CACHE_MAX_SIZE'] || '1000'); // Maximum number of entries
  private totalHits = 0;
  private totalMisses = 0;
  private totalSets = 0;

  // TTL configurations for different content types
  private readonly TTL_CONFIG = {
    PACKAGED_COURSE: 30 * 60 * 1000, // 30 minutes - courses change infrequently
    COURSE_LIST: 10 * 60 * 1000, // 10 minutes - course lists change moderately
    COURSE_DETAIL: 15 * 60 * 1000, // 15 minutes - individual courses
    USER_PROGRESS: 2 * 60 * 1000, // 2 minutes - progress changes frequently
    EXERCISE_LIST: 20 * 60 * 1000, // 20 minutes - exercises change infrequently
    LESSON_DETAIL: 15 * 60 * 1000, // 15 minutes - lessons change moderately
    HEALTH_CHECK: 30 * 1000, // 30 seconds - health status
  };

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.totalMisses++;
      logger.debug(`Cache miss: ${key}`);
      return null;
    }

    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.totalMisses++;
      logger.debug(`Cache entry expired and removed: ${key}`);
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.totalHits++;

    logger.debug(`Cache hit: ${key}`, {
      accessCount: entry.accessCount,
      age: Date.now() - entry.createdAt,
    });
    
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    // Determine TTL based on key pattern or use provided/default TTL
    const timeToLive = ttl || this.getTTLForKey(key) || this.defaultTTL;
    const now = Date.now();
    const expiresAt = now + timeToLive;

    // Estimate size of the cached value
    const estimatedSize = this.estimateSize(value);

    // Check if we need to evict entries (LRU eviction)
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      value,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      lastAccessed: now,
      size: estimatedSize,
    };

    this.cache.set(key, entry);
    this.totalSets++;

    logger.debug(`Cache set: ${key}`, {
      TTL: `${timeToLive}ms`,
      estimatedSize: `${estimatedSize} bytes`,
      totalEntries: this.cache.size,
    });
  }

  async delete(key: string): Promise<void> {
    const deleted = this.cache.delete(key);
    if (deleted) {
      logger.debug(`Cache entry deleted: ${key}`);
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
    this.totalHits = 0;
    this.totalMisses = 0;
    this.totalSets = 0;
    logger.debug("Cache cleared");
  }

  // Enhanced cleanup with performance metrics
  cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    let reclaimedMemory = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        reclaimedMemory += entry.size || 0;
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug(`Cache cleanup completed`, {
        removedEntries: cleanedCount,
        reclaimedMemory: `${reclaimedMemory} bytes`,
        remainingEntries: this.cache.size,
      });
    }
  }

  // LRU eviction strategy
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const evictedEntry = this.cache.get(oldestKey);
      this.cache.delete(oldestKey);
      logger.debug(`Cache LRU eviction: ${oldestKey}`, {
        age: Date.now() - (evictedEntry?.createdAt || 0),
        accessCount: evictedEntry?.accessCount || 0,
      });
    }
  }

  // Determine TTL based on cache key patterns
  private getTTLForKey(key: string): number | null {
    if (key.startsWith('packaged_course:')) return this.TTL_CONFIG.PACKAGED_COURSE;
    if (key.startsWith('courses:')) return this.TTL_CONFIG.COURSE_LIST;
    if (key.startsWith('course:')) return this.TTL_CONFIG.COURSE_DETAIL;
    if (key.startsWith('user_progress:')) return this.TTL_CONFIG.USER_PROGRESS;
    if (key.startsWith('exercises:')) return this.TTL_CONFIG.EXERCISE_LIST;
    if (key.startsWith('lesson:')) return this.TTL_CONFIG.LESSON_DETAIL;
    if (key.startsWith('health:')) return this.TTL_CONFIG.HEALTH_CHECK;
    
    return null;
  }

  // Estimate memory usage of cached values
  private estimateSize(value: any): number {
    try {
      return JSON.stringify(value).length * 2; // Rough estimate (UTF-16)
    } catch {
      return 1000; // Default estimate for non-serializable values
    }
  }

  // Comprehensive cache statistics
  getStats(): CacheStats {
    const now = Date.now();
    let totalMemory = 0;
    let totalAccessCount = 0;
    let oldestEntry = now;
    let newestEntry = 0;

    for (const entry of this.cache.values()) {
      totalMemory += entry.size || 0;
      totalAccessCount += entry.accessCount;
      
      if (entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    }

    const totalRequests = this.totalHits + this.totalMisses;
    const hitRate = totalRequests > 0 ? (this.totalHits / totalRequests) * 100 : 0;

    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hitRate: Math.round(hitRate * 100) / 100,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      totalSets: this.totalSets,
      memoryUsage: totalMemory,
      averageAccessCount: this.cache.size > 0 ? totalAccessCount / this.cache.size : 0,
      oldestEntry: oldestEntry === now ? 0 : now - oldestEntry,
      newestEntry: now - newestEntry,
    };
  }

  // Warm up cache with frequently accessed content
  async warmUp(warmUpData: Array<{ key: string; fetcher: () => Promise<any>; ttl?: number }>): Promise<void> {
    logger.info(`Starting cache warm-up with ${warmUpData.length} entries`);
    
    const promises = warmUpData.map(async ({ key, fetcher, ttl }) => {
      try {
        const data = await fetcher();
        await this.set(key, data, ttl);
        logger.debug(`Cache warm-up successful: ${key}`);
      } catch (error) {
        logger.warn(`Cache warm-up failed: ${key}`, { error });
      }
    });

    await Promise.allSettled(promises);
    logger.info('Cache warm-up completed');
  }

  // Invalidate cache entries by pattern
  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern);
    let invalidatedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        invalidatedCount++;
      }
    }

    if (invalidatedCount > 0) {
      logger.debug(`Cache pattern invalidation: ${pattern}`, {
        invalidatedCount,
      });
    }

    return invalidatedCount;
  }
}

// Cache keys constants with comprehensive patterns
export const CACHE_KEYS = {
  // Content caching
  PACKAGED_COURSE: (id: string) => `packaged_course:${id}`,
  COURSE: (id: string) => `course:${id}`,
  COURSE_LIST: (filters: string) => `courses:${filters}`,
  COURSE_WITH_SUMMARY: (id: string) => `course_summary:${id}`,
  
  // Hierarchical content
  LEVELS_BY_COURSE: (courseId: string) => `levels:course:${courseId}`,
  SECTIONS_BY_LEVEL: (levelId: string) => `sections:level:${levelId}`,
  MODULES_BY_SECTION: (sectionId: string) => `modules:section:${sectionId}`,
  LESSONS_BY_MODULE: (moduleId: string) => `lessons:module:${moduleId}`,
  
  // Exercises and lessons
  LESSON_WITH_EXERCISES: (lessonId: string) => `lesson:${lessonId}:exercises`,
  EXERCISE_LIST: (filters: string) => `exercises:${filters}`,
  EXERCISE: (id: string) => `exercise:${id}`,
  
  // User-specific data (shorter TTL)
  USER_PROGRESS: (userId: string) => `user_progress:${userId}`,
  USER_COMPLETIONS: (userId: string) => `user_completions:${userId}`,
  
  // System health and metrics
  HEALTH_CHECK: () => `health:database`,
  DB_METRICS: () => `metrics:database`,
  CACHE_STATS: () => `stats:cache`,
  
  // Popular/trending content (for performance optimization)
  POPULAR_COURSES: () => `popular:courses`,
  TRENDING_LESSONS: () => `trending:lessons`,
} as const;

// Singleton cache instance
export const cacheService = new CacheService();

// Set up periodic cleanup (every 10 minutes) - only in non-test environments
if (process.env['NODE_ENV'] !== 'test') {
  setInterval(
    () => {
      cacheService.cleanup();
    },
    10 * 60 * 1000,
  );
}
