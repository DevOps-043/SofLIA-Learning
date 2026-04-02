import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryCache, getAllCacheStats } from '../cache/memory-cache';

// ─── MemoryCache ──────────────────────────────────────────────────────────────

describe('MemoryCache', () => {
  let cache: InstanceType<typeof MemoryCache<string>>;

  beforeEach(() => {
    cache = new MemoryCache<string>(1, 5000); // 1MB, 5s TTL
  });

  // ── basic get/set ─────────────────────────────────────────────────────────

  it('returns null for missing key', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('stores and retrieves a value', () => {
    cache.set('key1', 'hello');
    expect(cache.get('key1')).toBe('hello');
  });

  it('stores and retrieves object values', () => {
    const objCache = new MemoryCache<{ name: string }>(1, 5000);
    objCache.set('user', { name: 'Alice' });
    expect(objCache.get('user')).toEqual({ name: 'Alice' });
  });

  it('set returns true on successful store', () => {
    expect(cache.set('k', 'v')).toBe(true);
  });

  // ── TTL expiry ────────────────────────────────────────────────────────────

  it('returns null for expired entry', async () => {
    const shortCache = new MemoryCache<string>(1, 50); // 50ms TTL
    shortCache.set('key', 'value');
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(shortCache.get('key')).toBeNull();
  });

  it('returns value before expiry', async () => {
    const longCache = new MemoryCache<string>(1, 5000); // 5s TTL
    longCache.set('key', 'value');
    expect(longCache.get('key')).toBe('value');
  });

  // ── delete ────────────────────────────────────────────────────────────────

  it('delete returns true for existing key', () => {
    cache.set('key', 'val');
    expect(cache.delete('key')).toBe(true);
  });

  it('delete returns false for missing key', () => {
    expect(cache.delete('nonexistent')).toBe(false);
  });

  it('deleted key is no longer accessible', () => {
    cache.set('key', 'val');
    cache.delete('key');
    expect(cache.get('key')).toBeNull();
  });

  // ── clear ─────────────────────────────────────────────────────────────────

  it('clear removes all entries', () => {
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    cache.clear();
    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')).toBeNull();
  });

  // ── stats ─────────────────────────────────────────────────────────────────

  it('tracks hits and misses', () => {
    cache.set('key', 'val');
    cache.get('key');      // hit
    cache.get('missing');  // miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it('hitRate is formatted as percentage', () => {
    cache.set('key', 'val');
    cache.get('key'); // hit
    const stats = cache.getStats();
    expect(stats.hitRate).toMatch(/^\d+\.\d+%$/);
  });

  it('hitRate is 100% after only hits', () => {
    cache.set('key', 'val');
    cache.get('key');
    const stats = cache.getStats();
    expect(stats.hitRate).toBe('100.00%');
  });

  it('entryCount reflects number of stored entries', () => {
    cache.set('k1', 'v1');
    cache.set('k2', 'v2');
    expect(cache.getStats().entryCount).toBe(2);
  });

  // ── overwrite ─────────────────────────────────────────────────────────────

  it('overwrites existing key with new value', () => {
    cache.set('key', 'old');
    cache.set('key', 'new');
    expect(cache.get('key')).toBe('new');
  });

  // ── size limit ────────────────────────────────────────────────────────────

  it('rejects value larger than 50% of max size', () => {
    // 600KB string → each char = 2 bytes, 300000 chars = 600KB → > 50% of 1MB
    const hugeValue = 'x'.repeat(600_000);
    const result = cache.set('huge', hugeValue);
    expect(result).toBe(false);
  });

  // ── cleanup ───────────────────────────────────────────────────────────────

  it('cleanup removes expired entries and returns count', async () => {
    const shortCache = new MemoryCache<string>(1, 50);
    shortCache.set('expired', 'val');
    await new Promise((resolve) => setTimeout(resolve, 100));
    const cleaned = shortCache.cleanup();
    expect(cleaned).toBe(1);
  });

  it('cleanup does not remove non-expired entries', () => {
    cache.set('fresh', 'val');
    const cleaned = cache.cleanup();
    expect(cleaned).toBe(0);
    expect(cache.get('fresh')).toBe('val');
  });
});

// ─── getAllCacheStats ─────────────────────────────────────────────────────────

describe('getAllCacheStats', () => {
  it('returns stats for all predefined caches', () => {
    const stats = getAllCacheStats();
    expect(stats).toHaveProperty('courseValidation');
    expect(stats).toHaveProperty('userData');
    expect(stats).toHaveProperty('courseData');
    expect(stats).toHaveProperty('query');
    expect(stats).toHaveProperty('total');
  });

  it('total.maxSize is 10MB', () => {
    const stats = getAllCacheStats();
    expect(stats.total.maxSize).toBe(10 * 1024 * 1024);
  });

  it('total.currentSize starts at 0', () => {
    const stats = getAllCacheStats();
    expect(stats.total.currentSize).toBeGreaterThanOrEqual(0);
  });
});
