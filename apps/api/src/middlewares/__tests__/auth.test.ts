import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const jwtVerifyMock = vi.fn()

class MockJsonWebTokenError extends Error {}
class MockTokenExpiredError extends Error {}

vi.mock('../../config/env', () => ({
  config: {
    JWT_SECRET: 'test-secret-with-at-least-32-chars',
  },
}))

vi.mock('jsonwebtoken', () => ({
  default: {
    JsonWebTokenError: MockJsonWebTokenError,
    TokenExpiredError: MockTokenExpiredError,
    verify: jwtVerifyMock,
  },
}))

function createRequest(authorization?: string): Request {
  return {
    headers: authorization ? { authorization } : {},
  } as Request
}

function createResponse(): Response {
  return {} as Response
}

async function loadAuthModule() {
  return import('../auth')
}

describe('auth middleware', () => {
  beforeEach(() => {
    jwtVerifyMock.mockReset()
  })

  it('rejects requests without bearer tokens', async () => {
    const { authenticate } = await loadAuthModule()
    const next = vi.fn()

    authenticate(createRequest(), createResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'MISSING_TOKEN',
        statusCode: 401,
      })
    )
  })

  it('attaches the decoded user to the request when the token is valid', async () => {
    const { authenticate } = await loadAuthModule()
    const next = vi.fn()
    const request = createRequest('Bearer valid-token')

    jwtVerifyMock.mockReturnValue({
      email: 'security@example.com',
      id: 'user-1',
      role: 'admin',
    })

    authenticate(request, createResponse(), next)

    expect(request.user).toEqual({
      email: 'security@example.com',
      id: 'user-1',
      role: 'admin',
    })
    expect(next).toHaveBeenCalledWith()
  })

  it('rejects tokens with malformed payloads', async () => {
    const { authenticate } = await loadAuthModule()
    const next = vi.fn()

    jwtVerifyMock.mockReturnValue('invalid-payload')

    authenticate(createRequest('Bearer malformed-token'), createResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INVALID_TOKEN',
        statusCode: 401,
      })
    )
  })

  it('rejects authenticated users without the required role', async () => {
    const { authorize } = await loadAuthModule()
    const next = vi.fn()
    const request = {
      user: {
        email: 'member@example.com',
        id: 'user-2',
        role: 'member',
      },
    } as Request

    authorize('admin')(request, createResponse(), next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'INSUFFICIENT_PERMISSIONS',
        statusCode: 403,
      })
    )
  })

  it('ignores invalid optional tokens without authenticating the request', async () => {
    const { optionalAuth } = await loadAuthModule()
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
