import { fetchPagedRows } from './fetch-paged-rows'
import type { OrganizationUserRecord } from './organization-user-record'
import type { ReportsAnalyticsSupabaseClient } from './reports-analytics-supabase-client'

export function fetchOrganizationUsers(
  supabase: ReportsAnalyticsSupabaseClient,
  organizationId: string,
): Promise<OrganizationUserRecord[]> {
  return fetchPagedRows<OrganizationUserRecord>('organization users', (from, to) =>
    supabase
      .from('organization_users')
      .select(`
        user_id,
        role,
        job_title,
        status,
        joined_at,
        created_at,
        region_id,
        zone_id,
        team_id,
        hierarchy_scope,
        users!organization_users_user_id_fkey (
          id,
          username,
          email,
          first_name,
          last_name,
          display_name,
          date_of_birth,
          gender,
          last_login_at,
          updated_at
        )
      `)
      .eq('organization_id', organizationId)
      .range(from, to),
  )
}
