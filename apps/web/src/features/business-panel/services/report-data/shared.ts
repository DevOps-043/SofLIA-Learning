import { createClient } from '../../../../lib/supabase/server'
import { logger } from '../../../../lib/utils/logger'
import type { ReportFilters } from '../../types/report-data.types'

export type ReportSupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface ReportRuntime {
  activeOrganizationUsers?: ActiveOrganizationUser[]
}

export interface ReportUserProfile {
  id: string
  username: string | null
  email: string | null
  display_name: string | null
  first_name: string | null
  last_name: string | null
  profile_picture_url?: string | null
  last_login_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface ActiveOrganizationUser {
  user_id: string
  role?: string | null
  status?: string | null
  joined_at?: string | null
  job_title?: string | null
  users: ReportUserProfile | null
}

export function getUserDisplayName(user: Partial<ReportUserProfile> | null | undefined) {
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

export function getFilteredUserIds(
  organizationUserIds: string[],
  filters: Pick<ReportFilters, 'user_ids'>,
) {
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

  runtime.activeOrganizationUsers = (organizationUsers || []) as ActiveOrganizationUser[]
  return runtime.activeOrganizationUsers
}
