import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createAdminClientMock,
  createAuthUserMock,
  deleteAuthUserMock,
  upsertPayloads,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createAuthUserMock: vi.fn(async () => ({ id: 'auth-user-1' })),
  deleteAuthUserMock: vi.fn(async () => undefined),
  upsertPayloads: [] as Array<Record<string, unknown>>,
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('../supabase-auth-bridge.service', () => ({
  createSupabaseAuthUser: createAuthUserMock,
  createSupabaseAuthUserWithLegacyId: createAuthUserMock,
  deleteSupabaseAuthUser: deleteAuthUserMock,
}))

function createSupabaseMock(options: {
  existingProfiles?: Array<{ email: string | null; username: string }>
  profileError?: { code?: string; message: string; status?: number }
} = {}) {
  const usersTable = {
    select: vi.fn(() => ({
      or: vi.fn().mockResolvedValue({
        data: options.existingProfiles ?? [],
        error: null,
      }),
    })),
    upsert: vi.fn((payload: Record<string, unknown>) => {
      upsertPayloads.push(payload)
      return {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: options.profileError ? null : { id: payload.id },
            error: options.profileError ?? null,
          }),
        })),
      }
    }),
  }

  return {
    from: vi.fn((tableName: string) => {
      if (tableName !== 'users') {
        throw new Error(`Unexpected table ${tableName}`)
      }

      return usersTable
    }),
  }
}

function createProvisioningInput() {
  return {
    cargoRol: 'Usuario',
    countryCode: 'MX',
    dateOfBirth: '1990-05-10',
    displayName: 'Ada Lovelace',
    email: 'ADA@Example.com',
    emailVerified: true,
    firstName: 'Ada',
    gender: 'female',
    lastName: 'Lovelace',
    password: 'Password1234!',
    phone: '5512345678',
    username: 'adalovelace',
  }
}

describe('provisionAuthAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    upsertPayloads.length = 0
    createAuthUserMock.mockResolvedValue({ id: 'auth-user-1' })
    createAdminClientMock.mockReturnValue(createSupabaseMock())
  })

  it('creates an Auth user and upserts a profile without password_hash', async () => {
    const { provisionAuthAccount } = await import('../auth-account-provisioning.service')

    const result = await provisionAuthAccount(createProvisioningInput())

    expect(result).toEqual({
      authUserId: 'auth-user-1',
      userId: 'auth-user-1',
    })
    expect(createAuthUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        password: 'Password1234!',
      }),
    )
    expect(upsertPayloads[0]).toMatchObject({
      email: 'ada@example.com',
      id: 'auth-user-1',
      username: 'adalovelace',
    })
    expect(upsertPayloads[0]).not.toHaveProperty('password_hash')
  })

  it('defaults email verification to false when the trusted caller omits it', async () => {
    const { provisionAuthAccount } = await import('../auth-account-provisioning.service')
    const input = { ...createProvisioningInput(), emailVerified: undefined }

    await provisionAuthAccount(input)

    expect(createAuthUserMock).toHaveBeenCalledWith(
      expect.objectContaining({ email_verified: false }),
    )
    expect(upsertPayloads[0]).toMatchObject({
      email_verified: false,
      email_verified_at: null,
    })
  })

  it('fails before Auth creation when email already exists in public.users', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        existingProfiles: [{ email: 'ada@example.com', username: 'other' }],
      }),
    )
    const { mapProvisioningError, provisionAuthAccount } = await import(
      '../auth-account-provisioning.service'
    )

    await expect(provisionAuthAccount(createProvisioningInput())).rejects.toMatchObject({
      code: 'DUPLICATE_EMAIL',
    })
    await provisionAuthAccount(createProvisioningInput()).catch((error) => {
      expect(mapProvisioningError(error)).toBe('El email ya existe')
    })
    expect(createAuthUserMock).not.toHaveBeenCalled()
  })

  it('rolls back the Auth user when profile upsert fails', async () => {
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        profileError: {
          code: '23505',
          message: 'duplicate key value violates unique constraint',
          status: 409,
        },
      }),
    )
    const { provisionAuthAccount } = await import('../auth-account-provisioning.service')

    await expect(provisionAuthAccount(createProvisioningInput())).rejects.toMatchObject({
      code: 'PROFILE_CREATE_FAILED',
    })
    expect(deleteAuthUserMock).toHaveBeenCalledWith('auth-user-1')
  })

  it('maps Supabase Auth trigger failures to a safe auth creation error', async () => {
    createAuthUserMock.mockRejectedValue(
      new Error('Database error creating new user'),
    )
    const { mapProvisioningError, provisionAuthAccount } = await import(
      '../auth-account-provisioning.service'
    )

    await provisionAuthAccount(createProvisioningInput()).catch((error) => {
      expect(error).toMatchObject({ code: 'AUTH_CREATE_FAILED' })
      expect(mapProvisioningError(error)).toBe(
        'Error al crear usuario de autenticacion',
      )
    })
    expect(deleteAuthUserMock).not.toHaveBeenCalled()
  })
})
