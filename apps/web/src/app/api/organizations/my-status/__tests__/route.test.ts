import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireUser } from '@/lib/auth/requireUser'
import { GET } from '../route'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => { throw new Error('No native Supabase session') }),
}))
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: vi.fn() }))

function mockStatus(results: Array<{ data: unknown; error?: string }>) {
  const queries = results.map(result => {
    const query = {
      select: vi.fn(() => query), eq: vi.fn(() => query), order: vi.fn(() => query),
      limit: vi.fn(() => query), single: vi.fn(() => query), maybeSingle: vi.fn(() => query),
      throwOnError: vi.fn(async () => {
        if (result.error) throw new Error(result.error)
        return { data: result.data, error: null }
      }),
    }
    return query
  })
  let index = 0
  const from = vi.fn(() => queries[index++])
  vi.mocked(createAdminClient).mockReturnValue({ from } as never)
  return { queries, from }
}

describe('GET /api/organizations/my-status with app sessions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requireUser).mockResolvedValue({ userId: 'sso-user', userEmail: 'user@example.com', userRole: 'Business' })
  })

  it('does not query organizations for a rejected session', async () => {
    vi.mocked(requireUser).mockResolvedValue(NextResponse.json({}, { status: 401 }))
    expect((await GET()).status).toBe(401)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('recognizes an existing active membership instead of restarting onboarding', async () => {
    const { queries } = mockStatus([
      { data: { is_banned: false } }, { data: null },
      { data: { organizations: { id: 'org-1', name: 'Acme', slug: 'acme', is_active: true } } },
    ])
    expect(await (await GET()).json()).toMatchObject({ status: 'approved', organizationSlug: 'acme' })
    for (const query of queries) expect(query.eq).toHaveBeenCalledWith(query === queries[0] ? 'id' : 'user_id', 'sso-user')
    expect(queries[1].eq).toHaveBeenCalledWith('status', 'active')
    expect(queries[2].eq).toHaveBeenCalledWith('status', 'active')
    expect(queries[2].eq).toHaveBeenCalledWith('organizations.is_active', true)
  })

  it('retains the banned-account gate before membership lookup', async () => {
    const { from } = mockStatus([{ data: { is_banned: true, ban_reason: 'suspended account' } }])
    expect(await (await GET()).json()).toMatchObject({ status: 'banned' })
    expect(from).toHaveBeenCalledTimes(1)
  })

  it('reports suspended membership without approving access', async () => {
    mockStatus([
      { data: { is_banned: false } }, { data: null }, { data: null },
      { data: { organizations: { name: 'Acme', slug: 'acme' } } },
    ])
    expect(await (await GET()).json()).toMatchObject({ status: 'suspended' })
  })

  it('does not turn a database failure into status none', async () => {
    mockStatus([{ data: null, error: 'database unavailable' }])
    expect((await GET()).status).toBe(500)
  })

  it('reports none when no memberships or requests exist', async () => {
    mockStatus([{ data: { is_banned: false } }, ...Array.from({ length: 4 }, () => ({ data: null }))])
    expect(await (await GET()).json()).toEqual({ success: true, status: 'none' })
  })
})
