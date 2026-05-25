import { logger as techDebtLogger } from '@/lib/utils/logger'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { createClient } from '@/lib/supabase/server'
import { determineDefaultScope } from './scope'
import type { HierarchyContext, HierarchyRole, HierarchyScope } from './types'

type HierarchySupabaseClient = Awaited<ReturnType<typeof createClient>>

interface OrganizationUserRow {
  id: string
  role: HierarchyRole | string
  team_id: string | null
  zone_id: string | null
  region_id: string | null
  hierarchy_scope: HierarchyScope | string | null
  status: string
}

interface OrganizationRow {
  id: string
  name: string
  hierarchy_enabled: boolean | null
  hierarchy_config?: unknown
}

interface OrganizationTeamRow {
  id: string
  name: string
  zone_id: string | null
  is_active?: boolean | null
}

interface OrganizationZoneRow {
  id: string
  name: string
  region_id: string | null
  is_active?: boolean | null
}

interface OrganizationRegionRow {
  id: string
  name: string
}

export async function getHierarchyContext(
  userId: string,
  organizationId: string,
): Promise<HierarchyContext | null> {
  const supabase = await createClient()

  try {
    const { data: orgUser, error: orgUserError } = await fromLoose<OrganizationUserRow>(
      supabase,
      'organization_users',
    )
      .select(`
        id,
        role,
        team_id,
        zone_id,
        region_id,
        hierarchy_scope,
        status
      `)
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .eq('status', 'active')
      .single()

    if (orgUserError || !orgUser) {
      techDebtLogger.warn('Usuario no encontrado en organización:', {
        userId,
        organizationId,
        error: orgUserError?.message,
      })
      return null
    }

    const { data: org, error: orgError } = await fromLoose<OrganizationRow>(
      supabase,
      'organizations',
    )
      .select('id, name, hierarchy_enabled, hierarchy_config')
      .eq('id', organizationId)
      .single()

    if (orgError || !org) {
      techDebtLogger.warn('Organización no encontrada:', organizationId)
      return null
    }

    const hierarchyEnabled = org.hierarchy_enabled ?? false
    const userRole = orgUser.role as HierarchyRole

    if (!hierarchyEnabled) {
      return {
        organizationId,
        organizationName: org.name,
        hierarchyEnabled: false,
        userRole,
        scope: 'organization',
        regionId: null,
        zoneId: null,
        teamId: null,
        accessibleTeamIds: [],
        hasUnlimitedAccess: true,
      }
    }

    let regionName: string | undefined
    let zoneName: string | undefined
    let teamName: string | undefined
    let effectiveZoneId: string | null = orgUser.zone_id
    let effectiveRegionId: string | null = orgUser.region_id

    if (orgUser.team_id) {
      const { data: team } = await fromLoose<OrganizationTeamRow>(
        supabase,
        'organization_teams',
      )
        .select('name, zone_id')
        .eq('id', orgUser.team_id)
        .single()

      if (team) {
        teamName = team.name
        effectiveZoneId = effectiveZoneId || team.zone_id
      }
    }

    if (effectiveZoneId) {
      const { data: zone } = await fromLoose<OrganizationZoneRow>(
        supabase,
        'organization_zones',
      )
        .select('name, region_id')
        .eq('id', effectiveZoneId)
        .single()

      if (zone) {
        zoneName = zone.name
        effectiveRegionId = effectiveRegionId || zone.region_id
      }
    }

    if (effectiveRegionId) {
      const { data: region } = await fromLoose<OrganizationRegionRow>(
        supabase,
        'organization_regions',
      )
        .select('name')
        .eq('id', effectiveRegionId)
        .single()

      if (region) {
        regionName = region.name
      }
    }

    const scope = (orgUser.hierarchy_scope as HierarchyScope) || determineDefaultScope(userRole)
    const { accessibleTeamIds, hasUnlimitedAccess } = await calculateAccessibleTeams(
      supabase,
      userRole,
      scope,
      effectiveRegionId,
      effectiveZoneId,
      orgUser.team_id,
    )

    return {
      organizationId,
      organizationName: org.name,
      hierarchyEnabled: true,
      userRole,
      scope,
      regionId: effectiveRegionId,
      zoneId: effectiveZoneId,
      teamId: orgUser.team_id,
      regionName,
      zoneName,
      teamName,
      accessibleTeamIds,
      hasUnlimitedAccess,
    }
  } catch (error) {
    techDebtLogger.error('Error obteniendo contexto jerárquico:', error)
    return null
  }
}

async function calculateAccessibleTeams(
  supabase: HierarchySupabaseClient,
  role: HierarchyRole,
  scope: HierarchyScope,
  regionId: string | null,
  zoneId: string | null,
  teamId: string | null,
): Promise<{ accessibleTeamIds: string[]; hasUnlimitedAccess: boolean }> {
  if (role === 'owner' || scope === 'organization') {
    return { accessibleTeamIds: [], hasUnlimitedAccess: true }
  }

  if (role === 'admin' && !regionId && !zoneId && !teamId) {
    return { accessibleTeamIds: [], hasUnlimitedAccess: true }
  }

  if (scope === 'region' && regionId) {
    const { data: zones } = await fromLoose<Pick<OrganizationZoneRow, 'id'>>(
      supabase,
      'organization_zones',
    )
      .select('id')
      .eq('region_id', regionId)
      .eq('is_active', true)

    if (zones && zones.length > 0) {
      const zoneIds = zones.map((zone) => zone.id)
      const { data: teams } = await fromLoose<Pick<OrganizationTeamRow, 'id'>>(
        supabase,
        'organization_teams',
      )
        .select('id')
        .in('zone_id', zoneIds)
        .eq('is_active', true)

      return {
        accessibleTeamIds: teams?.map((team) => team.id) || [],
        hasUnlimitedAccess: false,
      }
    }

    return { accessibleTeamIds: [], hasUnlimitedAccess: false }
  }

  if (scope === 'zone' && zoneId) {
    const { data: teams } = await fromLoose<Pick<OrganizationTeamRow, 'id'>>(
      supabase,
      'organization_teams',
    )
      .select('id')
      .eq('zone_id', zoneId)
      .eq('is_active', true)

    return {
      accessibleTeamIds: teams?.map((team) => team.id) || [],
      hasUnlimitedAccess: false,
    }
  }

  if (teamId) {
    return {
      accessibleTeamIds: [teamId],
      hasUnlimitedAccess: false,
    }
  }

  return { accessibleTeamIds: [], hasUnlimitedAccess: false }
}
