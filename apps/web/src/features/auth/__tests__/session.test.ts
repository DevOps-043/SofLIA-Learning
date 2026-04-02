import { describe, expect, it, vi } from 'vitest'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

vi.mock('../../../lib/auth/refreshToken.service', () => ({
  RefreshTokenService: {
    hashTokenForLookup: vi.fn(),
    revokeAllUserTokens: vi.fn(),
  },
}))

vi.mock('../../../lib/logger', () => ({
  logger: {
    auth: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

vi.mock('../../../lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

vi.mock('../services/session-legacy.service', () => ({
  buildLegacySessionRecord: vi.fn(),
  cacheLegacySessionUser: vi.fn(),
  findActiveLegacySession: vi.fn(),
  getCachedLegacySessionUser: vi.fn(),
  revokeLegacySession: vi.fn(),
}))

async function loadSessionService() {
  const module = await import('../services/session.service')
  return module.SessionService
}

describe('SessionService smoke', () => {
  it('exposes getCurrentUser as a static function', async () => {
    const SessionService = await loadSessionService()

    expect(SessionService.getCurrentUser).toBeTypeOf('function')
  })

  it('keeps the session service contract available', async () => {
    const SessionService = await loadSessionService()

    expect(SessionService.createLegacySession).toBeTypeOf('function')
    expect(SessionService.destroySession).toBeTypeOf('function')
    expect(SessionService.validateSession).toBeTypeOf('function')
  })
})
