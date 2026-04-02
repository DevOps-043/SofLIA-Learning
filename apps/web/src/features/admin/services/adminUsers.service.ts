import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserStats,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserRole,
} from './admin-users'
import type {
  AdminUser,
  AdminUserCreateInput,
  AdminUserRequestInfo,
  GetUsersOptions,
  GetUsersResult,
  UserStats,
} from './admin-users'

export type {
  AdminUser,
  AdminUserCreateInput,
  AdminUserRequestInfo,
  GetUsersOptions,
  GetUsersResult,
  UserStats,
}

export class AdminUsersService {
  static async getUsers(options: GetUsersOptions = {}): Promise<GetUsersResult> {
    return getAdminUsers(options)
  }

  static async getUserStats(): Promise<UserStats> {
    return getAdminUserStats()
  }

  static async updateUser(
    userId: string,
    userData: Partial<AdminUser>,
    adminUserId: string,
    requestInfo?: AdminUserRequestInfo,
  ): Promise<AdminUser> {
    return updateAdminUser(userId, userData, adminUserId, requestInfo)
  }

  static async updateUserRole(userId: string, newRole: string): Promise<void> {
    return updateAdminUserRole(userId, newRole)
  }

  static async createUser(
    userData: AdminUserCreateInput,
    adminUserId: string,
    requestInfo?: AdminUserRequestInfo,
  ): Promise<AdminUser> {
    return createAdminUser(userData, adminUserId, requestInfo)
  }

  static async deleteUser(
    userId: string,
    adminUserId: string,
    requestInfo?: AdminUserRequestInfo,
  ): Promise<void> {
    return deleteAdminUser(userId, adminUserId, requestInfo)
  }
}
