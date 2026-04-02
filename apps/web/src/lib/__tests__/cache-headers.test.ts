import { describe, it, expect } from 'vitest';
import { cacheHeaders, withCacheHeaders } from '../utils/cache-headers';

// ─── cacheHeaders constants ───────────────────────────────────────────────────

describe('cacheHeaders.static', () => {
  it('has Cache-Control with public, s-maxage=3600', () => {
    expect(cacheHeaders.static['Cache-Control']).toContain('public');
    expect(cacheHeaders.static['Cache-Control']).toContain('s-maxage=3600');
  });

  it('has stale-while-revalidate=86400', () => {
    expect(cacheHeaders.static['Cache-Control']).toContain('stale-while-revalidate=86400');
  });

  it('has CDN-Cache-Control with max-age=3600', () => {
    expect(cacheHeaders.static['CDN-Cache-Control']).toBe('max-age=3600');
  });
});

describe('cacheHeaders.semiStatic', () => {
  it('has s-maxage=300', () => {
    expect(cacheHeaders.semiStatic['Cache-Control']).toContain('s-maxage=300');
  });

  it('has stale-while-revalidate=600', () => {
    expect(cacheHeaders.semiStatic['Cache-Control']).toContain('stale-while-revalidate=600');
  });

  it('has shorter maxage than static', () => {
    // semiStatic = 300s, static = 3600s
    const staticMaxAge = parseInt(
      cacheHeaders.static['Cache-Control'].match(/s-maxage=(\d+)/)?.[1] || '0'
    );
    const semiStaticMaxAge = parseInt(
      cacheHeaders.semiStatic['Cache-Control'].match(/s-maxage=(\d+)/)?.[1] || '0'
    );
    expect(semiStaticMaxAge).toBeLessThan(staticMaxAge);
  });
});

describe('cacheHeaders.dynamic', () => {
  it('has s-maxage=30', () => {
    expect(cacheHeaders.dynamic['Cache-Control']).toContain('s-maxage=30');
  });

  it('has stale-while-revalidate=60', () => {
    expect(cacheHeaders.dynamic['Cache-Control']).toContain('stale-while-revalidate=60');
  });

  it('has shorter maxage than semiStatic', () => {
    const semiStaticMaxAge = parseInt(
      cacheHeaders.semiStatic['Cache-Control'].match(/s-maxage=(\d+)/)?.[1] || '0'
    );
    const dynamicMaxAge = parseInt(
      cacheHeaders.dynamic['Cache-Control'].match(/s-maxage=(\d+)/)?.[1] || '0'
    );
    expect(dynamicMaxAge).toBeLessThan(semiStaticMaxAge);
  });
});

describe('cacheHeaders.private', () => {
  it('has private, no-cache, no-store, must-revalidate', () => {
    expect(cacheHeaders.private['Cache-Control']).toContain('private');
    expect(cacheHeaders.private['Cache-Control']).toContain('no-cache');
    expect(cacheHeaders.private['Cache-Control']).toContain('no-store');
    expect(cacheHeaders.private['Cache-Control']).toContain('must-revalidate');
  });

  it('has Pragma: no-cache', () => {
    expect(cacheHeaders.private['Pragma']).toBe('no-cache');
  });

  it('has Expires: 0', () => {
    expect(cacheHeaders.private['Expires']).toBe('0');
  });

  it('does NOT have s-maxage', () => {
    expect(cacheHeaders.private['Cache-Control']).not.toContain('s-maxage');
  });
});

describe('cacheHeaders.noCache', () => {
  it('has no-cache, must-revalidate', () => {
    expect(cacheHeaders.noCache['Cache-Control']).toContain('no-cache');
    expect(cacheHeaders.noCache['Cache-Control']).toContain('must-revalidate');
  });

  it('CDN-Cache-Control is no-cache', () => {
    expect(cacheHeaders.noCache['CDN-Cache-Control']).toBe('no-cache');
  });
});

// ─── withCacheHeaders ─────────────────────────────────────────────────────────

describe('withCacheHeaders', () => {
  it('sets headers on response and returns the same response', () => {
    const response = new Response(null, { status: 200 });
    const result = withCacheHeaders(response, cacheHeaders.static);
    expect(result).toBe(response);
    expect(result.headers.get('Cache-Control')).toBe(cacheHeaders.static['Cache-Control']);
    expect(result.headers.get('CDN-Cache-Control')).toBe(cacheHeaders.static['CDN-Cache-Control']);
  });

  it('sets all headers from private cache config', () => {
    const response = new Response(null, { status: 200 });
    withCacheHeaders(response, cacheHeaders.private);
    expect(response.headers.get('Cache-Control')).toBe(cacheHeaders.private['Cache-Control']);
    expect(response.headers.get('Pragma')).toBe('no-cache');
    expect(response.headers.get('Expires')).toBe('0');
  });

  it('sets headers from dynamic config', () => {
    const response = new Response(null, { status: 200 });
    withCacheHeaders(response, cacheHeaders.dynamic);
    expect(response.headers.get('Cache-Control')).toBe(cacheHeaders.dynamic['Cache-Control']);
  });

  it('sets custom headers object', () => {
    const response = new Response(null, { status: 200 });
    withCacheHeaders(response, { 'X-Custom': 'value123' });
    expect(response.headers.get('X-Custom')).toBe('value123');
  });

  it('does not modify status code', () => {
    const response = new Response(null, { status: 201 });
    withCacheHeaders(response, cacheHeaders.static);
    expect(response.status).toBe(201);
  });
});
