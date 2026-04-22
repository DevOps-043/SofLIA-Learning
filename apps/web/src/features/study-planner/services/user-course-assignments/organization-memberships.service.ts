import { createClient } from '../../../../lib/supabase/server'
import { organizationUsersTable } from './tables'
import type { OrganizationUserHierarchyRow } from './types'

export interface ActiveOrganizationMembership {
  organizationId: string
  organizationName?: string
  teamId: string | null
  zoneId: string | null
  regionId: string | null
}

interface OrganizationMembershipRow extends OrganizationUserHierarchyRow {
  organization?: {
    name?: string | null
  } | null
}

export async function loadActiveOrganizationMemberships(
  userId: string,
): Promise<ActiveOrganizationMembership[]> {
  const supabase = await createClient()
  const { data, error } = await organizationUsersTable(supabase)
    .select(`
      organization_id,
      team_id,
      zone_id,
      region_id,
      organization:organization_id (
        name
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')

  if (error) {
    console.error('Error obteniendo membresias activas de organizaciones:', error)
    return []
  }

  const uniqueMemberships = new Map<string, ActiveOrganizationMembership>()

  for (const row of (data ?? []) as OrganizationMembershipRow[]) {
    if (!row.organization_id) {
      continue
    }

    const key = `${row.organization_id}::${row.team_id ?? ''}::${row.zone_id ?? ''}::${row.region_id ?? ''}`
    if (uniqueMemberships.has(key)) {
      continue
    }

    uniqueMemberships.set(key, {
      organizationId: row.organization_id,
      organizationName: row.organization?.name ?? undefined,
      teamId: row.team_id,
      zoneId: row.zone_id,
      regionId: row.region_id,
    })
  }

  return [...uniqueMemberships.values()]
}
