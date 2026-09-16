import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
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

const request = () => new NextRequest('https://soflia.ai/api/users/organizations?user_id=other-user')

function mockMemberships(error: { message: string } | null = null) {
  const rows = [
    { user_id: 'sso-user', status: 'active', role: 'member', organizations: { id: 'org-1', slug: 'one', is_active: true } },
    { user_id: 'sso-user', status: 'active', role: 'owner', organizations: { id: 'org-2', slug: 'two', is_active: true } },
    { user_id: 'other-user', status: 'active', role: 'admin', organizations: { id: 'foreign-org', is_active: true } },
    { user_id: 'sso-user', status: 'suspended', role: 'owner', organizations: { id: 'suspended-org', is_active: true } },
    { user_id: 'sso-user', status: 'active', role: 'member', organizations: { id: 'inactive-org', is_active: false } },
  ]
  const filters = new Map<string, unknown>()
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((key: string, value: unknown) => { filters.set(key, value); return query }),
    order: vi.fn(async () => ({
      data: rows.filter(row => [...filters].every(([key, value]) => {
        if (key === 'organizations.is_active') return row.organizations.is_active === value
        return row[key as 'user_id' | 'status'] === value
      })),
      error,
    })),
  }
  const client = { from: vi.fn(() => query) }
  vi.mocked(createAdminClient).mockReturnValue(client as unknown as ReturnType<typeof createAdminClient>)
  return query
}

describe('GET /api/users/organizations with app sessions', () => {
  beforeEach(() => vi.resetAllMocks())

  it('rejects missing or rejected sessions before reading organizations', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue(null)
    expect((await GET(request())).status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('returns only this session user’s active memberships and preserves each organization role', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue({ id: 'sso-user' } as never)
    const query = mockMemberships()
    const response = await GET(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.organizations.map((org: { id: string; role: string }) => [org.id, org.role]))
      .toEqual([['org-1', 'member'], ['org-2', 'owner']])
    expect(query.eq).toHaveBeenCalledWith('user_id', 'sso-user')
    expect(response.headers.get('Cache-Control')).toContain('no-store')
  })

  it('returns an empty list only when the authenticated user has no matching memberships', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue({ id: 'no-memberships' } as never)
    mockMemberships()
    expect(await (await GET(request())).json()).toEqual({ success: true, organizations: [] })
  })

  it('reports query errors instead of a successful empty list', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue({ id: 'sso-user' } as never)
    mockMemberships({ message: 'database unavailable' })
    expect((await GET(request())).status).toBe(500)
  })
})
