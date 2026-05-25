import { fetchPagedRows } from './fetch-paged-rows'
import type { OrganizationRegionRecord } from './organization-region-record'
import type { ReportsAnalyticsUntypedSupabaseClient } from './reports-analytics-untyped-supabase-client'

export function fetchOrganizationRegions(
  supabase: ReportsAnalyticsUntypedSupabaseClient,
  organizationId: string,
): Promise<OrganizationRegionRecord[]> {
  return fetchPagedRows<OrganizationRegionRecord>('organization regions', (from, to) =>
    supabase
      .from('organization_regions')
      .select('id, name, code, is_active')
      .eq('organization_id', organizationId)
      .range(from, to),
  )
}
