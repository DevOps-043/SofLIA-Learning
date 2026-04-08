import type { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'
import {
  shouldBlockAutomatedSensitiveAccess,
  shouldRequireAutomationChallenge,
  type AgentTrafficAssessment,
} from '../agent-traffic-policy'
import {
  isHumanVerificationActiveForPath,
  sanitizeReturnTo,
  serializeSecurityState,
} from '../security-state'
import { verifyToken } from '../signed-token'

function createRequest(pathname: string) {
  return {
    method: 'GET',
    headers: new Headers({
      accept: 'text/html',
      'sec-fetch-dest': 'document',
    }),
    nextUrl: {
      pathname,
    },
  } as unknown as NextRequest
}

function createAssessment(overrides?: Partial<AgentTrafficAssessment>) {
  return {
    automated: true,
    reasons: ['playwright'],
    userAgent: 'Playwright',
    ...overrides,
  } satisfies AgentTrafficAssessment
}

describe('security-state helpers', () => {
  it('sanitizes external return targets', () => {
    expect(sanitizeReturnTo('https://evil.example')).toBe('/')
    expect(sanitizeReturnTo('//evil.example')).toBe('/')
    expect(sanitizeReturnTo('/dashboard')).toBe('/dashboard')
  })

  it('signs and verifies state cookies', () => {
    const serialized = serializeSecurityState({
      automationSignalScore: 70,
      updatedAt: Date.now(),
      exp: Date.now() + 10_000,
    })

    const parsed = verifyToken<{ automationSignalScore: number; exp: number }>(
      serialized,
    )

    expect(parsed?.automationSignalScore).toBe(70)
  })

  it('scopes verified-human state to the verified path only', () => {
    const state = {
      verifiedHumanUntil: Date.now() + 10_000,
      verifiedPathScope: '/dashboard',
      updatedAt: Date.now(),
      exp: Date.now() + 10_000,
    }

    expect(isHumanVerificationActiveForPath(state, '/dashboard')).toBe(true)
    expect(isHumanVerificationActiveForPath(state, '/dashboard/metrics')).toBe(
      true,
    )
    expect(isHumanVerificationActiveForPath(state, '/')).toBe(false)
  })
})

describe('agent-traffic-policy', () => {
  it('requires challenge on suspicious public navigation', () => {
    const shouldChallenge = shouldRequireAutomationChallenge({
      request: createRequest('/'),
      pathname: '/',
      assessment: createAssessment(),
      securityState: null,
      trustedAgent: {
        trusted: false,
        reasons: [],
      },
      hasVerifiedHumanCookie: false,
    })

    expect(shouldChallenge).toBe(true)
  })

  it('blocks automated access to sensitive paths even with no extra state', () => {
    const shouldBlock = shouldBlockAutomatedSensitiveAccess({
      pathname: '/dashboard',
      assessment: createAssessment(),
      securityState: null,
      trustedAgent: {
        trusted: false,
        reasons: [],
      },
    })

    expect(shouldBlock).toBe(true)
  })

  it('allows signed first-party agents through the public challenge gate', () => {
    const shouldChallenge = shouldRequireAutomationChallenge({
      request: createRequest('/'),
      pathname: '/',
      assessment: createAssessment(),
      securityState: null,
      trustedAgent: {
        trusted: true,
        agentId: 'desktop-agent',
        reasons: ['valid signed first-party agent request'],
      },
      hasVerifiedHumanCookie: false,
    })

    expect(shouldChallenge).toBe(false)
  })
})
