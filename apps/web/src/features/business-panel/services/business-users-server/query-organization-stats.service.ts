import { fromLoose } from '../../../../lib/supabase/looseQuery'
import type { BusinessUserStats } from '../businessUsers.service'
import { createBusinessUsersAdminClient } from './client'
import { buildOrganizationStats } from './helpers'
import type {
  BulkInviteUsageRow,
  OrganizationUserSummaryRow,
  PendingInvitationRow,
} from './types'

export async function getOrganizationStats(
  organizationId: string,
): Promise<BusinessUserStats> {
  const supabase = createBusinessUsersAdminClient()
  const [orgUsersResult, pendingInvitationsResult, bulkLinksResult] = await Promise.all([
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

  if (orgUsersResult.error) {
    throw orgUsersResult.error
  }

  if (pendingInvitationsResult.error) {
    throw pendingInvitationsResult.error
  }

  return buildOrganizationStats(
    orgUsersResult.data ?? [],
    pendingInvitationsResult.data ?? [],
    bulkLinksResult.data ?? [],
  )
}
