import { fetchPagedRows } from './fetch-paged-rows'
import type { OrganizationZoneRecord } from './organization-zone-record'
import type { ReportsAnalyticsUntypedSupabaseClient } from './reports-analytics-untyped-supabase-client'

export function fetchOrganizationZones(
  supabase: ReportsAnalyticsUntypedSupabaseClient,
  organizationId: string,
): Promise<OrganizationZoneRecord[]> {
  return fetchPagedRows<OrganizationZoneRecord>('organization zones', (from, to) =>
    supabase
      .from('organization_zones')
      .select('id, name, code, region_id, is_active')
      .eq('organization_id', organizationId)
      .range(from, to),
  )
}
