import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateLastLoginAt } from '../auth-session.service'

const mocks = vi.hoisted(() => ({ admin: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.admin }))
vi.mock('../session.service', () => ({ SessionService: {} }))
vi.mock('@/lib/auth/refreshToken.service', () => ({ RefreshTokenService: {} }))

beforeEach(() => vi.clearAllMocks())

describe('login activity', () => {
  it('writes server-owned timestamps with the verified user filter', async () => {
    const eq = vi.fn(async () => ({ error: null }))
    const update = vi.fn(() => ({ eq }))
    mocks.admin.mockReturnValue({ from: () => ({ update }) })
    await updateLastLoginAt('verified-user')
    expect(eq).toHaveBeenCalledWith('id', 'verified-user')
    const timestamps = update.mock.calls[0][0]
    expect(timestamps.last_activity_at).toBe(timestamps.last_login_at)
    expect(timestamps.last_login_at).toEqual(expect.any(String))
  })
})
