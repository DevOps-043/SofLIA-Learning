import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  loadHierarchyContext,
  requireHierarchicalAccess,
  requireHierarchyEnabled,
  requireHierarchyRole,
} from '../hierarchicalAuth'
import { makeRequest } from './hierarchicalAuth.fixtures'

describe('hierarchicalAuth middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads a placeholder hierarchy context from the request organization id', async () => {
    const req = makeRequest({
      headers: { 'x-organization-id': 'org-1' },
      user: { email: 'user@test.com', id: 'user-1', role: 'member' },
    })
    const next = vi.fn()

    await loadHierarchyContext(req, {} as never, next)

    expect(req.hierarchyContext).toEqual({
      accessibleTeamIds: null,
      hierarchyEnabled: false,
      organizationId: 'org-1',
      scope: 'organization',
      userRole: 'member',
    })
    expect(next).toHaveBeenCalledWith()
  })

  it('skips hierarchy loading when there is no authenticated user or organization', async () => {
    const req = makeRequest()
    const next = vi.fn()

    await loadHierarchyContext(req, {} as never, next)

    expect(req.hierarchyContext).toBeUndefined()
    expect(next).toHaveBeenCalledWith()
  })

  it('denies requests when the scoped resource is outside access', async () => {
    const middleware = requireHierarchicalAccess(async () => ({
      organizationId: 'org-1',
      teamId: 'team-2',
    }))
    const req = makeRequest({
      hierarchyContext: {
        accessibleTeamIds: ['team-1'],
        hierarchyEnabled: true,
        organizationId: 'org-1',
        scope: 'team',
        teamId: 'team-1',
        userRole: 'team_leader',
      },
    })
    const next = vi.fn()

    await middleware(req, {} as never, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'OUTSIDE_TEAM', statusCode: 403 }),
    )
  })

  it('requires organization context before checking hierarchy roles', () => {
    const next = vi.fn()

    requireHierarchyRole('admin')(makeRequest(), {} as never, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'MISSING_ORGANIZATION_CONTEXT',
        statusCode: 400,
      }),
    )
  })

  it('requires hierarchy to be enabled when the middleware is applied', () => {
    const next = vi.fn()

    requireHierarchyEnabled(
      makeRequest({
        hierarchyContext: {
          accessibleTeamIds: null,
          hierarchyEnabled: false,
          organizationId: 'org-1',
          scope: 'organization',
          userRole: 'admin',
        },
      }),
      {} as never,
      next,
    )

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'HIERARCHY_NOT_ENABLED', statusCode: 400 }),
    )
  })
})
