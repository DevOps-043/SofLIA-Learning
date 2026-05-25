import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, headersMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  headersMock: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: headersMock,
}))

vi.mock('bcryptjs', () => ({
  default: {
    compare: vi.fn(),
  },
}))

vi.mock('@/lib/auth/mfa/mfa.service', () => ({
  getMfaStatusForLogin: vi.fn(async () => ({ enabled: false })),
  MfaError: class MfaError extends Error {},
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
  user?: Record<string, unknown> | null
}) {
  const user = params.user ?? {
    ban_reason: null,
    cargo_rol: 'Usuario',
    display_name: 'Ada',
    email: 'ada@example.com',
    email_verified: true,
    first_name: 'Ada',
    id: 'user-1',
    is_banned: false,
    last_name: 'Lovelace',
    password_hash: null,
    profile_picture_url: null,
    username: 'ada',
  }

  return {
    auth: {
      admin: {
        getUserById: vi.fn(async () => ({
          data: { user: null },
          error: { message: 'not found', status: 404 },
        })),
      },
    },
    from: vi.fn((tableName: string) => {
      if (tableName === 'users') {
        return {
          select: vi.fn(() => ({
            ilike: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: user, error: null }),
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
    createAdminClientMock.mockReset()
    headersMock.mockResolvedValue(new Headers())
  })

  it('returns the legacy account configuration error when no Supabase Auth user or password hash exists', async () => {
    createAdminClientMock.mockReturnValue(createSupabaseMock({}))

    const { loginAction } = await import('../login')
    const result = await loginAction(createLoginFormData())

    expect(result).toEqual({
      error: 'Error en la configuracion de la cuenta. Por favor, contacta al soporte.',
    })
  })

  it('returns invalid credentials when legacy password validation fails', async () => {
    const bcrypt = await import('bcryptjs')
    vi.mocked(bcrypt.default.compare).mockResolvedValue(false as never)
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        user: {
          ban_reason: null,
          cargo_rol: 'Usuario',
          email: 'ada@example.com',
          email_verified: true,
          id: 'user-1',
          is_banned: false,
          password_hash: '$2a$12$valid-bcrypt-like-value',
          username: 'ada',
        },
      }),
    )

    const { loginAction } = await import('../login')
    const result = await loginAction(createLoginFormData())

    expect(result).toEqual({ error: 'Credenciales invalidas' })
  })
})
