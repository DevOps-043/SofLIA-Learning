import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = {
  dbUser: { platform_role: 'Administrador', is_banned: false } as
    | { platform_role: string | null; is_banned: boolean }
    | null,
  dbError: null as { message: string } | null,
  membership: { role: 'admin', status: 'active' } as
    | { role: string | null; status: string | null }
    | null,
  membershipError: null as { message: string } | null,
  organization: { id: '22222222-2222-2222-2222-222222222222' } as
    | { id: string }
    | null,
  organizationError: null as { message: string } | null,
  rateLimitAllowed: true,
}

const recordSecurityEventMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        single: async () => table === 'organization_users'
          ? { data: mockState.membership, error: mockState.membershipError }
          : { data: mockState.dbUser, error: mockState.dbError },
        maybeSingle: async () => table === 'organizations'
          ? { data: mockState.organization, error: mockState.organizationError }
          : { data: null, error: null },
      }
      return builder
    },
  }),
}))

vi.mock('@/lib/rate-limit/rate-limit.check', () => ({
  checkRateLimit: () => ({
    allowed: mockState.rateLimitAllowed,
    remaining: 10,
    resetTime: Date.now() + 60_000,
  }),
}))

vi.mock('@/lib/security/security-events', () => ({
  recordSecurityEvent: (...args: unknown[]) => recordSecurityEventMock(...args),
}))

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import {
  assertPlatformSuperadminGrant,
  authorizePlatformSuperadmin,
  authorizePlatformSuperadminOrganizationActions,
  authorizeOrganizationAdminActions,
  isOrganizationAdminPanelPage,
  isSuperadminPanelPage,
  type SuperadminCapability,
} from '../authorization'

const ADMIN_ID = '11111111-1111-1111-1111-111111111111'

function authorizedParams(capability: SuperadminCapability = 'admin-actions') {
  return {
    capability,
    sessionUserId: ADMIN_ID,
    sessionUserRole: 'Administrador',
    currentPage: '/admin/users',
    promptRiskAction: 'allow' as const,
  }
}

beforeEach(() => {
  mockState.dbUser = { platform_role: 'Administrador', is_banned: false }
  mockState.dbError = null
  mockState.membership = { role: 'admin', status: 'active' }
  mockState.membershipError = null
  mockState.organization = { id: '22222222-2222-2222-2222-222222222222' }
  mockState.organizationError = null
  mockState.rateLimitAllowed = true
  recordSecurityEventMock.mockClear()
})

