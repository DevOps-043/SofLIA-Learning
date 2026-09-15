import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, loggerWarnMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  loggerWarnMock: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: loggerWarnMock,
  },
}))

import {
  confirmEmailFromTrustedSso,
  SupabaseAuthBridgeError,
} from '../supabase-auth-bridge.service'

const USER_ID = '95c63337-2f66-49be-8f63-c76e78d955c8'
const CONFIRMED_AT = '2026-09-01T21:00:00.000Z'

function createSupabaseMock(
  options: {
    authEmail?: string
    confirmedAt?: string | null
    profileEmail?: string
    profileError?: { message: string } | null
    syncError?: { message: string } | null
  } = {},
) {
  const getUserById = vi.fn().mockResolvedValue({
    data: {
      user: {
        email: options.authEmail ?? 'person@example.com',
        email_confirmed_at: options.confirmedAt ?? null,
        id: USER_ID,
      },
    },
    error: null,
  })
  const updateUserById = vi.fn().mockResolvedValue({
    data: {
      user: {
        email: options.authEmail ?? 'person@example.com',
        email_confirmed_at: CONFIRMED_AT,
        id: USER_ID,
      },
    },
    error: null,
  })
  const maybeSingle = vi.fn().mockResolvedValue({
    data: options.profileError
      ? null
      : { email: options.profileEmail ?? 'person@example.com' },
    error: options.profileError ?? null,
  })
  const profileEq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq: profileEq }))
  const syncEq = vi.fn().mockResolvedValue({
    error: options.syncError ?? null,
  })
  const update = vi.fn(() => ({ eq: syncEq }))

  return {
    auth: { admin: { getUserById, updateUserById } },
    from: vi.fn(() => ({ select, update })),
    spies: { getUserById, syncEq, update, updateUserById },
  }
}

describe('confirmEmailFromTrustedSso', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('confirms an existing manual account and synchronizes its public profile', async () => {
    const supabase = createSupabaseMock()
    createAdminClientMock.mockReturnValue(supabase)

    await expect(
      confirmEmailFromTrustedSso({
        email: 'PERSON@example.com',
        provider: 'google',
        userId: USER_ID,
      }),
    ).resolves.toEqual({ confirmedAt: CONFIRMED_AT })

    expect(supabase.spies.updateUserById).toHaveBeenCalledWith(USER_ID, {
      email_confirm: true,
    })
    expect(supabase.spies.update).toHaveBeenCalledWith({
      email_verified: true,
      email_verified_at: CONFIRMED_AT,
    })
    expect(supabase.spies.syncEq).toHaveBeenCalledWith('id', USER_ID)
  })

  it('is idempotent when Supabase Auth already confirmed the email', async () => {
    const supabase = createSupabaseMock({ confirmedAt: CONFIRMED_AT })
    createAdminClientMock.mockReturnValue(supabase)

    await confirmEmailFromTrustedSso({
      email: 'person@example.com',
      provider: 'microsoft',
      userId: USER_ID,
    })

    expect(supabase.spies.updateUserById).not.toHaveBeenCalled()
    expect(supabase.spies.update).toHaveBeenCalledOnce()
  })

  it('fails closed when provider, Auth and public profile emails differ', async () => {
    const supabase = createSupabaseMock({
      profileEmail: 'different@example.com',
    })
    createAdminClientMock.mockReturnValue(supabase)

    await expect(
      confirmEmailFromTrustedSso({
        email: 'person@example.com',
        provider: 'google',
        userId: USER_ID,
      }),
    ).rejects.toMatchObject<SupabaseAuthBridgeError>({
      code: 'AUTH_EMAIL_MISMATCH',
    })

    expect(supabase.spies.updateUserById).not.toHaveBeenCalled()
    expect(supabase.spies.update).not.toHaveBeenCalled()
  })

  it('does not issue a verified profile when canonical synchronization fails', async () => {
    const supabase = createSupabaseMock({
      syncError: { message: 'database unavailable' },
    })
    createAdminClientMock.mockReturnValue(supabase)

    await expect(
      confirmEmailFromTrustedSso({
        email: 'person@example.com',
        provider: 'google',
        userId: USER_ID,
      }),
    ).rejects.toMatchObject<SupabaseAuthBridgeError>({
      code: 'AUTH_PROFILE_SYNC_FAILED',
    })
  })
})
