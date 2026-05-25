import type {
  AdminUser,
  AdminUserListItem,
  AdminUserMembership,
} from './admin-users.types'

interface OrganizationRelation {
  name?: string | null
  slug?: string | null
}

export interface AdminUserMembershipRow {
  user_id: string
  organization_id: string
  role: string | null
  status: string | null
  organizations?: OrganizationRelation | OrganizationRelation[] | null
}

function resolveOrganizationRelation(
  organizations?: OrganizationRelation | OrganizationRelation[] | null,
) {
  if (Array.isArray(organizations)) {
    return organizations[0] ?? null
  }

  return organizations ?? null
}

export function mapAdminUserMembershipRow(
  row: AdminUserMembershipRow,
): AdminUserMembership {
  const organization = resolveOrganizationRelation(row.organizations)

  return {
    organization_id: row.organization_id,
    organization_name: organization?.name ?? null,
    organization_slug: organization?.slug ?? null,
    role: row.role,
    status: row.status,
  }
}

export function groupMembershipsByUser(rows: AdminUserMembershipRow[]) {
  const membershipsByUser = new Map<string, AdminUserMembership[]>()

  for (const row of rows) {
    const memberships = membershipsByUser.get(row.user_id) ?? []
    memberships.push(mapAdminUserMembershipRow(row))
    membershipsByUser.set(row.user_id, memberships)
  }

  return membershipsByUser
}

export function mapAdminUserListItems(
  users: AdminUser[],
  membershipsByUser: Map<string, AdminUserMembership[]>,
): AdminUserListItem[] {
  return users.map((user) => {
    const membership = getPrimaryMembership(membershipsByUser.get(user.id) ?? [])

    return {
      ...user,
      organization_name: membership?.organization_name ?? null,
      organization_slug: membership?.organization_slug ?? null,
      organization_role: membership?.role ?? null,
      membership_status: membership?.status ?? null,
    }
  })
}

function getPrimaryMembership(memberships: AdminUserMembership[]) {
  return (
    memberships.find(
      (membership) => membership.status?.trim().toLowerCase() === 'active',
    ) ??
    memberships[0] ??
    null
  )
}
