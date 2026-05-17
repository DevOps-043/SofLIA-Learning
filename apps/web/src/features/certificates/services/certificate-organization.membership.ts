export interface OrganizationMembershipRow {
  created_at: string | null
  joined_at: string | null
  organization_id: string
  status: string | null
  user_id: string
}

export function resolveMembershipSortValue(row: OrganizationMembershipRow): number {
  const timestamp = row.joined_at || row.created_at
  if (!timestamp) {
    return 0
  }

  const parsed = Date.parse(timestamp)
  return Number.isNaN(parsed) ? 0 : parsed
}

export function resolveMembershipStatusPriority(status: string | null): number {
  if (status === 'active') {
    return 2
  }

  if (!status) {
    return 1
  }

  return 0
}
