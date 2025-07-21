import { CacheService, CACHE_KEYS } from '../cache';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService();
  });

  afterEach(async () => {
    await cacheService.clear();
  });

  describe('get and set operations', () => {
    it('should store and retrieve values', async () => {
      const key = 'test-key';
      const value = { data: 'test-data', number: 42 };

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
    });

    it('should return null for non-existent keys', async () => {
      const result = await cacheService.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle different data types', async () => {
      const stringValue = 'test string';
      const numberValue = 123;
      const objectValue = { nested: { data: true } };
      const arrayValue = [1, 2, 3];

      await cacheService.set('string', stringValue);
      await cacheService.set('number', numberValue);
      await cacheService.set('object', objectValue);
      await cacheService.set('array', arrayValue);

      expect(await cacheService.get('string')).toBe(stringValue);
      expect(await cacheService.get('number')).toBe(numberValue);
      expect(await cacheService.get('object')).toEqual(objectValue);
      expect(await cacheService.get('array')).toEqual(arrayValue);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire entries after TTL', async () => {
      const key = 'expiring-key';
      const value = 'expiring-value';
      const shortTTL = 100; // 100ms

      await cacheService.set(key, value, shortTTL);
      
      // Should be available immediately
      expect(await cacheService.get(key)).toBe(value);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(await cacheService.get(key)).toBeNull();
    });

    it('should use default TTL when not specified', async () => {
      const key = 'default-ttl-key';
      const value = 'default-ttl-value';

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toBe(value);
    });
  });

  describe('delete operation', () => {
    it('should delete existing entries', async () => {
      const key = 'delete-test';
      const value = 'delete-value';

      await cacheService.set(key, value);
      expect(await cacheService.get(key)).toBe(value);

      await cacheService.delete(key);
      expect(await cacheService.get(key)).toBeNull();
    });

    it('should handle deletion of non-existent keys gracefully', async () => {
      await expect(cacheService.delete('non-existent')).resolves.not.toThrow();
    });
  });

  describe('clear operation', () => {
    it('should clear all entries', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.set('key3', 'value3');

      expect(await cacheService.get('key1')).toBe('value1');
      expect(await cacheService.get('key2')).toBe('value2');
      expect(await cacheService.get('key3')).toBe('value3');

      await cacheService.clear();

      expect(await cacheService.get('key1')).toBeNull();
      expect(await cacheService.get('key2')).toBeNull();
      expect(await cacheService.get('key3')).toBeNull();
    });
  });

  describe('cleanup operation', () => {
    it('should remove expired entries during cleanup', async () => {
      const shortTTL = 50;
      
      await cacheService.set('expired1', 'value1', shortTTL);
      await cacheService.set('expired2', 'value2', shortTTL);
      await cacheService.set('valid', 'value3', 10000); // Long TTL

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 100));

      // Before cleanup, expired entries might still be in memory
      const statsBefore = cacheService.getStats();
      expect(statsBefore.size).toBe(3);

      // Run cleanup
      cacheService.cleanup();

      // After cleanup, only valid entry should remain
      const statsAfter = cacheService.getStats();
      expect(statsAfter.size).toBe(1);
      expect(statsAfter.keys).toContain('valid');
      expect(await cacheService.get('valid')).toBe('value3');
    });
  });

  describe('getStats operation', () => {
    it('should return correct cache statistics', async () => {
      const initialStats = cacheService.getStats();
      expect(initialStats.size).toBe(0);
      expect(initialStats.keys).toEqual([]);

      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');

      const stats = cacheService.getStats();
      expect(stats.size).toBe(2);
      expect(stats.keys).toContain('key1');
      expect(stats.keys).toContain('key2');
    });
  });
});

describe('CACHE_KEYS', () => {
  it('should generate correct cache keys', () => {
    const courseId = 'test-course-123';
    
    expect(CACHE_KEYS.PACKAGED_COURSE(courseId)).toBe('packaged_course:test-course-123');
    expect(CACHE_KEYS.COURSE(courseId)).toBe('course:test-course-123');
    expect(CACHE_KEYS.COURSE_LIST('filter1')).toBe('courses:filter1');
  });
});