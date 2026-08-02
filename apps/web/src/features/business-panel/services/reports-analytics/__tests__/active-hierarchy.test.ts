import { describe, expect, it } from 'vitest'

import { buildReportsAnalyticsDataset } from '../reports-analytics.server.service'
import { mapActiveHierarchyToAnalytics } from '../reports-analytics-server/map-active-hierarchy-to-analytics'
import { selectActiveOrganizationStructure } from '../reports-analytics-server/select-active-organization-structure'
import { buildReportsAnalyticsQueryData } from './fixtures/query-data.fixture'
import { reportsAnalyticsFilters } from './fixtures/filters.fixture'

describe('reports analytics active organization hierarchy', () => {
  it('uses current node memberships and removes deleted legacy dimensions', () => {
    const queryData = buildReportsAnalyticsQueryData()
    queryData.organizationUsers[1] = {
      ...queryData.organizationUsers[1],
      region_id: 'deleted-region',
      zone_id: 'deleted-zone',
      team_id: 'deleted-team',
    }

    const hierarchyData = mapActiveHierarchyToAnalytics(queryData.organizationUsers, {
      structure: { id: 'structure-current', name: 'General', is_default: true },
      nodes: [
        {
          id: 'root-current',
          parent_id: null,
          name: 'SofLIA',
          type: 'root',
          code: null,
          depth: 0,
        },
        {
          id: 'team-technology',
          parent_id: 'root-current',
          name: 'Division de Tecnologia',
          type: 'team',
          code: null,
          depth: 1,
        },
      ],
      memberships: [
        {
          node_id: 'root-current',
          user_id: 'user-1',
          is_primary: false,
          created_at: '2026-08-01T10:00:00.000Z',
        },
        {
          node_id: 'team-technology',
          user_id: 'user-1',
          is_primary: false,
          created_at: '2026-08-01T11:00:00.000Z',
        },
        {
          node_id: 'root-current',
          user_id: 'user-2',
          is_primary: false,
          created_at: '2026-08-01T10:00:00.000Z',
        },
      ],
    })

    Object.assign(queryData, hierarchyData)
    const dataset = buildReportsAnalyticsDataset(queryData, reportsAnalyticsFilters)
    const assignedUser = dataset.userDetails.find((user) => user.userId === 'user-1')
    const rootOnlyUser = dataset.userDetails.find((user) => user.userId === 'user-2')

    expect(assignedUser).toEqual(expect.objectContaining({
      teamId: 'team-technology',
      teamName: 'Division de Tecnologia',
    }))
    expect(rootOnlyUser).toEqual(expect.objectContaining({
      regionId: 'unspecified',
      zoneId: 'unspecified',
      teamId: 'unspecified',
      teamName: 'unspecified',
    }))
    expect(dataset.rankings.teams.map((team) => team.name)).toEqual(['Division de Tecnologia'])
    expect(dataset.rankings.regions).toEqual([])
    expect(dataset.rankings.zones).toEqual([])
    expect(JSON.stringify(dataset)).not.toContain('deleted-team')
    expect(JSON.stringify(dataset)).not.toContain('Ventas Norte')
  })

  it('derives region and zone from the ancestors of a current team membership', () => {
    const queryData = buildReportsAnalyticsQueryData()
    const hierarchyData = mapActiveHierarchyToAnalytics(queryData.organizationUsers, {
      structure: { id: 'structure-current', name: 'General', is_default: true },
      nodes: [
        { id: 'root', parent_id: null, name: 'Org', type: 'root', code: null, depth: 0 },
        { id: 'region', parent_id: 'root', name: 'Norte actual', type: 'region', code: 'NA', depth: 1 },
        { id: 'zone', parent_id: 'region', name: 'Zona actual', type: 'zone', code: 'ZA', depth: 2 },
        { id: 'team', parent_id: 'zone', name: 'Equipo actual', type: 'team', code: 'EA', depth: 3 },
        { id: 'custom', parent_id: 'team', name: 'Célula', type: 'custom', code: null, depth: 4 },
      ],
      memberships: [
        {
          node_id: 'custom',
          user_id: 'user-1',
          is_primary: true,
          created_at: '2026-08-01T11:00:00.000Z',
        },
      ],
    })

    expect(hierarchyData.organizationUsers[0]).toEqual(expect.objectContaining({
      region_id: 'region',
      zone_id: 'zone',
      team_id: 'team',
      hierarchy_scope: 'team',
    }))
    expect(hierarchyData.zones[0].region_id).toBe('region')
    expect(hierarchyData.teams[0].zone_id).toBe('zone')
  })

  it('selects the persisted default and falls back exactly like the hierarchy editor', () => {
    expect(selectActiveOrganizationStructure([
      { id: 'b', name: 'Ventas', is_default: false },
      { id: 'a', name: 'General', is_default: false },
    ])?.id).toBe('a')

    expect(selectActiveOrganizationStructure([
      { id: 'a', name: 'General', is_default: false },
      { id: 'b', name: 'Ventas', is_default: true },
    ])?.id).toBe('b')
  })
})
