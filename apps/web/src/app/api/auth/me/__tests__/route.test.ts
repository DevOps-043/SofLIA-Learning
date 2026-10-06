import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'
import { SessionService } from '@/features/auth/services/session.service'
import { GET } from '../route'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => { throw new Error('No native Supabase session') }),
}))
vi.mock('@/features/auth/services/session.service', () => ({
  SessionService: { getCurrentUser: vi.fn() },
}))
vi.mock('@/lib/auth/auth-rate-limit', () => ({ applyAuthReadRateLimit: vi.fn(() => null) }))

describe('GET /api/auth/me organization context', () => {
  beforeEach(() => vi.resetAllMocks())

  it('does not read memberships without an authenticated session', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue(null)
    expect((await GET(new Request('https://soflia.ai/api/auth/me'))).status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('resolves active organization context for the verified app user without native auth cookies', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue({ id: 'sso-user' } as never)
    const query = {
      select: vi.fn(() => query), eq: vi.fn(() => query),
      order: vi.fn(() => query), limit: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: {
        organization_id: 'org-1', job_title: 'Engineer', job_description: null,
        organizations: { id: 'org-1', name: 'Acme', slug: 'acme' },
      }, error: null })),
    }
    vi.mocked(createAdminClient).mockReturnValue({ from: vi.fn(() => query) } as never)

    const response = await GET(new Request('https://soflia.ai/api/auth/me'))
    expect((await response.json()).user).toMatchObject({
      id: 'sso-user', organization_id: 'org-1', organization: { slug: 'acme' }, job_title: 'Engineer',
    })
    expect(query.eq.mock.calls).toEqual([
      ['user_id', 'sso-user'], ['status', 'active'], ['organizations.is_active', true],
    ])
  })
})
