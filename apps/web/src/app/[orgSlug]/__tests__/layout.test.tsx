import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAdminClient } from '@/lib/supabase/admin'
import { SessionService } from '@/features/auth/services/session.service'
import OrganizationLayout from '../layout'

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => { throw new Error('No native Supabase session') }),
}))
vi.mock('@/features/auth/services/session.service', () => ({
  SessionService: { getCurrentUser: vi.fn() },
}))
vi.mock('../OrganizationLayoutClient', () => ({ OrganizationLayoutClient: () => null }))
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => { throw new Error(`redirect:${url}`) }),
  notFound: vi.fn(() => { throw new Error('not-found') }),
}))

function mockAccess({ role = 'Business User', membership = true, organization = true, membershipError = false } = {}) {
  const builder = (data: unknown, error: unknown = null) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      single: vi.fn(async () => ({ data, error })),
      maybeSingle: vi.fn(async () => ({ data, error })),
    }
    return query
  }
  const queries = {
    users: builder({ platform_role: role }),
    organizations: builder(organization ? { id: 'org-1', slug: 'acme', name: 'Acme' } : null),
    organization_users: builder(membership ? { role: 'member' } : null, membershipError ? { message: 'query failed' } : null),
  }
  vi.mocked(createAdminClient).mockReturnValue({
    from: vi.fn((table: keyof typeof queries) => queries[table]),
  } as unknown as ReturnType<typeof createAdminClient>)
  return queries
}

const render = () => OrganizationLayout({ children: 'private content', params: Promise.resolve({ orgSlug: 'acme' }) })

describe('organization layout authorization with an app session', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue({ id: 'sso-user' } as never)
  })

  it('redirects unauthenticated users before any privileged query', async () => {
    vi.mocked(SessionService.getCurrentUser).mockResolvedValue(null)
    await expect(render()).rejects.toThrow('redirect:/auth')
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it('allows an active member without native Supabase cookies and retains their member role', async () => {
    const queries = mockAccess()
    const result = await render()
    expect(result.props.organization).toMatchObject({ id: 'org-1', role: 'member', isPlatformAdmin: false })
    expect(queries.users.eq).toHaveBeenCalledWith('id', 'sso-user')
    expect(queries.organizations.eq).toHaveBeenCalledWith('is_active', true)
    expect(queries.organization_users.eq.mock.calls).toEqual([
      ['user_id', 'sso-user'], ['status', 'active'], ['organizations.slug', 'acme'],
    ])
  })

  it('denies foreign organizations and suspended or removed memberships', async () => {
    mockAccess({ membership: false })
    await expect(render()).rejects.toThrow('redirect:/dashboard?error=not_member')
  })

  it('fails closed if the membership query fails', async () => {
    mockAccess({ membership: false, membershipError: true })
    await expect(render()).rejects.toThrow('redirect:/dashboard?error=not_member')
  })

  it('rejects inactive or missing organizations', async () => {
    mockAccess({ organization: false })
    await expect(render()).rejects.toThrow('not-found')
  })

  it('preserves the existing platform administrator exception', async () => {
    mockAccess({ role: 'Administrador', membership: false })
    expect((await render()).props.organization).toMatchObject({ role: 'admin', isPlatformAdmin: true })
  })
})
