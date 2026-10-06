import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createAdminClient } from '../../../../lib/supabase/admin'
import { confirmEmailFromTrustedSso } from '../supabase-auth-bridge.service'

vi.mock('server-only', () => ({}))
vi.mock('../../../../lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('../email.utils', () => ({ getEmailAppUrl: () => 'https://soflia.ai' }))

interface AuthUserLike {
  email: string | null
  email_confirmed_at: string | null
}

function buildAdminMock({
  authUser,
  authError = null,
  profileEmail,
  profileError = null,
}: {
  authUser: AuthUserLike | null
  authError?: { message: string; status?: number } | null
  profileEmail: string | null
  profileError?: { message: string } | null
}) {
  const updateEq = vi.fn().mockResolvedValue({ error: null })
  const update = vi.fn(() => ({ eq: updateEq }))
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: { email: profileEmail }, error: profileError })
  const selectEq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq: selectEq }))
  const from = vi.fn(() => ({ select, update }))

  const getUserById = vi
    .fn()
    .mockResolvedValue({ data: { user: authUser }, error: authError })
  const updateUserById = vi.fn(
    (_id: string, attrs: { email?: string; email_confirm?: boolean }) => ({
      data: {
        user: attrs.email_confirm
          ? { email_confirmed_at: '2026-01-01T00:00:00.000Z' }
          : null,
      },
      error: null,
    }),
  )

  const admin = { auth: { admin: { getUserById, updateUserById } }, from }
  vi.mocked(createAdminClient).mockReturnValue(
    admin as unknown as ReturnType<typeof createAdminClient>,
  )
  return { from, select, selectEq, maybeSingle, update, updateEq, getUserById, updateUserById }
}

describe('confirmEmailFromTrustedSso', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('throws AUTH_EMAIL_MISMATCH when identities disagree and the provider link is new', async () => {
    buildAdminMock({
      authUser: { email: 'person@pulsehub.mx', email_confirmed_at: '2025-01-01T00:00:00.000Z' },
      profileEmail: 'person@soflia.ai',
    })

    await expect(
      confirmEmailFromTrustedSso({
        email: 'person@soflia.ai',
        isProviderAlreadyLinked: false,
        provider: 'google',
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_EMAIL_MISMATCH' })
  })

  it('syncs a stale auth.users email instead of throwing when the provider was already linked', async () => {
    const { update, updateUserById } = buildAdminMock({
      authUser: { email: 'ernesto.hernandez@pulsehub.mx', email_confirmed_at: '2025-01-01T00:00:00.000Z' },
      profileEmail: 'ernesto.hernandez@soflia.ai',
    })

    const result = await confirmEmailFromTrustedSso({
      email: 'ernesto.hernandez@soflia.ai',
      isProviderAlreadyLinked: true,
      provider: 'google',
      userId: 'user-1',
    })

    expect(updateUserById).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ email: 'ernesto.hernandez@soflia.ai', email_confirm: true }),
    )
    expect(result.confirmedAt).toBe('2026-01-01T00:00:00.000Z')
    // public.users.email was already correct: the only update() call is the
    // final email_verified sync, never a profile email rewrite.
    expect(update).toHaveBeenCalledTimes(1)
    expect(update).not.toHaveBeenCalledWith({ email: expect.any(String) })
  })

  it('syncs a stale public.users email too when the provider was already linked', async () => {
    const { update, updateUserById } = buildAdminMock({
      authUser: { email: 'person@new.example', email_confirmed_at: '2025-01-01T00:00:00.000Z' },
      profileEmail: 'person@old.example',
    })

    await confirmEmailFromTrustedSso({
      email: 'person@new.example',
      isProviderAlreadyLinked: true,
      provider: 'google',
      userId: 'user-1',
    })

    expect(update).toHaveBeenCalledWith({ email: 'person@new.example' })
    // auth.users.email already matched, so the confirm-sync call never needs
    // to change it.
    expect(updateUserById).not.toHaveBeenCalled()
  })

  it('does not touch anything when both identities already match the provider email', async () => {
    const { update, updateUserById } = buildAdminMock({
      authUser: { email: 'person@soflia.ai', email_confirmed_at: '2025-01-01T00:00:00.000Z' },
      profileEmail: 'person@soflia.ai',
    })

    await confirmEmailFromTrustedSso({
      email: 'person@soflia.ai',
      isProviderAlreadyLinked: false,
      provider: 'google',
      userId: 'user-1',
    })

    expect(updateUserById).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith({
      email_verified: true,
      email_verified_at: '2025-01-01T00:00:00.000Z',
    })
  })

  it('throws AUTH_USER_NOT_FOUND when there is no matching Supabase Auth user', async () => {
    buildAdminMock({
      authUser: null,
      authError: { message: 'User not found', status: 404 },
      profileEmail: 'person@soflia.ai',
    })

    await expect(
      confirmEmailFromTrustedSso({
        email: 'person@soflia.ai',
        isProviderAlreadyLinked: true,
        provider: 'google',
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_USER_NOT_FOUND' })
  })
})
