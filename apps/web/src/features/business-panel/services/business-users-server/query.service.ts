import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type {
  BusinessUser,
  BusinessUserStats,
  BusinessUsersPaginationMeta,
} from '../businessUsers.service'
import { createBusinessUsersAdminClient } from './client'
import {
  BUSINESS_USER_SELECT,
  buildOrganizationStats,
  mapOrganizationUserRecord,
} from './helpers'
import type {
  BulkInviteUsageRow,
  OrganizationUserSummaryRow,
  OrganizationUserWithProfileRow,
  PendingInvitationRow,
} from './types'

type MembershipRow = { user_id: string }

export interface OrganizationUsersPageFilters {
  page: number
  pageSize: number
  search?: string
  role?: string
  status?: string
}

export interface OrganizationUsersPage {
  users: BusinessUser[]
  pagination: BusinessUsersPaginationMeta
}

export async function getOrganizationUsers(
  organizationId: string,
): Promise<BusinessUser[]> {
  const supabase = createBusinessUsersAdminClient()
  const { data, error } = await fromLoose<OrganizationUserWithProfileRow>(
    supabase,
    'organization_users',
  )
    .select(BUSINESS_USER_SELECT)
    .eq('organization_id', organizationId)
    .order('joined_at', { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? [])
    .map(mapOrganizationUserRecord)
    .filter((user): user is BusinessUser => user !== null)
}

export async function getOrganizationUsersPage(
  organizationId: string,
  filters: OrganizationUsersPageFilters,
): Promise<OrganizationUsersPage> {
  const supabase = createBusinessUsersAdminClient()
  const page = Math.max(1, filters.page)
  const pageSize = Math.min(Math.max(filters.pageSize, 1), 100)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const normalizedSearch = filters.search?.trim()

  let matchingUserIds: string[] | null = null
  if (normalizedSearch) {
    const escapedSearch = normalizedSearch.replace(/[%_]/g, '\\$&')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .or(
        [
          `email.ilike.%${escapedSearch}%`,
          `username.ilike.%${escapedSearch}%`,
          `first_name.ilike.%${escapedSearch}%`,
          `last_name.ilike.%${escapedSearch}%`,
          `display_name.ilike.%${escapedSearch}%`,
        ].join(','),
      )
      .limit(500)

    if (usersError) {
      throw usersError
    }

    matchingUserIds = (users ?? []).map((user) => user.id)
    if (matchingUserIds.length === 0) {
      return {
        users: [],
        pagination: {
          page,
          pageSize,
          total: 0,
          totalPages: 0,
          hasNextPage: false,
        },
      }
    }
  }

  let query = fromLoose<OrganizationUserWithProfileRow>(
    supabase,
    'organization_users',
  )
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
    .range(from, to)

  if (error) {
    throw error
  }

  const total = count ?? 0
  const totalPages = total > 0 ? Math.ceil(total / pageSize) : 0

  return {
    users: (data ?? [])
      .map(mapOrganizationUserRecord)
      .filter((user): user is BusinessUser => user !== null),
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
    },
  }
}

export async function getOrganizationStats(
  organizationId: string,
): Promise<BusinessUserStats> {
  const supabase = createBusinessUsersAdminClient()

  const [
    { data: orgUsers, error: orgUsersError },
    { data: pendingInvitations, error: pendingInvitationsError },
    { data: bulkLinks },
  ] = await Promise.all([
    fromLoose<OrganizationUserSummaryRow>(supabase, 'organization_users')
      .select('role, status')
      .eq('organization_id', organizationId),
    fromLoose<PendingInvitationRow>(supabase, 'user_invitations')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('status', 'pending'),
    fromLoose<BulkInviteUsageRow>(supabase, 'bulk_invite_links')
      .select('current_uses')
      .eq('organization_id', organizationId),
  ])

  if (orgUsersError) {
    throw orgUsersError
  }

  if (pendingInvitationsError) {
    throw pendingInvitationsError
  }

  return buildOrganizationStats(
    orgUsers ?? [],
    pendingInvitations ?? [],
    bulkLinks ?? [],
  )
}

export async function assertOrganizationUserMembership(
  organizationId: string,
  userId: string,
) {
  const supabase = createBusinessUsersAdminClient()
  const { data, error } = await fromLoose<MembershipRow>(
    supabase,
    'organization_users',
  )
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !data) {
    throw new Error('Usuario no pertenece a tu organizacion')
  }
}

export async function getOrganizationUserById(
  organizationId: string,
  userId: string,
): Promise<BusinessUser> {
  const supabase = createBusinessUsersAdminClient()
  const { data, error } = await fromLoose<OrganizationUserWithProfileRow>(
    supabase,
    'organization_users',
  )
    .select(BUSINESS_USER_SELECT)
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .single()

  if (error || !data) {
    throw new Error('Usuario no encontrado despues de actualizar')
  }

  const businessUser = mapOrganizationUserRecord(data)

  if (!businessUser) {
    throw new Error('Usuario no encontrado despues de actualizar')
  }

  return businessUser
}
