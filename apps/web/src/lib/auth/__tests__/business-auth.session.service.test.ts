import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveAuthenticatedUserId, type CookieStoreLike } from '../business-auth/session.service'

function createCookieStore(values: Record<string, string | undefined>): CookieStoreLike {
  return {
    get(name: string) {
      const value = values[name]
      return value ? { value } : undefined
    },
  }
}

function createQueryBuilder(result: { data: unknown; error: { message: string } | null }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    gt: vi.fn(() => builder),
    single: vi.fn(async () => result),
  }

  return builder
}

function createSupabaseStub(results: {
  refreshTokens: { data: unknown; error: { message: string } | null }
  userSession: { data: unknown; error: { message: string } | null }
}) {
  const refreshTokens = createQueryBuilder(results.refreshTokens)
  const userSession = createQueryBuilder(results.userSession)

  return {
    client: {
      from: vi.fn((table: string) => {
        if (table === 'refresh_tokens') {
          return refreshTokens
        }

        if (table === 'user_session') {
          return userSession
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    } as never,
    refreshTokens,
    userSession,
  }
}

const logger = {
  debug: vi.fn(),
  warn: vi.fn(),
}

const messages = {
  missingSession: 'No autenticado',
  invalidSession: 'Sesión inválida',
  revokedSession: 'Sesión revocada',
  expiredSession: 'Sesión expirada',
}

describe('resolveAuthenticatedUserId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('prioritizes refresh tokens when the hashed token is valid', async () => {
    const { client, userSession } = createSupabaseStub({
      refreshTokens: {
        data: { user_id: 'user-refresh' },
        error: null,
      },
      userSession: {
        data: null,
        error: { message: 'should not be used' },
      },
    })

    const result = await resolveAuthenticatedUserId({
      cookieStore: createCookieStore({
        access_token: 'access',
        refresh_token: 'refresh',
      }),
      supabase: client,
      logger,
      logPrefix: 'requireBusiness',
      messages,
      hashToken: async () => 'hashed-refresh',
      now: () => new Date('2026-04-02T12:00:00.000Z'),
    })

    expect(result).toEqual({ ok: true, value: 'user-refresh' })
    expect(userSession.single).not.toHaveBeenCalled()
  })

  it('falls back to the legacy session and rejects expired sessions', async () => {
    const { client } = createSupabaseStub({
      refreshTokens: {
        data: null,
        error: { message: 'not found' },
      },
      userSession: {
        data: {
          user_id: 'legacy-user',
          expires_at: '2026-04-02T10:00:00.000Z',
          revoked: false,
        },
        error: null,
      },
    })

    const result = await resolveAuthenticatedUserId({
      cookieStore: createCookieStore({
        access_token: 'access',
        refresh_token: 'refresh',
        'aprende-y-aplica-session': 'legacy-session',
      }),
      supabase: client,
      logger,
      logPrefix: 'requireBusinessUser',
      messages,
      hashToken: async () => 'hashed-refresh',
      now: () => new Date('2026-04-02T12:00:00.000Z'),
    })

    expect(result).toEqual({
      ok: false,
      error: { status: 401, message: 'Sesión expirada' },
    })
  })
})
