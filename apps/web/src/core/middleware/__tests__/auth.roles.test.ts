import { describe, expect, it } from 'vitest'

import { hasRoleAccess, normalizeRole } from '../auth.roles'
import { VALID_ROLES } from '../auth.types'

describe('hasRoleAccess', () => {
  it('has a branch for every VALID_ROLES entry (no silent return false for a real role)', () => {
    // Regression guard: 'Business User' used to fall through to the final
    // `return false`, locking every organization employee out of /dashboard,
    // /business-user/*, etc. This asserts each valid role gets at least one
    // route it is allowed to access, so a newly added role can't repeat the gap.
    for (const role of VALID_ROLES) {
      const anyRouteAllowed =
        hasRoleAccess(role, '/dashboard') ||
        hasRoleAccess(role, '/business-panel') ||
        hasRoleAccess(role, '/some-org-slug/business-user/dashboard') ||
        hasRoleAccess(role, '/admin/dashboard')

      expect(anyRouteAllowed).toBe(true)
    }
  })

  it('grants a Business User their org-scoped area and the generic self-service routes', () => {
    expect(hasRoleAccess('Business User', '/some-org-slug/business-user/dashboard')).toBe(true)
    expect(hasRoleAccess('Business User', '/dashboard')).toBe(true)
    expect(hasRoleAccess('Business User', '/profile')).toBe(true)
    expect(hasRoleAccess('Business User', '/courses')).toBe(true)
  })

  it('keeps the org-admin panel and platform admin panel off-limits for a Business User', () => {
    expect(hasRoleAccess('Business User', '/some-org-slug/business-panel/dashboard')).toBe(false)
    expect(hasRoleAccess('Business User', '/admin/dashboard')).toBe(false)
  })

  it('still grants an org admin (Business role) both the admin panel and the employee area', () => {
    expect(hasRoleAccess('Business', '/some-org-slug/business-panel/dashboard')).toBe(true)
    expect(hasRoleAccess('Business', '/some-org-slug/business-user/dashboard')).toBe(true)
  })
})

describe('normalizeRole', () => {
  it('recognizes "Business User" as a valid role', () => {
    expect(normalizeRole('Business User')).toBe('Business User')
  })
})
