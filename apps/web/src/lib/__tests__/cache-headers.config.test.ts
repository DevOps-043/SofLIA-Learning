import { describe, expect, it } from 'vitest'
import { cacheHeaders } from '../utils/cache-headers'

const getSharedMaxAge = (cacheControl: string): number =>
  parseInt(cacheControl.match(/s-maxage=(\d+)/)?.[1] || '0')

describe('cacheHeaders.static', () => {
  it('uses public one-hour shared cache', () => {
    expect(cacheHeaders.static['Cache-Control']).toContain('public')
    expect(cacheHeaders.static['Cache-Control']).toContain('s-maxage=3600')
    expect(cacheHeaders.static['Cache-Control']).toContain('stale-while-revalidate=86400')
    expect(cacheHeaders.static['CDN-Cache-Control']).toBe('max-age=3600')
  })
})

describe('cacheHeaders.semiStatic', () => {
  it('uses a shorter shared cache than static', () => {
    const staticMaxAge = getSharedMaxAge(cacheHeaders.static['Cache-Control'])
    const semiStaticMaxAge = getSharedMaxAge(cacheHeaders.semiStatic['Cache-Control'])

    expect(cacheHeaders.semiStatic['Cache-Control']).toContain('stale-while-revalidate=600')
    expect(semiStaticMaxAge).toBe(300)
    expect(semiStaticMaxAge).toBeLessThan(staticMaxAge)
  })
})

describe('cacheHeaders.dynamic', () => {
  it('uses a shorter shared cache than semi-static', () => {
    const semiStaticMaxAge = getSharedMaxAge(cacheHeaders.semiStatic['Cache-Control'])
    const dynamicMaxAge = getSharedMaxAge(cacheHeaders.dynamic['Cache-Control'])

    expect(cacheHeaders.dynamic['Cache-Control']).toContain('stale-while-revalidate=60')
    expect(dynamicMaxAge).toBe(30)
    expect(dynamicMaxAge).toBeLessThan(semiStaticMaxAge)
  })
})

describe('cacheHeaders.private', () => {
  it('prevents shared and browser persistence for sensitive data', () => {
    expect(cacheHeaders.private['Cache-Control']).toContain('private')
    expect(cacheHeaders.private['Cache-Control']).toContain('no-cache')
    expect(cacheHeaders.private['Cache-Control']).toContain('no-store')
    expect(cacheHeaders.private['Cache-Control']).toContain('must-revalidate')
    expect(cacheHeaders.private['Cache-Control']).not.toContain('s-maxage')
    expect(cacheHeaders.private.Pragma).toBe('no-cache')
    expect(cacheHeaders.private.Expires).toBe('0')
  })
})

describe('cacheHeaders.noCache', () => {
  it('requires revalidation without shared CDN cache', () => {
    expect(cacheHeaders.noCache['Cache-Control']).toContain('no-cache')
    expect(cacheHeaders.noCache['Cache-Control']).toContain('must-revalidate')
    expect(cacheHeaders.noCache['CDN-Cache-Control']).toBe('no-cache')
  })
})
