import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveOrganizationAccess } from '../business-auth/organization.service'

function createQueryBuilder(config: {
  singleResult?: { data: unknown; error: { message: string } | null }
  limitResult?: { data: unknown; error: { message: string } | null }
}) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    order: vi.fn(() => builder),
    limit: vi.fn(async () => config.limitResult),
    single: vi.fn(async () => config.singleResult),
  }

  return builder
}

function createSupabaseStub(config: {
  organizations: { data: unknown; error: { message: string } | null }
  membership: { data: unknown; error: { message: string } | null }
  latestOrg?: { data: unknown; error: { message: string } | null }
}) {
  const organizations = createQueryBuilder({ singleResult: config.organizations })
  const organizationUsersSingle = createQueryBuilder({ singleResult: config.membership })
  const organizationUsersList = createQueryBuilder({ limitResult: config.latestOrg })

  let organizationUsersCalls = 0

  return {
    client: {
      from: vi.fn((table: string) => {
        if (table === 'organizations') {
          return organizations
        }

        if (table === 'organization_users') {
          organizationUsersCalls += 1
          return organizationUsersCalls === 1 ? organizationUsersSingle : organizationUsersList
        }

        throw new Error(`Unexpected table ${table}`)
      }),
    } as never,
    organizations,
    organizationUsersSingle,
    organizationUsersList,
  }
}

const logger = {
  auth: vi.fn(),
  warn: vi.fn(),
}

describe('resolveOrganizationAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('treats organizationSlug strictly as slug when resolving a requested organization', async () => {
    const { client, organizations } = createSupabaseStub({
      organizations: {
        data: { id: 'org-1', slug: 'acme' },
        error: null,
      },
      membership: {
        data: { role: 'admin' },
        error: null,
      },
    })

    const result = await resolveOrganizationAccess({
      supabase: client,
      userId: 'user-1',
      isPlatformAdmin: false,
      options: { organizationSlug: 'acme' },
      adminFallbackRole: 'admin',
      logger,
    })

    expect(result).toEqual({
      ok: true,
      value: {
        organizationId: 'org-1',
        organizationSlug: 'acme',
        organizationRole: 'admin',
        isOrgAdmin: true,
      },
    })
    expect(organizations.eq).toHaveBeenCalledWith('slug', 'acme')
    expect(organizations.eq).not.toHaveBeenCalledWith('id', 'acme')
  })

  it('grants platform admins access to a requested organization even without membership', async () => {
    const { client } = createSupabaseStub({
      organizations: {
        data: { id: 'org-2', slug: 'enterprise' },
        error: null,
      },
      membership: {
        data: null,
        error: { message: 'not found' },
      },
    })

    const result = await resolveOrganizationAccess({
      supabase: client,
      userId: 'admin-1',
      isPlatformAdmin: true,
      options: { organizationSlug: 'enterprise' },
      adminFallbackRole: 'member',
      logger,
    })

    expect(result).toEqual({
      ok: true,
      value: {
        organizationId: 'org-2',
        organizationSlug: 'enterprise',
        organizationRole: 'member',
        isOrgAdmin: false,
      },
    })
  })
})
