import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, headersMock, signInWithPasswordMock } = vi.hoisted(
  () => ({
    createAdminClientMock: vi.fn(),
    headersMock: vi.fn(),
    signInWithPasswordMock: vi.fn(),
  }),
)

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

// Supabase Auth es la única autoridad de credenciales (ya no hay bcrypt legacy).
vi.mock('@/lib/supabase/auth-server', () => ({
  createAuthActionClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
      signOut: vi.fn(async () => ({ error: null })),
    },
  })),
}))

vi.mock('server-only', () => ({}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
  headers: headersMock,
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

/** Emula el filtro ilike de PostgREST sobre la fila simulada. */
function matchesIlike(
  user: Record<string, unknown>,
  column: string,
  pattern: string,
): boolean {
  const value = user[column]
  return (
    typeof value === 'string' &&
    value.toLowerCase() === pattern.toLowerCase()
  )
}

function createSupabaseMock(params: {
  user?: Record<string, unknown> | null
  /** Usuario correspondiente en `auth.users`. Si falta, la cuenta no puede autenticar. */
  authUser?: Record<string, unknown> | null
  /** Error que devuelve Supabase Auth al validar la contraseña. */
  signInError?: { message: string } | null
}) {
  const user = params.user ?? {
    ban_reason: null,
    platform_role: 'Usuario',
    display_name: 'Ada',
    email: 'ada@example.com',
    email_verified: true,
    first_name: 'Ada',
    id: 'user-1',
    is_banned: false,
    last_name: 'Lovelace',
    profile_picture_url: null,
    username: 'ada',
  }

  signInWithPasswordMock.mockResolvedValue({
    data: { user: params.signInError ? null : params.authUser ?? null },
    error: params.signInError ?? null,
  })

  return {
    auth: {
      admin: {
        getUserById: vi.fn(async () =>
          params.authUser
            ? { data: { user: params.authUser }, error: null }
            : {
                data: { user: null },
                error: { message: 'not found', status: 404 },
              },
        ),
      },
    },
    from: vi.fn((tableName: string) => {
      if (tableName === 'users') {
        return {
          select: vi.fn(() => ({
            // findLoginUser lista filas (`.limit().returns()`) en vez de
            // `.maybeSingle()`, porque varias cuentas pueden coincidir de forma
            // case-insensitive y maybeSingle trata eso como error.
            ilike: vi.fn((column: string, pattern: string) => ({
              limit: vi.fn(() => ({
                returns: vi.fn().mockResolvedValue({
                  data: matchesIlike(user, column, pattern) ? [user] : [],
                  error: null,
                }),
              })),
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

  // El perfil existe en `public.users` pero no tiene usuario en Supabase Auth:
  // no hay ninguna credencial contra la que autenticar. Aquí sí procede avisar
  // a soporte, porque es una inconsistencia real de la cuenta.
  it('returns the account configuration error when the profile has no Supabase Auth user', async () => {
    createAdminClientMock.mockReturnValue(createSupabaseMock({}))

    const { loginAction } = await import('../login')
    const result = await loginAction(createLoginFormData())

    expect(result).toEqual({
      error: 'Error en la configuracion de la cuenta. Por favor, contacta al soporte.',
    })
  })

  // Ya no existe validación bcrypt legacy: Supabase Auth es la única autoridad
  // de credenciales. Cuando rechaza la contraseña, el usuario ve "Credenciales
  // invalidas", NO el antiguo mensaje de soporte que hacía parecer corrupta una
  // cuenta sana.
  it('returns invalid credentials when Supabase Auth rejects the password', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        user: {
          ban_reason: null,
          platform_role: 'Usuario',
          email: 'ada@example.com',
          email_verified: true,
          id: 'user-1',
          is_banned: false,
          username: 'ada',
        },
        authUser: { id: 'user-1', email: 'ada@example.com' },
        signInError: { message: 'Invalid login credentials' },
      }),
    )

    const { loginAction } = await import('../login')
    const result = await loginAction(createLoginFormData())

    expect(result).toEqual({ error: 'Credenciales invalidas' })
  })
})
