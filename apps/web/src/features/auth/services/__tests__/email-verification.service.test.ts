import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, createClientMock } = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  createClientMock: vi.fn(),
}))

vi.mock('server-only', () => ({}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}))

import {
  EmailVerificationError,
  verifyEmailConfirmation,
} from '../email-verification.service'

const USER_ID = 'a8ed753b-d201-4567-9b20-238533dbb643'
const CONFIRMED_AT = '2026-09-01T21:30:00.000Z'

describe('verifyEmailConfirmation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('derives the profile update exclusively from the verified Auth user', async () => {
    const verifyOtp = vi.fn().mockResolvedValue({
      data: {
        user: { email_confirmed_at: CONFIRMED_AT, id: USER_ID },
      },
      error: null,
    })
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    createClientMock.mockResolvedValue({ auth: { verifyOtp } })
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({ update })),
    })

    await expect(
      verifyEmailConfirmation({ tokenHash: 'hashed-token', type: 'signup' }),
    ).resolves.toEqual({ confirmedAt: CONFIRMED_AT, userId: USER_ID })

    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: 'hashed-token',
      type: 'signup',
    })
    expect(update).toHaveBeenCalledWith({
      email_verified: true,
      email_verified_at: CONFIRMED_AT,
    })
    expect(eq).toHaveBeenCalledWith('id', USER_ID)
  })

  it('rejects an invalid token without touching the public profile', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'expired' },
        }),
      },
    })

    await expect(
      verifyEmailConfirmation({ tokenHash: 'expired-token', type: 'email' }),
    ).rejects.toMatchObject<EmailVerificationError>({
      code: 'INVALID_OR_EXPIRED_TOKEN',
    })

    expect(createAdminClientMock).not.toHaveBeenCalled()
  })

  it('fails when the canonical profile cannot be synchronized', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        verifyOtp: vi.fn().mockResolvedValue({
          data: {
            user: { email_confirmed_at: CONFIRMED_AT, id: USER_ID },
          },
          error: null,
        }),
      },
    })
    createAdminClientMock.mockReturnValue({
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({
            error: { message: 'database unavailable' },
          }),
        })),
      })),
    })

    await expect(
      verifyEmailConfirmation({ tokenHash: 'hashed-token', type: 'email' }),
    ).rejects.toMatchObject<EmailVerificationError>({
      code: 'PROFILE_SYNC_FAILED',
    })
  })
})
