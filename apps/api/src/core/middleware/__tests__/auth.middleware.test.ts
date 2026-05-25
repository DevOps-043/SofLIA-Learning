import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createRequest, createResponse } from './auth.middleware.fixtures'

const jwtVerifyMock = vi.fn()

class MockJsonWebTokenError extends Error {}
class MockTokenExpiredError extends Error {}

vi.mock('@/config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-with-at-least-32-characters',
    SUPABASE_JWT_SECRET: undefined,
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    JsonWebTokenError: MockJsonWebTokenError,
    TokenExpiredError: MockTokenExpiredError,
    verify: jwtVerifyMock,
  },
}))

describe('auth middleware', () => {
  beforeEach(() => {
    jwtVerifyMock.mockReset()
  })

  it('rejects requests without bearer tokens', async () => {
    const { authenticate } = await import('../auth.middleware')
    const next = vi.fn()

    authenticate(createRequest(), createResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'MISSING_TOKEN',
        statusCode: 401,
      }),
    )
  })

  it('attaches the decoded user to the request when the token is valid', async () => {
    const { authenticate } = await import('../auth.middleware')
    const next = vi.fn()
    const request = createRequest('Bearer valid-token')

    jwtVerifyMock.mockReturnValue({
      sub: 'user-1',
      email: 'security@example.com',
      role: 'admin',
      app_metadata: {
        organization_id: 'org-1',
        organization_slug: 'acme',
      },
    })

    authenticate(request, createResponse(), next)

    expect(request.user).toEqual({
      id: 'user-1',
      email: 'security@example.com',
      role: 'admin',
      organizationId: 'org-1',
      organizationSlug: 'acme',
    })
    expect(next).toHaveBeenCalledWith()
  })

  it('rejects tokens with malformed payloads', async () => {
    const { authenticate } = await import('../auth.middleware')
    const next = vi.fn()

    jwtVerifyMock.mockReturnValue('invalid-payload')

    authenticate(createRequest('Bearer malformed-token'), createResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INVALID_TOKEN',
        statusCode: 401,
      }),
    )
  })

  it('maps expired tokens to a token-expired error', async () => {
    const { authenticate } = await import('../auth.middleware')
    const next = vi.fn()

    jwtVerifyMock.mockImplementation(() => {
      throw new MockTokenExpiredError('expired')
    })

    authenticate(createRequest('Bearer expired-token'), createResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'TOKEN_EXPIRED',
        statusCode: 401,
      }),
    )
  })

  it('ignores invalid optional tokens without authenticating the request', async () => {
    const { optionalAuth } = await import('../auth.middleware')
    const next = vi.fn()
    const request = createRequest('Bearer invalid-token')

    jwtVerifyMock.mockImplementation(() => {
      throw new MockJsonWebTokenError('invalid token')
    })

    optionalAuth(request, createResponse(), next)

    expect(request.user).toBeUndefined()
    expect(next).toHaveBeenCalledWith()
  })
})
