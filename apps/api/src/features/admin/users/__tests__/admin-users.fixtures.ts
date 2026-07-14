import type { Response } from 'express'
import { vi } from 'vitest'

import type { AdminUsersRepository } from '../admin-users.repository'
import type {
  AdminUser,
  AdminUserDetail,
  AdminUserListItem,
  AdminUserListResult,
  AdminUserSoftDeleteResult,
  AdminUserStats,
} from '../admin-users.types'

export function createResponse() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }

  return response as unknown as Response & {
    status: ReturnType<typeof vi.fn>
    json: ReturnType<typeof vi.fn>
  }
}

export function createControllerServiceMock() {
  return {
    getUsers: vi.fn().mockResolvedValue(emptyListResult()),
    getStats: vi.fn().mockResolvedValue(statsResult()),
    getUserById: vi.fn(),
    updateUser: vi.fn(),
    updateUserRole: vi.fn(),
    softDeleteUser: vi.fn().mockResolvedValue(softDeleteResult()),
  }
}

export function createAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  const now = new Date().toISOString()

  return {
    id: 'user-1',
    username: 'ada',
    email: 'ada@example.com',
    first_name: 'Ada',
    last_name: 'Lovelace',
    display_name: 'Ada Lovelace',
    platform_role: 'Administrador',
    type_rol: 'Admin',
    email_verified: true,
    email_verified_at: now,
    phone: null,
    bio: null,
    location: null,
    profile_picture_url: null,
    country_code: 'MX',
    created_at: now,
    updated_at: now,
    last_login_at: now,
    is_banned: false,
    banned_at: null,
    ban_reason: null,
    ...overrides,
  }
}

export function createAdminUserDetail(
  overrides: Partial<AdminUserDetail> = {},
): AdminUserDetail {
  return { ...createAdminUser(), memberships: [], ...overrides }
}

export function createAdminUserListItem(
  overrides: Partial<AdminUserListItem> = {},
): AdminUserListItem {
  return {
    ...createAdminUser(),
    organization_name: 'Acme',
    organization_slug: 'acme',
    organization_role: 'owner',
    membership_status: 'active',
    ...overrides,
  }
}

export function createRepositoryMock(): AdminUsersRepository {
  return {
    findUsers: vi.fn(),
    getStats: vi.fn(),
    findById: vi.fn(),
    updateUser: vi.fn(),
    updateUserRole: vi.fn(),
    softDeleteUser: vi.fn(),
  }
}

function emptyListResult(): AdminUserListResult {
  return { users: [], total: 0, page: 1, limit: 20, total_pages: 0 }
}

function statsResult(): AdminUserStats {
  return { total_users: 10, active_users: 7, banned_users: 1, verified_users: 8, role_distribution: [], organization_distribution: [] }
}

function softDeleteResult(): AdminUserSoftDeleteResult {
  return { user_id: 'user-2', banned_at: '2026-04-02T12:00:00.000Z', reason: 'deleted_by_admin' }
}