describe('organization admin authorization', () => {
  const params = {
    sessionUserId: ADMIN_ID,
    currentPage: '/acme/business-panel/users',
    promptRiskAction: 'allow' as const,
    organizationId: '22222222-2222-2222-2222-222222222222',
    organizationSlug: 'acme',
  }

  it('acepta únicamente el business-panel de la organización ligada', () => {
    expect(isOrganizationAdminPanelPage('/acme/business-panel', 'acme')).toBe(true)
    expect(isOrganizationAdminPanelPage('/acme/business-panel/users', 'acme')).toBe(true)
    expect(isOrganizationAdminPanelPage('/otra/business-panel/users', 'acme')).toBe(false)
    expect(isOrganizationAdminPanelPage('/acme/business-user/dashboard', 'acme')).toBe(false)
  })

  it('concede un grant ligado al tenant a owners/admins activos', async () => {
    const grant = await authorizeOrganizationAdminActions(params)
    expect(grant).toMatchObject({
      adminUserId: ADMIN_ID,
      organizationId: params.organizationId,
      organizationSlug: 'acme',
      actorAuthority: 'organization-admin',
      organizationRole: 'admin',
    })

    mockState.membership = { role: ' OWNER ', status: ' ACTIVE ' }
    expect(await authorizeOrganizationAdminActions(params)).toMatchObject({
      actorAuthority: 'organization-admin',
      organizationRole: 'owner',
    })
  })

  it('concede al superadmin un grant ligado al tenant desde business-panel', async () => {
    mockState.membership = { role: 'member', status: 'active' }

    const grant = await authorizePlatformSuperadminOrganizationActions({
      ...params,
      sessionUserRole: 'Administrador',
    })

    expect(grant).toMatchObject({
      adminUserId: ADMIN_ID,
      organizationId: params.organizationId,
      organizationSlug: 'acme',
      actorAuthority: 'platform-superadmin',
      organizationRole: null,
    })
  })

  it('mantiene al superadmin encerrado en el business-panel del tenant visible', async () => {
    expect(await authorizePlatformSuperadminOrganizationActions({
      ...params,
      sessionUserRole: 'Administrador',
      currentPage: '/other/business-panel/hierarchy',
    })).toBeNull()
  })

  it('deniega miembros normales, membresías suspendidas y otra superficie', async () => {
    mockState.membership = { role: 'member', status: 'active' }
    expect(await authorizeOrganizationAdminActions(params)).toBeNull()

    mockState.membership = { role: 'admin', status: 'suspended' }
    expect(await authorizeOrganizationAdminActions(params)).toBeNull()

    mockState.membership = { role: 'owner', status: 'active' }
    expect(await authorizeOrganizationAdminActions({
      ...params,
      currentPage: '/other/business-panel/users',
    })).toBeNull()
  })

  it('deniega todos los estados de membresía que no sean active', async () => {
    for (const status of ['invited', 'suspended', 'removed', null]) {
      mockState.membership = { role: 'admin', status }
      expect(await authorizeOrganizationAdminActions(params)).toBeNull()
    }
  })

  it('deniega usuarios baneados y fallos al revalidar usuario o membresía', async () => {
    mockState.dbUser = { platform_role: 'BusinessUser', is_banned: true }
    expect(await authorizeOrganizationAdminActions(params)).toBeNull()

    mockState.dbUser = null
    mockState.dbError = { message: 'users unavailable' }
    expect(await authorizeOrganizationAdminActions(params)).toBeNull()

    mockState.dbError = null
    mockState.membership = null
    mockState.membershipError = { message: 'membership unavailable' }
    expect(await authorizeOrganizationAdminActions(params)).toBeNull()
  })

  it('deniega un tenant inactivo, inexistente o cuyo ID/slug no coincide', async () => {
    mockState.organization = null
    expect(await authorizeOrganizationAdminActions(params)).toBeNull()
    expect(await authorizePlatformSuperadminOrganizationActions({
      ...params,
      sessionUserRole: 'Administrador',
    })).toBeNull()

    mockState.organizationError = { message: 'organization unavailable' }
    expect(await authorizeOrganizationAdminActions(params)).toBeNull()
  })

  it('deniega el business-user, /admin y el business-panel de otro tenant', async () => {
    for (const currentPage of [
      '/acme/business-user/dashboard',
      '/admin',
      '/other/business-panel',
      undefined,
    ]) {
      expect(await authorizeOrganizationAdminActions({ ...params, currentPage })).toBeNull()
    }
  })

  it('deniega riesgo de inyección y exceso de frecuencia', async () => {
    expect(await authorizeOrganizationAdminActions({
      ...params,
      promptRiskAction: 'guard',
    })).toBeNull()

    mockState.rateLimitAllowed = false
    expect(await authorizeOrganizationAdminActions(params)).toBeNull()
    expect(await authorizePlatformSuperadminOrganizationActions({
      ...params,
      sessionUserRole: 'Administrador',
    })).toBeNull()
  })

  it('revalida el rol global del superadmin al operar dentro de una organización', async () => {
    mockState.dbUser = { platform_role: 'BusinessUser', is_banned: false }

    expect(await authorizePlatformSuperadminOrganizationActions({
      ...params,
      sessionUserRole: 'Administrador',
    })).toBeNull()
  })
})

