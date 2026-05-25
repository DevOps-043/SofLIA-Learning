import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createAdminClientMock,
  createAuthUserMock,
  createClientMock,
  deleteAuthUserMock,
  insertPayloads,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createAuthUserMock: vi.fn(async () => ({ id: 'auth-user' })),
  createClientMock: vi.fn(),
  deleteAuthUserMock: vi.fn(async () => undefined),
  insertPayloads: [] as Array<Record<string, unknown>>,
}))

vi.mock('../../../../lib/supabase/server', () => ({
  createClient: createClientMock,
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/features/auth/services/supabase-auth-bridge.service', () => ({
  createSupabaseAuthUser: createAuthUserMock,
  createSupabaseAuthUserWithLegacyId: createAuthUserMock,
  deleteSupabaseAuthUser: deleteAuthUserMock,
}))

vi.mock('../password-breach-check.server', () => ({
  validatePasswordIsNotBreached: vi.fn().mockResolvedValue(null),
}))

function createRegisterFormData(overrides: Record<string, string> = {}) {
  const formData = new FormData()
  const values = {
    firstName: 'Ada',
    lastName: 'Lovelace',
    username: 'adalovelace',
    email: 'ada@example.com',
    confirmEmail: 'ada@example.com',
    password: 'Password1234!',
    confirmPassword: 'Password1234!',
    countryCode: 'MX',
    phoneNumber: '5512345678',
    acceptTerms: 'true',
    ...overrides,
  }

  Object.entries(values).forEach(([key, value]) => {
    formData.append(key, value)
  })

  return formData
}

function createSupabaseMock(options: {
  organizationUserInsertError?: { message: string }
} = {}) {
  const usersTable = {
    select: vi.fn(() => ({
      or: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    upsert: vi.fn((payload: Record<string, unknown>) => {
      insertPayloads.push(payload)
      return {
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: { id: payload.id },
            error: null,
          }),
        })),
      }
    }),
  }
  const organizationsTable = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'org-1',
              is_active: true,
              slug: 'acme',
              subscription_plan: 'business',
              subscription_status: 'active',
            },
            error: null,
          }),
        })),
      })),
    })),
  }
  const bulkInviteLinksTable = {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: {
            current_uses: 0,
            expires_at: '2026-06-01T00:00:00.000Z',
            id: 'bulk-1',
            max_uses: 10,
            organization_id: 'org-1',
            role: 'member',
            status: 'active',
          },
          error: null,
        }),
      })),
    })),
  }
  const organizationUsersTable = {
    insert: vi.fn().mockResolvedValue({
      error: options.organizationUserInsertError ?? null,
    }),
    upsert: vi.fn().mockResolvedValue({
      error: options.organizationUserInsertError ?? null,
    }),
  }

  return {
    from: vi.fn((tableName: string) => {
      if (tableName === 'users') {
        return usersTable
      }
      if (tableName === 'organizations') {
        return organizationsTable
      }
      if (tableName === 'bulk_invite_links') {
        return bulkInviteLinksTable
      }
      if (tableName === 'organization_users') {
        return organizationUsersTable
      }

      throw new Error(`Unexpected table ${tableName}`)
    }),
  }
}

describe('registerAction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    insertPayloads.length = 0
    createClientMock.mockResolvedValue(createSupabaseMock())
    createAdminClientMock.mockReturnValue(createSupabaseMock())
  })

  it('inserts optional demographics when provided', async () => {
    const { registerAction } = await import('../register')

    const result = await registerAction(
      createRegisterFormData({
        dateOfBirth: '1990-05-10',
        gender: 'female',
      }),
    )

    expect(result).toMatchObject({ success: true })
    expect(createAuthUserMock).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'ada@example.com',
        password: 'Password1234!',
      }),
    )
    expect(insertPayloads[0]).toMatchObject({
      date_of_birth: '1990-05-10',
      gender: 'female',
    })
    expect(insertPayloads[0]).not.toHaveProperty('password_hash')
  })

  it('allows omitted demographics for public registration', async () => {
    const { registerAction } = await import('../register')

    const result = await registerAction(createRegisterFormData())

    expect(result).toMatchObject({ success: true })
    expect(insertPayloads[0]).toMatchObject({
      date_of_birth: null,
      gender: null,
    })
  })

  it('rolls back auth user when organization membership creation fails', async () => {
    createClientMock.mockResolvedValue(createSupabaseMock())
    createAdminClientMock.mockReturnValue(
      createSupabaseMock({
        organizationUserInsertError: { message: 'membership failed' },
      }),
    )
    const { registerAction } = await import('../register')

    const result = await registerAction(
      createRegisterFormData({
        bulkInviteToken: 'bulk-token',
        organizationId: 'org-1',
        organizationSlug: 'acme',
      }),
    )

    expect(result).toEqual({
      error: 'Error al vincular la cuenta con la organizacion',
    })
    expect(deleteAuthUserMock).toHaveBeenCalled()
  })
})
