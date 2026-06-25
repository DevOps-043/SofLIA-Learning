import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type { BusinessUserStats } from '../businessUsers.service'
import { createBusinessUsersAdminClient } from './client'
import type { BulkInviteUsageRow } from './types'

type CountResult = { count?: number | null; error: { message: string } | null }

function extractCount(result: CountResult, label: string): number {
  if (result.error) throw new Error(`[getOrganizationStats] ${label}: ${result.error.message}`)
  return result.count ?? 0
}

export async function getOrganizationStats(
  organizationId: string,
): Promise<BusinessUserStats> {
  const supabase = createBusinessUsersAdminClient()

  const [
    totalOrgUsersResult,
    activeUsersResult,
    invitedOrgUsersResult,
    suspendedUsersResult,
    adminOrgUsersResult,
    memberOrgUsersResult,
    totalPendingResult,
    pendingAdminResult,
    pendingMemberResult,
    bulkLinksResult,
  ] = await Promise.all([
    fromLoose<never>(supabase, 'organization_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId),
    fromLoose<never>(supabase, 'organization_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'active'),
    fromLoose<never>(supabase, 'organization_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'invited'),
    fromLoose<never>(supabase, 'organization_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'suspended'),
    fromLoose<never>(supabase, 'organization_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .in('role', ['admin', 'owner']),
    fromLoose<never>(supabase, 'organization_users')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('role', 'member'),
    fromLoose<never>(supabase, 'user_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending'),
    fromLoose<never>(supabase, 'user_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .in('role', ['admin', 'owner']),
    fromLoose<never>(supabase, 'user_invitations')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .eq('role', 'member'),
    fromLoose<BulkInviteUsageRow>(supabase, 'bulk_invite_links')
      .select('current_uses')
      .eq('organization_id', organizationId),
  ])

  const totalOrgUsers = extractCount(totalOrgUsersResult, 'total org users')
  const activeUsers = extractCount(activeUsersResult, 'active users')
  const invitedOrgUsers = extractCount(invitedOrgUsersResult, 'invited org users')
  const suspendedUsers = extractCount(suspendedUsersResult, 'suspended users')
  const adminOrgUsers = extractCount(adminOrgUsersResult, 'admin org users')
  const memberOrgUsers = extractCount(memberOrgUsersResult, 'member org users')
  const totalPending = extractCount(totalPendingResult, 'pending invitations')
  const pendingAdmins = extractCount(pendingAdminResult, 'pending admin invitations')
  const pendingMembers = extractCount(pendingMemberResult, 'pending member invitations')

  const bulkLinkUsage = (bulkLinksResult.data ?? []).reduce(
    (sum, link) => sum + (link.current_uses ?? 0),
    0,
  )

  return {
    total: totalOrgUsers + totalPending,
    active: activeUsers,
    invited: invitedOrgUsers + totalPending,
    suspended: suspendedUsers,
    admins: adminOrgUsers + pendingAdmins,
    members: memberOrgUsers + pendingMembers,
    bulk_link_usage: bulkLinkUsage,
  }
}
