import { mapAdminUserMembershipRow, type AdminUserMembershipRow } from './admin-users.utils'
import type { AdminUserStats } from './admin-users.types'

type StatsRows = Awaited<
  ReturnType<
    typeof import('./admin-users.repository.stats-queries')['fetchAdminUserStatsRows']
  >
>

export function mapAdminUserStatsRows(rows: StatsRows): AdminUserStats {
  return {
    total_users: rows.totalUsers.count ?? 0,
    active_users: rows.activeUsers.count ?? 0,
    banned_users: rows.bannedUsers.count ?? 0,
    verified_users: rows.verifiedUsers.count ?? 0,
    role_distribution: buildRoleDistribution(rows.roles.data ?? []),
    organization_distribution: buildOrganizationDistribution(
      (rows.organizations.data ?? []) as AdminUserMembershipRow[],
    ),
  }
}

function buildRoleDistribution(rows: { cargo_rol: string | null }[]) {
  const roleCounts = new Map<string, number>()

  for (const row of rows) {
    const roleName = row.cargo_rol?.trim() || 'Sin rol'
    roleCounts.set(roleName, (roleCounts.get(roleName) ?? 0) + 1)
  }

  return Array.from(roleCounts.entries())
    .map(([role, count]) => ({ role, count }))
    .sort((left, right) => right.count - left.count)
}

function buildOrganizationDistribution(rows: AdminUserMembershipRow[]) {
  const organizationCounts = new Map<
    string,
    AdminUserStats['organization_distribution'][number]
  >()

  for (const row of rows) {
    const membership = mapAdminUserMembershipRow(row)
    const organizationName = membership.organization_name?.trim() || 'Sin organizacion'
    const current = organizationCounts.get(membership.organization_id)

    if (current) {
      current.count += 1
    } else {
      organizationCounts.set(membership.organization_id, {
        organization_id: membership.organization_id,
        organization_name: organizationName,
        organization_slug: membership.organization_slug,
        count: 1,
      })
    }
  }

  return Array.from(organizationCounts.values()).sort(
    (left, right) => right.count - left.count,
  )
}
