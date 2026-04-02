import { ForbiddenError, NotFoundError } from '@/core/errors/app-error'

import {
  calculateTotalPages,
  normalizeAdminUserListQuery,
} from './admin-users.utils'
import {
  SupabaseAdminUsersRepository,
  type AdminUsersRepository,
} from './admin-users.repository'
import type {
  AdminUserDetail,
  AdminUserListQuery,
  AdminUserListResult,
  AdminUserRoleUpdateInput,
  AdminUserSoftDeleteResult,
  AdminUserStats,
  AdminUserUpdateInput,
} from './admin-users.types'

const DEFAULT_SOFT_DELETE_REASON = 'deleted_by_admin'

export class AdminUsersService {
  constructor(
    private readonly repository: AdminUsersRepository = new SupabaseAdminUsersRepository(),
  ) {}

  async getUsers(query: AdminUserListQuery): Promise<AdminUserListResult> {
    const normalizedQuery = normalizeAdminUserListQuery(query)
    const { users, total } = await this.repository.findUsers(normalizedQuery)

    return {
      users,
      total,
      page: normalizedQuery.page,
      limit: normalizedQuery.limit,
      total_pages: calculateTotalPages(total, normalizedQuery.limit),
    }
  }

  async getStats(): Promise<AdminUserStats> {
    return this.repository.getStats()
  }

  async getUserById(userId: string): Promise<AdminUserDetail> {
    return this.requireUser(userId)
  }

  async updateUser(userId: string, input: AdminUserUpdateInput) {
    await this.requireUser(userId)
    return this.repository.updateUser(userId, input)
  }

  async updateUserRole(
    userId: string,
    input: AdminUserRoleUpdateInput,
    actorUserId: string,
  ) {
    this.assertDifferentActor(userId, actorUserId, 'cambiar tu propio rol')
    await this.requireUser(userId)
    return this.repository.updateUserRole(userId, input)
  }

  async softDeleteUser(
    userId: string,
    actorUserId: string,
  ): Promise<AdminUserSoftDeleteResult> {
    this.assertDifferentActor(
      userId,
      actorUserId,
      'desactivar tu propia cuenta',
    )

    const user = await this.requireUser(userId)

    if (user.is_banned && user.banned_at) {
      return {
        user_id: user.id,
        banned_at: user.banned_at,
        reason: user.ban_reason ?? DEFAULT_SOFT_DELETE_REASON,
      }
    }

    return this.repository.softDeleteUser(userId, DEFAULT_SOFT_DELETE_REASON)
  }

  private async requireUser(userId: string) {
    const user = await this.repository.findById(userId)

    if (!user) {
      throw new NotFoundError('Usuario no encontrado', 'USER_NOT_FOUND')
    }

    return user
  }

  private assertDifferentActor(
    targetUserId: string,
    actorUserId: string,
    action: string,
  ) {
    if (targetUserId === actorUserId) {
      throw new ForbiddenError(`No puedes ${action} desde este endpoint`)
    }
  }
}
