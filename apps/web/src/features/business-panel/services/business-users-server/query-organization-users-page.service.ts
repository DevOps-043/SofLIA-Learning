import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type { BusinessUser } from '../businessUsers.service'
import { createBusinessUsersAdminClient } from './client'
import {
  BUSINESS_USER_SELECT,
  mapOrganizationUserRecord,
} from './helpers'
import type { OrganizationUserWithProfileRow } from './types'
import {
  emptyOrganizationUsersPage,
  normalizePagination,
} from './query-pagination.utils'
import { findMatchingUserIds } from './query-search.service'
import type {
  OrganizationUsersPage,
  OrganizationUsersPageFilters,
} from './query.types'

export async function getOrganizationUsersPage(
  organizationId: string,
  filters: OrganizationUsersPageFilters,
): Promise<OrganizationUsersPage> {
  const supabase = createBusinessUsersAdminClient()
  const pagination = normalizePagination(filters)
  const matchingUserIds = await findMatchingUserIds(supabase, filters.search)

  if (matchingUserIds?.length === 0) {
    return emptyOrganizationUsersPage(pagination.page, pagination.pageSize)
  }

  let query = fromLoose<OrganizationUserWithProfileRow>(supabase, 'organization_users')
    .select(BUSINESS_USER_SELECT, { count: 'exact' })
    .eq('organization_id', organizationId)

  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role)
  }

  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (matchingUserIds) {
    query = query.in('user_id', matchingUserIds)
  }

  const { data, error, count } = await query
    .order('joined_at', { ascending: false })
    .range(pagination.from, pagination.to)

  if (error) {
    throw error
  }

  const total = count ?? 0
  const totalPages = total > 0 ? Math.ceil(total / pagination.pageSize) : 0

  return {
    users: (data ?? [])
      .map(mapOrganizationUserRecord)
      .filter((user): user is BusinessUser => user !== null),
    pagination: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total,
      totalPages,
      hasNextPage: pagination.page < totalPages,
    },
  }
}
