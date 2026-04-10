import type { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import {
  createTrustedAgentCookie,
  createTrustedAgentHeaders,
  TRUSTED_AGENT_COOKIE_NAME,
  isAllowedTrustedAgentId,
  validateTrustedAgentCookie,
  validateTrustedAgentHeaders,
} from '../trusted-agent-auth'

function createRequest(params: {
  pathname: string
  method?: string
  headers?: Headers
}) {
  const headers = params.headers || new Headers()
  const cookieHeader = headers.get('cookie') || ''
  const cookieEntries = new Map(
    cookieHeader
      .split(';')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const [name, ...rest] = entry.split('=')
        return [name, rest.join('=')]
      }),
  )

  return {
    method: params.method || 'GET',
    headers,
    cookies: {
      get(name: string) {
        const value = cookieEntries.get(name)
        return value ? { name, value } : undefined
      },
    },
    nextUrl: {
      pathname: params.pathname,
    },
  } as unknown as NextRequest
}

describe('trusted-agent-auth', () => {
  it('creates valid signed headers for allowlisted agents', () => {
    const headers = createTrustedAgentHeaders({
      agentId: 'desktop-agent',
      pathname: '/dashboard',
      method: 'GET',
      timestamp: String(Date.now()),
    })

    const request = createRequest({
      pathname: '/dashboard',
      headers: new Headers(headers),
    })

    const result = validateTrustedAgentHeaders(request)

    expect(result.trusted).toBe(true)
    expect(result.agentId).toBe('desktop-agent')
  })

  it('rejects signatures reused for a different pathname', () => {
    const headers = createTrustedAgentHeaders({
      agentId: 'desktop-agent',
      pathname: '/dashboard',
      method: 'GET',
      timestamp: String(Date.now()),
    })

    const request = createRequest({
      pathname: '/admin',
      headers: new Headers(headers),
    })

    const result = validateTrustedAgentHeaders(request)

    expect(result.trusted).toBe(false)
    expect(result.reasons).toContain('signed-agent signature mismatch')
  })

  it('rejects expired timestamps', () => {
    const headers = createTrustedAgentHeaders({
      agentId: 'desktop-agent',
      pathname: '/dashboard',
      method: 'GET',
      timestamp: String(Date.now() - 10 * 60 * 1000),
    })

    const request = createRequest({
      pathname: '/dashboard',
      headers: new Headers(headers),
    })

    const result = validateTrustedAgentHeaders(request)

    expect(result.trusted).toBe(false)
    expect(result.reasons).toContain('signed-agent timestamp expired')
  })

  it('validates trusted-agent cookie bindings', () => {
    const cookieValue = createTrustedAgentCookie({
      agentId: 'desktop-agent',
      userAgent: 'Playwright',
    })

    const headers = new Headers({
      cookie: `${TRUSTED_AGENT_COOKIE_NAME}=${cookieValue}`,
      'user-agent': 'Playwright',
    })
    const request = createRequest({
      pathname: '/dashboard',
      headers,
    })

    const result = validateTrustedAgentCookie(request)

    expect(result.trusted).toBe(true)
    expect(result.agentId).toBe('desktop-agent')
  })

  it('exposes allowlisted ids', () => {
    expect(isAllowedTrustedAgentId('desktop-agent')).toBe(true)
    expect(isAllowedTrustedAgentId('rogue-agent')).toBe(false)
  })
})
