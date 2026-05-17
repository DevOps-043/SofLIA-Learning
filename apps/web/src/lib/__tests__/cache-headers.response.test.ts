import { describe, expect, it } from 'vitest'
import { cacheHeaders, withCacheHeaders } from '../utils/cache-headers'

describe('withCacheHeaders', () => {
  it('sets headers on response and returns the same response', () => {
    const response = new Response(null, { status: 200 })
    const result = withCacheHeaders(response, cacheHeaders.static)

    expect(result).toBe(response)
    expect(result.headers.get('Cache-Control')).toBe(cacheHeaders.static['Cache-Control'])
    expect(result.headers.get('CDN-Cache-Control')).toBe(cacheHeaders.static['CDN-Cache-Control'])
  })

  it('sets all headers from private cache config', () => {
    const response = new Response(null, { status: 200 })
    withCacheHeaders(response, cacheHeaders.private)

    expect(response.headers.get('Cache-Control')).toBe(cacheHeaders.private['Cache-Control'])
    expect(response.headers.get('Pragma')).toBe('no-cache')
    expect(response.headers.get('Expires')).toBe('0')
  })

  it('sets dynamic and custom header objects without changing status code', () => {
    const dynamicResponse = new Response(null, { status: 200 })
    const customResponse = new Response(null, { status: 201 })

    withCacheHeaders(dynamicResponse, cacheHeaders.dynamic)
    withCacheHeaders(customResponse, { 'X-Custom': 'value123' })

    expect(dynamicResponse.headers.get('Cache-Control')).toBe(cacheHeaders.dynamic['Cache-Control'])
    expect(customResponse.headers.get('X-Custom')).toBe('value123')
    expect(customResponse.status).toBe(201)
  })
})
