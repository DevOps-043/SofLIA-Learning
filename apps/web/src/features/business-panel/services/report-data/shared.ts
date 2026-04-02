import { createClient } from '../../../../lib/supabase/server'
import { logger } from '../../../../lib/utils/logger'
import type { ReportFilters } from '../../types/report-data.types'

export type ReportSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface ReportRuntime {
  activeOrganizationUsers?: any[]
}

export function getUserDisplayName(user: any) {
  return (
    user?.display_name ||
    `${user?.first_name || ''} ${user?.last_name || ''}`.trim() ||
    user?.username ||
    user?.email ||
    'Usuario desconocido'
  )
}

export function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10
}

export function getFilteredUserIds(organizationUserIds: string[], filters: ReportFilters) {
  if (!filters.user_ids?.length) {
    return organizationUserIds
  }

  const selectedUserIds = new Set(filters.user_ids)
  return organizationUserIds.filter((userId) => selectedUserIds.has(userId))
}

export async function getActiveOrganizationUsers(
  supabase: ReportSupabaseClient,
  organizationId: string,
  runtime: ReportRuntime,
) {
  if (runtime.activeOrganizationUsers) {
    return runtime.activeOrganizationUsers
  }

  const { data: organizationUsers, error } = await supabase
    .from('organization_users')
    .select(`
      user_id,
      users!organization_users_user_id_fkey (
        id,
        username,
        email,
        display_name,
        first_name,
        last_name
      )
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')

  if (error) {
    logger.error('Error fetching active organization users for report:', error)
    throw error
  }

  runtime.activeOrganizationUsers = organizationUsers || []
  return runtime.activeOrganizationUsers
}
