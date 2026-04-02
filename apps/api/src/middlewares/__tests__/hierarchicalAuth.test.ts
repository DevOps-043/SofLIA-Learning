import type { Request } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildHierarchyWhereClause,
  canManageUser,
  checkHierarchicalAccess,
  determineDefaultScope,
  getAccessibleTeamIds,
  isRoleEqualOrHigher,
  loadHierarchyContext,
  requireHierarchicalAccess,
  requireHierarchyEnabled,
  requireHierarchyRole,
} from '../hierarchicalAuth'

function makeRequest(overrides: Partial<Request> = {}): Request {
  return {
    headers: {},
    params: {},
    query: {},
    ...overrides,
  } as Request
}

describe('hierarchicalAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows access when hierarchy is disabled for the organization', () => {
    expect(
      checkHierarchicalAccess(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: false,
          organizationId: 'org-1',
          scope: 'team',
          teamId: 'team-1',
          userRole: 'member',
        },
        { organizationId: 'org-1', teamId: 'team-2' }
      )
    ).toEqual({ hasAccess: true })
  })

  it('rejects resources that belong to a different organization', () => {
    expect(
      checkHierarchicalAccess(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: true,
          organizationId: 'org-1',
          scope: 'organization',
          userRole: 'admin',
        },
        { organizationId: 'org-2' }
      )
    ).toEqual({
      code: 'WRONG_ORGANIZATION',
      hasAccess: false,
      reason: 'El recurso pertenece a otra organización',
    })
  })

  it('restricts region-scoped users to their assigned region', () => {
    expect(
      checkHierarchicalAccess(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: true,
          organizationId: 'org-1',
          regionId: 'region-1',
          scope: 'region',
          userRole: 'regional_manager',
        },
        { organizationId: 'org-1', regionId: 'region-2' }
      )
    ).toEqual({
      code: 'OUTSIDE_REGION',
      hasAccess: false,
      reason: 'El recurso está fuera de tu región asignada',
    })
  })

  it('allows team-scoped users to reach explicitly accessible teams', () => {
    expect(
      checkHierarchicalAccess(
        {
          accessibleTeamIds: ['team-2', 'team-3'],
          hierarchyEnabled: true,
          organizationId: 'org-1',
          scope: 'team',
          teamId: 'team-1',
          userRole: 'team_leader',
        },
        { organizationId: 'org-1', teamId: 'team-3' }
      )
    ).toEqual({ hasAccess: true })
  })

  it('maps roles to their default scopes', () => {
    expect(determineDefaultScope('owner')).toBe('organization')
    expect(determineDefaultScope('regional_manager')).toBe('region')
    expect(determineDefaultScope('zone_manager')).toBe('zone')
    expect(determineDefaultScope('member')).toBe('team')
  })

  it('loads a placeholder hierarchy context from the request organization id', async () => {
    const req = makeRequest({
      headers: { 'x-organization-id': 'org-1' },
      user: {
        email: 'user@test.com',
        id: 'user-1',
        role: 'member',
      },
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

  it('denies requests in requireHierarchicalAccess when the scoped resource is outside access', async () => {
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
      expect.objectContaining({
        code: 'OUTSIDE_TEAM',
        statusCode: 403,
      })
    )
  })

  it('requires organization context before checking hierarchy roles', () => {
    const next = vi.fn()

    requireHierarchyRole('admin')(makeRequest(), {} as never, next)

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'MISSING_ORGANIZATION_CONTEXT',
        statusCode: 400,
      })
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
      next
    )

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'HIERARCHY_NOT_ENABLED',
        statusCode: 400,
      })
    )
  })

  it('builds a SQL filter for team-scoped users with accessible teams', () => {
    expect(
      buildHierarchyWhereClause(
        {
          accessibleTeamIds: ['team-1', 'team-2'],
          hierarchyEnabled: true,
          organizationId: 'org-1',
          scope: 'team',
          teamId: 'team-1',
          userRole: 'team_leader',
        },
        'u.'
      )
    ).toEqual({
      clause: '(u.team_id = ANY(:teamIds) OR u.team_id IS NULL)',
      params: { teamIds: ['team-1', 'team-2'] },
    })
  })

  it('computes accessible team ids and management permissions from hierarchy context', () => {
    expect(
      getAccessibleTeamIds({
        accessibleTeamIds: null,
        hierarchyEnabled: true,
        organizationId: 'org-1',
        scope: 'team',
        teamId: 'team-9',
        userRole: 'team_leader',
      })
    ).toEqual(['team-9'])

    expect(
      canManageUser(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: true,
          organizationId: 'org-1',
          scope: 'team',
          teamId: 'team-1',
          userRole: 'member',
        },
        { organizationId: 'org-1', teamId: 'team-1' }
      )
    ).toBe(false)

    expect(
      canManageUser(
        {
          accessibleTeamIds: null,
          hierarchyEnabled: false,
          organizationId: 'org-1',
          scope: 'organization',
          userRole: 'admin',
        },
        { organizationId: 'org-1' }
      )
    ).toBe(true)
  })

  it('compares role precedence correctly', () => {
    expect(isRoleEqualOrHigher('admin', 'zone_manager')).toBe(true)
    expect(isRoleEqualOrHigher('member', 'team_leader')).toBe(false)
  })
})
