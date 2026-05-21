import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}))

vi.mock('../../../../lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

function createLoginFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const values = {
    emailOrUsername: 'ada@example.com',
    password: 'Password1',
    rememberMe: 'false',
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => {
    formData.append(key, value)
  })

  return formData
}

function createSupabaseMock(params: {
  oauthProviders?: Array<{ provider: string | null }>
  user?: Record<string, unknown> | null
}) {
  const user = params.user ?? {
    ban_reason: null,
    cargo_rol: 'Usuario',
    email: 'ada@example.com',
    email_verified: true,
    id: 'user-1',
    is_banned: false,
    oauth_provider: null,
    password_hash: '',
    username: 'ada',
  }

  return {
    from: vi.fn((tableName: string) => {
      if (tableName === 'users') {
        return {
          select: vi.fn(() => ({
            or: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: user, error: null }),
            })),
          })),
        }
      }

      if (tableName === 'oauth_accounts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn().mockResolvedValue({
                data: params.oauthProviders ?? [],
                error: null,
              }),
            })),
          })),
        }
      }

      throw new Error(`Unexpected table ${tableName}`)
    }),
  }
}

describe('loginAction', () => {
  beforeEach(() => {
    vi.resetModules()
    createClientMock.mockReset()
  })

  it('returns a provider-specific error for OAuth accounts without local password', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        oauthProviders: [{ provider: 'google' }],
      }),
    )

    const { loginAction } = await import('../login')
    const result = await loginAction(createLoginFormData())

    expect(result).toEqual({
      error: 'Cuenta registrada con OAuth. Inicia sesion con Google.',
      errorCode: 'oauth_account_login_required',
      providers: ['google'],
    })
  })

  it('keeps the existing generic error for non-OAuth accounts without local password', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        oauthProviders: [],
      }),
    )

    const { loginAction } = await import('../login')
    const result = await loginAction(createLoginFormData())

    expect(result).toEqual({
      error: 'Error en la configuración de la cuenta. Por favor, contacta al soporte.',
    })
  })

  it('blocks normal login for linked OAuth accounts even when a password hash exists', async () => {
    createClientMock.mockResolvedValue(
      createSupabaseMock({
        oauthProviders: [{ provider: 'microsoft' }],
        user: {
          ban_reason: null,
          cargo_rol: 'Usuario',
          email: 'ada@example.com',
          email_verified: true,
          id: 'user-1',
          is_banned: false,
          oauth_provider: null,
          password_hash: '$2a$12$valid-bcrypt-like-value',
          username: 'ada',
        },
      }),
    )

    const { loginAction } = await import('../login')
    const result = await loginAction(createLoginFormData())

    expect(result).toEqual({
      error: 'Cuenta registrada con OAuth. Inicia sesion con Microsoft.',
      errorCode: 'oauth_account_login_required',
      providers: ['microsoft'],
    })
  })
})
