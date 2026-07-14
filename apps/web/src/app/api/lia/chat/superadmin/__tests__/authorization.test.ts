import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockState = {
  dbUser: { platform_role: 'Administrador', is_banned: false } as
    | { platform_role: string | null; is_banned: boolean }
    | null,
  dbError: null as { message: string } | null,
  rateLimitAllowed: true,
}

const recordSecurityEventMock = vi.fn()

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: mockState.dbUser, error: mockState.dbError }),
        }),
      }),
    }),
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
  mockState.rateLimitAllowed = true
  recordSecurityEventMock.mockClear()
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
