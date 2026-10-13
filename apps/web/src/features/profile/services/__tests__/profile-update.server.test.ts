import { beforeEach, describe, expect, it, vi } from 'vitest'
import { updateProfile } from '../profile-server/profile-update.service'

const mocks = vi.hoisted(() => ({ admin: vi.fn(), membership: vi.fn(), notify: vi.fn() }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: mocks.admin }))
vi.mock('@/lib/supabase/server', () => ({ createClient: () => { throw new Error('SESSION_CLIENT_HAS_NO_PRIVILEGES') } }))
vi.mock('@/lib/services/user-org-context.service', () => ({ resolveUserPrimaryMembership: mocks.membership }))
vi.mock('../profile-server/profile-update-notification.service', () => ({ notifyProfileUpdatedBestEffort: mocks.notify }))

beforeEach(() => {
  vi.clearAllMocks()
  mocks.membership.mockResolvedValue(null)
})

describe('profile update after session authorization', () => {
  it('uses server privileges while retaining owner filters and excluding protected fields', async () => {
    const old = { id: 'verified-user', created_at: '2026-01-01', first_name: 'Ada' }
    const readEq = vi.fn(() => ({ single: async () => ({ data: old, error: null }) }))
    const updateEq = vi.fn(() => ({ select: () => ({ single: async () => ({ data: { ...old, first_name: 'Grace' }, error: null }) }) }))
    const update = vi.fn(() => ({ eq: updateEq }))
    mocks.admin.mockReturnValue({ from: () => ({ select: () => ({ eq: readEq }), update }) })
    const result = await updateProfile('verified-user', {
      first_name: 'Grace', platform_role: 'Administrador', is_banned: false, email_verified: true,
    } as Parameters<typeof updateProfile>[1])
    expect(result.first_name).toBe('Grace')
    expect(readEq).toHaveBeenCalledWith('id', 'verified-user')
    expect(updateEq).toHaveBeenCalledWith('id', 'verified-user')
    expect(update).toHaveBeenCalledWith({ first_name: 'Grace', updated_at: expect.any(String) })
  })
})
