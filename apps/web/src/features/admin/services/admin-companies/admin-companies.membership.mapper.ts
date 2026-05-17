import type {
  AdminCompanyMember,
  AdminCompanyUserProfile,
} from '../../types/admin-companies.types'
import type { OrganizationUserRow } from './admin-companies.mapper.types'
import { mapOrganizationUserProfile } from './admin-companies.user.mapper'

export interface OrganizationMembershipSummary {
  activeUsers: number
  invitedUsers: number
  suspendedUsers: number
  totalUsers: number
  members: AdminCompanyMember[]
}

export function summarizeOrganizationMembership(
  organizationUsers: OrganizationUserRow[],
  usersMap?: Map<string, AdminCompanyUserProfile>,
): OrganizationMembershipSummary {
  return organizationUsers.reduce<OrganizationMembershipSummary>(
    (summary, membership) => {
      const resolvedUser = usersMap?.get(membership.user_id)
        ?? mapOrganizationUserProfile(membership.users)

      summary.totalUsers += 1

      if (membership.status === 'active') {
        summary.activeUsers += 1
      } else if (membership.status === 'invited') {
        summary.invitedUsers += 1
      } else if (membership.status === 'suspended') {
        summary.suspendedUsers += 1
      }

      summary.members.push({
        id: membership.id,
        user_id: membership.user_id,
        role: membership.role,
        status: membership.status,
        joined_at: membership.joined_at,
        user: resolvedUser,
      })

      return summary
    },
    {
      activeUsers: 0,
      invitedUsers: 0,
      suspendedUsers: 0,
      totalUsers: 0,
      members: [],
    },
  )
}
