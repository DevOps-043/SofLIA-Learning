import type {
  AdminUser,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserRoleUpdateInput,
  AdminUserSoftDeleteResult,
  AdminUserStats,
  AdminUserUpdateInput,
  NormalizedAdminUserListQuery,
} from './admin-users.types'

export interface AdminUsersRepository {
  findUsers(
    filters: NormalizedAdminUserListQuery,
  ): Promise<{ users: AdminUserListItem[]; total: number }>
  getStats(): Promise<AdminUserStats>
  findById(userId: string): Promise<AdminUserDetail | null>
  updateUser(userId: string, input: AdminUserUpdateInput): Promise<AdminUser>
  updateUserRole(
    userId: string,
    input: AdminUserRoleUpdateInput,
  ): Promise<AdminUser>
  softDeleteUser(
    userId: string,
    reason: string,
  ): Promise<AdminUserSoftDeleteResult>
}
