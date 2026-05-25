export interface AdminUserListResult {
  users: import('./admin-users.entity.types').AdminUserListItem[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface AdminUsersRoleDistribution {
  role: string
  count: number
}

export interface AdminUsersOrganizationDistribution {
  organization_id: string
  organization_name: string
  organization_slug: string | null
  count: number
}

export interface AdminUserStats {
  total_users: number
  active_users: number
  banned_users: number
  verified_users: number
  role_distribution: AdminUsersRoleDistribution[]
  organization_distribution: AdminUsersOrganizationDistribution[]
}

export interface AdminUserSoftDeleteResult {
  user_id: string
  banned_at: string
  reason: string
}
