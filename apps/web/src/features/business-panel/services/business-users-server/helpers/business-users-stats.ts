import type { BusinessUserStats } from '../../businessUsers.service'
import type {
  BulkInviteUsageRow,
  OrganizationUserSummaryRow,
  PendingInvitationRow,
} from '../types'

export function buildOrganizationStats(
  orgUsers: OrganizationUserSummaryRow[] = [],
  pendingInvitations: PendingInvitationRow[] = [],
  bulkLinks: BulkInviteUsageRow[] = [],
): BusinessUserStats {
  const activeUsers = orgUsers.filter((user) => user.status === 'active').length
  const invitedUsers =
    orgUsers.filter((user) => user.status === 'invited').length +
    pendingInvitations.length
  const suspendedUsers = orgUsers.filter((user) => user.status === 'suspended').length
  const admins =
    orgUsers.filter((user) => user.role === 'admin' || user.role === 'owner').length +
    pendingInvitations.filter((invitation) => invitation.role === 'admin' || invitation.role === 'owner').length
  const members =
    orgUsers.filter((user) => user.role === 'member').length +
    pendingInvitations.filter((invitation) => invitation.role === 'member').length
  const bulkLinkUsage = bulkLinks.reduce((sum, link) => sum + (link.current_uses ?? 0), 0)

  return {
    total: orgUsers.length + pendingInvitations.length,
    active: activeUsers,
    invited: invitedUsers,
    suspended: suspendedUsers,
    admins,
    members,
    bulk_link_usage: bulkLinkUsage,
  }
}
