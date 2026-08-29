import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { checkRateLimit } from '../rate-limit.check'
import { getIdentifier } from '../rate-limit.identifier'
import { rateLimitStore } from '../rate-limit.store'
import { applyProxyRateLimits, resolveRouteRateLimitPolicy } from '@/proxy/rate-limits'

function buildRequest(pathname: string): NextRequest {
  return new NextRequest(new URL(pathname, 'https://soflia.test'), {
    headers: {
      'user-agent': 'vitest-rate-limit',
      'x-forwarded-for': '203.0.113.10',
    },
  })
}

afterEach(() => {
  rateLimitStore.clear()
})

describe('rate limiting', () => {
  it('allows configured burst and then returns 429 with retry headers', () => {
    const config = {
      maxRequests: 5,
      burst: 3,
      windowMs: 60_000,
      message: 'rate limited',
    }
    const request = buildRequest('/api/ai-chat')

    for (let index = 0; index < 8; index += 1) {
      expect(checkRateLimit(request, config, 'load-test').success).toBe(true)
    }

    const blocked = checkRateLimit(request, config, 'load-test')

    expect(blocked.success).toBe(false)
    expect(blocked.response?.status).toBe(429)
    expect(blocked.response?.headers.get('Retry-After')).toBeTruthy()
    expect(blocked.response?.headers.get('X-RateLimit-Limit')).toBe('8')
    expect(blocked.response?.headers.get('X-RateLimit-Remaining')).toBe('0')
  })

  it('resolves endpoint-specific policies for expensive routes', () => {
    expect(resolveRouteRateLimitPolicy(buildRequest('/api/auth/me'))?.prefix).toBe('auth-read')
    expect(resolveRouteRateLimitPolicy(buildRequest('/api/auth/dashboard-destination'))?.prefix).toBe('auth-read')
    expect(resolveRouteRateLimitPolicy(buildRequest('/api/auth/login'))?.prefix).toBe('auth')
    expect(resolveRouteRateLimitPolicy(buildRequest('/api/auth/web/start'))?.prefix).toBe('auth')
    expect(resolveRouteRateLimitPolicy(buildRequest('/api/auth/forgot-password'))?.prefix).toBe('password')
    expect(resolveRouteRateLimitPolicy(buildRequest('/api/ai-chat'))?.prefix).toBe('ai-chat')
    expect(resolveRouteRateLimitPolicy(buildRequest('/api/business/users/import'))?.prefix).toBe('bulk-import')
    expect(resolveRouteRateLimitPolicy(buildRequest('/api/admin/courses'))?.prefix).toBe('api-read')
  })

  it('does not place raw network or session identifiers in rate-limit keys', () => {
    const request = new NextRequest('https://soflia.test/api/auth/login', {
      headers: {
        cookie: 'aprende-y-aplica-session=secret-session-token',
        'user-agent': 'vitest-rate-limit',
        'x-nf-client-connection-ip': '203.0.113.10',
      },
    })
    const identifier = getIdentifier(request, 'auth')

    expect(identifier).toMatch(/^auth:[a-f0-9]{32}$/)
    expect(identifier).not.toContain('203.0.113.10')
    expect(identifier).not.toContain('secret-session-token')
  })

  it('enforces proxy policy under repeated AI chat load', async () => {
    let lastResponse: Response | null = null

    for (let index = 0; index < 26; index += 1) {
      lastResponse = await applyProxyRateLimits(buildRequest('/api/ai-chat'))
    }

    expect(lastResponse?.status).toBe(429)
    expect(lastResponse?.headers.get('Retry-After')).toBeTruthy()
    expect(lastResponse?.headers.get('X-RateLimit-Limit')).toBe('25')
  })
})
