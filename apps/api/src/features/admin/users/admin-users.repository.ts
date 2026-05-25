import { findById } from './admin-users.repository.detail'
import { findUsers } from './admin-users.repository.list'
import {
  softDeleteUser,
  updateUser,
  updateUserRole,
} from './admin-users.repository.mutations'
import { getStats } from './admin-users.repository.stats'
import type { AdminUsersRepository } from './admin-users.repository.contract'
import type {
  AdminUserRoleUpdateInput,
  AdminUserUpdateInput,
  NormalizedAdminUserListQuery,
} from './admin-users.types'

export type { AdminUsersRepository } from './admin-users.repository.contract'

export class SupabaseAdminUsersRepository implements AdminUsersRepository {
  findUsers(filters: NormalizedAdminUserListQuery) {
    return findUsers(filters)
  }

  getStats() {
    return getStats()
  }

  findById(userId: string) {
    return findById(userId)
  }

  updateUser(userId: string, input: AdminUserUpdateInput) {
    return updateUser(userId, input)
  }

  updateUserRole(userId: string, input: AdminUserRoleUpdateInput) {
    return updateUserRole(userId, input)
  }

  softDeleteUser(userId: string, reason: string) {
    return softDeleteUser(userId, reason)
  }
}
