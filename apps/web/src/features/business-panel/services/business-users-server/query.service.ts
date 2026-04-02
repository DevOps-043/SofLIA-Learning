import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type { BusinessUser, BusinessUserStats } from '../businessUsers.service'
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
