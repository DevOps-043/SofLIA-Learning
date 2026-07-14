import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import {
  findLoginUser,
  isNativeAuthOnlyAccount,
  mapNativeAuthFailure,
} from '../user-credentials'
import type { LoginSupabaseClient, LoginUserRecord } from '../types'

function buildUser(overrides: Partial<LoginUserRecord> = {}): LoginUserRecord {
  return {
    ban_reason: null,
    cargo_rol: 'Usuario',
    display_name: null,
    email: 'aidee@empresa.com',
    email_verified: true,
    first_name: null,
    id: 'user-1',
    is_banned: false,
    last_name: null,
    password_hash: null,
    profile_picture_url: null,
    username: 'Aidee',
    ...overrides,
  } as LoginUserRecord
}

/** Supabase simulado: devuelve las filas que coincidan con el ilike pedido. */
function buildSupabaseMock(rows: LoginUserRecord[]): LoginSupabaseClient {
  return {
    from: () => ({
      select: () => ({
        ilike: (column: 'username' | 'email', pattern: string) => ({
          limit: () => ({
            returns: async () => ({
              data: rows.filter(
                (row) =>
                  typeof row[column] === 'string' &&
                  String(row[column]).toLowerCase() === pattern.toLowerCase(),
              ),
              error: null,
            }),
          }),
        }),
      }),
    }),
  } as unknown as LoginSupabaseClient
}

describe('findLoginUser', () => {
  it('encuentra al usuario por username (caso de la cuenta "Aidee")', async () => {
    const supabase = buildSupabaseMock([buildUser()])

    const user = await findLoginUser(supabase, 'Aidee')

    expect(user?.username).toBe('Aidee')
  })

  it('encuentra al usuario por username ignorando mayúsculas', async () => {
    const supabase = buildSupabaseMock([buildUser()])

    expect((await findLoginUser(supabase, 'aidee'))?.id).toBe('user-1')
  })

  it('encuentra al usuario por email', async () => {
    const supabase = buildSupabaseMock([buildUser()])

    expect((await findLoginUser(supabase, 'aidee@empresa.com'))?.id).toBe('user-1')
  })

  it('elige la coincidencia EXACTA cuando dos usernames solo difieren en mayúsculas', async () => {
    // Caso real en la base: existen "TobiasZorro" y "tobiaszorro".
    const supabase = buildSupabaseMock([
      buildUser({ id: 'user-mayus', username: 'TobiasZorro' }),
      buildUser({ id: 'user-minus', username: 'tobiaszorro' }),
    ])

    expect((await findLoginUser(supabase, 'tobiaszorro'))?.id).toBe('user-minus')
    expect((await findLoginUser(supabase, 'TobiasZorro'))?.id).toBe('user-mayus')
  })

  it('no adivina cuando hay varias coincidencias y ninguna exacta', async () => {
    const supabase = buildSupabaseMock([
      buildUser({ id: 'a', username: 'TobiasZorro' }),
      buildUser({ id: 'b', username: 'TOBIASZORRO' }),
    ])

    expect(await findLoginUser(supabase, 'tobiaszorro')).toBeNull()
  })

  it('devuelve null con identificador vacío', async () => {
    expect(await findLoginUser(buildSupabaseMock([]), '   ')).toBeNull()
  })
})

describe('mapNativeAuthFailure', () => {
  it('traduce una contraseña incorrecta a "Credenciales invalidas", no a un error de soporte', () => {
    const result = mapNativeAuthFailure('Invalid login credentials')

    expect(result.error).toBe('Credenciales invalidas')
    expect(result.error).not.toContain('soporte')
  })

  it('reporta el rate limit de Supabase como tal', () => {
    const result = mapNativeAuthFailure('Request rate limit reached')

    expect(result.debugCode).toBe('AUTH_RATE_LIMITED')
    expect(result.error).toContain('Demasiados intentos')
  })

  it('reporta el correo sin confirmar', () => {
    expect(mapNativeAuthFailure('Email not confirmed').debugCode).toBe(
      'AUTH_EMAIL_NOT_CONFIRMED',
    )
  })

  it('mantiene el mensaje de soporte solo para cuentas realmente inutilizables', () => {
    expect(mapNativeAuthFailure('MISSING_EMAIL').error).toContain('soporte')
    expect(mapNativeAuthFailure('MISSING_PASSWORD_HASH').error).toContain('soporte')
  })

  it('ante un fallo desconocido del servicio pide reintentar, sin culpar a la cuenta', () => {
    const result = mapNativeAuthFailure('boom: upstream timeout')

    expect(result.debugCode).toBe('AUTH_SERVICE_ERROR')
    expect(result.error).not.toContain('soporte')
  })
})

describe('isNativeAuthOnlyAccount', () => {
  it('detecta las cuentas cuya contraseña vive solo en Supabase Auth', () => {
    expect(isNativeAuthOnlyAccount(buildUser({ password_hash: null }))).toBe(true)
    expect(isNativeAuthOnlyAccount(buildUser({ password_hash: '$2a$12$x' }))).toBe(
      false,
    )
  })
})
