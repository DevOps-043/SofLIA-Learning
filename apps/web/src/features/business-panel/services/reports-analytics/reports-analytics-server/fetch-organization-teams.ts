import { fetchPagedRows } from './fetch-paged-rows'
import type { OrganizationTeamRecord } from './organization-team-record'
import type { ReportsAnalyticsUntypedSupabaseClient } from './reports-analytics-untyped-supabase-client'

export function fetchOrganizationTeams(
  supabase: ReportsAnalyticsUntypedSupabaseClient,
  organizationId: string,
): Promise<OrganizationTeamRecord[]> {
  return fetchPagedRows<OrganizationTeamRecord>('organization teams', (from, to) =>
    supabase
      .from('organization_teams')
      .select('id, name, code, zone_id, is_active')
      .eq('organization_id', organizationId)
      .range(from, to),
  )
}