describe('isSuperadminPanelPage', () => {
  it('accepts only the /admin panel', () => {
    expect(isSuperadminPanelPage('/admin')).toBe(true)
    expect(isSuperadminPanelPage('/admin/companies?tab=1#top')).toBe(true)
  })

  it('rejects every other surface', () => {
    expect(isSuperadminPanelPage('/acme/business-panel/users')).toBe(false)
    expect(isSuperadminPanelPage('/acme/business-user/dashboard')).toBe(false)
    expect(isSuperadminPanelPage('/administracion')).toBe(false)
    expect(isSuperadminPanelPage('/courses/x/learn?next=/admin')).toBe(false)
    expect(isSuperadminPanelPage(null)).toBe(false)
  })
})

describe('authorizePlatformSuperadmin', () => {
  it('grants when every lock passes', async () => {
    const grant = await authorizePlatformSuperadmin(authorizedParams())

    expect(grant?.adminUserId).toBe(ADMIN_ID)
    expect(grant?.capability).toBe('admin-actions')
  })

  it('denies non-admin session roles', async () => {
    const grant = await authorizePlatformSuperadmin({
      ...authorizedParams(),
      sessionUserRole: 'BusinessUser',
    })

    expect(grant).toBeNull()
  })

  it('denies admins outside the /admin panel', async () => {
    for (const currentPage of [
      '/acme/business-panel/users',
      '/acme/business-user/dashboard',
      undefined,
    ]) {
      const grant = await authorizePlatformSuperadmin({
        ...authorizedParams(),
        currentPage,
      })
      expect(grant).toBeNull()
    }
  })

  it('denies turns flagged by the prompt-injection detector', async () => {
    for (const promptRiskAction of ['guard', 'block'] as const) {
      const grant = await authorizePlatformSuperadmin({
        ...authorizedParams(),
        promptRiskAction,
      })
      expect(grant).toBeNull()
    }
  })

  it('denies and audits when the rate limit is exceeded', async () => {
    mockState.rateLimitAllowed = false

    expect(await authorizePlatformSuperadmin(authorizedParams())).toBeNull()
    expect(recordSecurityEventMock).toHaveBeenCalledWith(
      'rate-limit-triggered',
      expect.objectContaining({ actorId: ADMIN_ID }),
    )
  })

  it('denies and audits when the database no longer says the user is admin', async () => {
    mockState.dbUser = { platform_role: 'BusinessUser', is_banned: false }

    expect(await authorizePlatformSuperadmin(authorizedParams())).toBeNull()
    expect(recordSecurityEventMock).toHaveBeenCalledWith(
      'access-denied',
      expect.objectContaining({
        reasons: ['soflia-superadmin:session-db-role-mismatch:admin-actions'],
      }),
    )
  })

  it('denies banned admins even if the session role says admin', async () => {
    mockState.dbUser = { platform_role: 'Administrador', is_banned: true }

    expect(await authorizePlatformSuperadmin(authorizedParams())).toBeNull()
  })

  it('fails closed when the role re-check query errors', async () => {
    mockState.dbUser = null
    mockState.dbError = { message: 'db unavailable' }

    expect(await authorizePlatformSuperadmin(authorizedParams())).toBeNull()
  })
})

describe('assertPlatformSuperadminGrant', () => {
  it('accepts a grant issued for the requested capability', async () => {
    const grant = await authorizePlatformSuperadmin(authorizedParams('admin-actions'))

    expect(() => assertPlatformSuperadminGrant(grant, 'admin-actions')).not.toThrow()
  })

  it('rejects a grant issued for a DIFFERENT capability (no privilege crossover)', async () => {
    const lookupGrant = await authorizePlatformSuperadmin(authorizedParams('user-lookup'))

    expect(() =>
      assertPlatformSuperadminGrant(lookupGrant, 'admin-actions'),
    ).toThrow()
  })

  it('rejects forged grant objects', () => {
    const forged = { adminUserId: 'attacker', capability: 'admin-actions' }

    expect(() => assertPlatformSuperadminGrant(forged, 'admin-actions')).toThrow()
    expect(recordSecurityEventMock).toHaveBeenCalledWith(
      'access-denied',
      expect.objectContaining({
        reasons: ['soflia-superadmin:invalid-grant:admin-actions'],
      }),
    )
  })
})
