import { describe, it, expect } from 'vitest';
import { cacheGet, cacheSet } from '../cache/ttlCache';

// Note: uses globalThis.__ayap_ttl_cache__, so entries may persist across tests.
// Use unique keys per test to avoid collisions.

// ─── cacheSet / cacheGet ──────────────────────────────────────────────────────

describe('cacheSet and cacheGet', () => {
  it('returns undefined for a missing key', () => {
    expect(cacheGet('nonexistent-key-xyz')).toBeUndefined();
  });

  it('stores and retrieves a string value', () => {
    cacheSet('ttl-str-1', 'hello', 5000);
    expect(cacheGet('ttl-str-1')).toBe('hello');
  });

  it('stores and retrieves an object value', () => {
    cacheSet('ttl-obj-1', { name: 'Alice', age: 30 }, 5000);
    expect(cacheGet('ttl-obj-1')).toEqual({ name: 'Alice', age: 30 });
  });

  it('stores and retrieves a number value', () => {
    cacheSet('ttl-num-1', 42, 5000);
    expect(cacheGet<number>('ttl-num-1')).toBe(42);
  });

  it('stores and retrieves a boolean value', () => {
    cacheSet('ttl-bool-1', true, 5000);
    expect(cacheGet<boolean>('ttl-bool-1')).toBe(true);
  });

  it('returns undefined for expired entry', async () => {
    cacheSet('ttl-exp-1', 'soon-gone', 50); // 50ms TTL
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(cacheGet('ttl-exp-1')).toBeUndefined();
  });

  it('returns value for non-expired entry', async () => {
    cacheSet('ttl-fresh-1', 'still-here', 5000); // 5s TTL
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(cacheGet('ttl-fresh-1')).toBe('still-here');
  });

  it('overwrites an existing key', () => {
    cacheSet('ttl-overwrite-1', 'old', 5000);
    cacheSet('ttl-overwrite-1', 'new', 5000);
    expect(cacheGet('ttl-overwrite-1')).toBe('new');
  });

  it('different keys are stored independently', () => {
    cacheSet('ttl-a', 'value-a', 5000);
    cacheSet('ttl-b', 'value-b', 5000);
    expect(cacheGet('ttl-a')).toBe('value-a');
    expect(cacheGet('ttl-b')).toBe('value-b');
  });

  it('entry is removed after expiry check cleans it up', async () => {
    cacheSet('ttl-clean-1', 'temp', 30);
    await new Promise((resolve) => setTimeout(resolve, 60));
    // First get should return undefined AND delete the entry
    const result = cacheGet('ttl-clean-1');
    expect(result).toBeUndefined();
    // Second get should also return undefined
    expect(cacheGet('ttl-clean-1')).toBeUndefined();
  });

  it('stores array values correctly', () => {
    cacheSet('ttl-arr-1', [1, 2, 3], 5000);
    expect(cacheGet<number[]>('ttl-arr-1')).toEqual([1, 2, 3]);
  });

  it('handles zero TTL (immediate expiry)', async () => {
    cacheSet('ttl-zero-1', 'gone', 0);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(cacheGet('ttl-zero-1')).toBeUndefined();
  });
});
