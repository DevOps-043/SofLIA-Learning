import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminUsersService } from '../adminUsers.service'

vi.mock('../admin-users', () => ({
  getAdminUsers: vi.fn(),
  getAdminUserStats: vi.fn(),
  updateAdminUser: vi.fn(),
  updateAdminUserRole: vi.fn(),
  createAdminUser: vi.fn(),
  deleteAdminUser: vi.fn(),
}))

import {
  createAdminUser,
  deleteAdminUser,
  getAdminUserStats,
  getAdminUsers,
  updateAdminUser,
  updateAdminUserRole,
} from '../admin-users'

// ─── helpers ────────────────────────────────────────────────────────────────

function makeUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    nombre: 'Test',
    apellido: 'User',
    rol: 'BusinessUser',
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeStats() {
  return {
    total: 100,
    active: 80,
    inactive: 20,
    byRole: { Admin: 2, Business: 8, BusinessUser: 90 },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── getUsers ─────────────────────────────────────────────────────────────────

describe('AdminUsersService.getUsers', () => {
  it('delegates to getAdminUsers with no options by default', async () => {
    const expected = { users: [makeUser()], total: 1 }
    vi.mocked(getAdminUsers).mockResolvedValue(expected)

    const result = await AdminUsersService.getUsers()

    expect(getAdminUsers).toHaveBeenCalledWith({})
    expect(result).toEqual(expected)
  })

  it('passes options through to getAdminUsers', async () => {
    vi.mocked(getAdminUsers).mockResolvedValue({ users: [], total: 0 })
    const options = { page: 2, limit: 25, search: 'test', role: 'Admin' }

    await AdminUsersService.getUsers(options)

    expect(getAdminUsers).toHaveBeenCalledWith(options)
  })

  it('propagates errors from getAdminUsers', async () => {
    vi.mocked(getAdminUsers).mockRejectedValue(new Error('DB error'))

    await expect(AdminUsersService.getUsers()).rejects.toThrow('DB error')
  })
})

// ─── getUserStats ─────────────────────────────────────────────────────────────

describe('AdminUsersService.getUserStats', () => {
  it('delegates to getAdminUserStats', async () => {
    const stats = makeStats()
    vi.mocked(getAdminUserStats).mockResolvedValue(stats)

    const result = await AdminUsersService.getUserStats()

    expect(getAdminUserStats).toHaveBeenCalledOnce()
    expect(result).toEqual(stats)
  })
})

// ─── updateUser ───────────────────────────────────────────────────────────────

describe('AdminUsersService.updateUser', () => {
  it('delegates to updateAdminUser with correct arguments', async () => {
    const updated = makeUser({ nombre: 'Updated' })
    vi.mocked(updateAdminUser).mockResolvedValue(updated)
    const userData = { nombre: 'Updated' }
    const requestInfo = { ip: '127.0.0.1', userAgent: 'test' }

    const result = await AdminUsersService.updateUser('user-1', userData, 'admin-1', requestInfo)

    expect(updateAdminUser).toHaveBeenCalledWith('user-1', userData, 'admin-1', requestInfo)
    expect(result).toEqual(updated)
  })

  it('works without optional requestInfo', async () => {
    vi.mocked(updateAdminUser).mockResolvedValue(makeUser())

    await AdminUsersService.updateUser('user-1', { nombre: 'New' }, 'admin-1')

    expect(updateAdminUser).toHaveBeenCalledWith('user-1', { nombre: 'New' }, 'admin-1', undefined)
  })
})

// ─── updateUserRole ───────────────────────────────────────────────────────────

describe('AdminUsersService.updateUserRole', () => {
  it('delegates to updateAdminUserRole', async () => {
    vi.mocked(updateAdminUserRole).mockResolvedValue(undefined)

    await AdminUsersService.updateUserRole('user-1', 'Admin')

    expect(updateAdminUserRole).toHaveBeenCalledWith('user-1', 'Admin')
  })
})

// ─── createUser ───────────────────────────────────────────────────────────────

describe('AdminUsersService.createUser', () => {
  it('delegates to createAdminUser and returns new user', async () => {
    const newUser = makeUser()
    vi.mocked(createAdminUser).mockResolvedValue(newUser)
    const input = { email: 'new@example.com', nombre: 'New', apellido: 'User', rol: 'BusinessUser' }

    const result = await AdminUsersService.createUser(input, 'admin-1')

    expect(createAdminUser).toHaveBeenCalledWith(input, 'admin-1', undefined)
    expect(result).toEqual(newUser)
  })
})

// ─── deleteUser ───────────────────────────────────────────────────────────────

describe('AdminUsersService.deleteUser', () => {
  it('delegates to deleteAdminUser', async () => {
    vi.mocked(deleteAdminUser).mockResolvedValue(undefined)

    await AdminUsersService.deleteUser('user-1', 'admin-1')

    expect(deleteAdminUser).toHaveBeenCalledWith('user-1', 'admin-1', undefined)
  })

  it('propagates deletion errors', async () => {
    vi.mocked(deleteAdminUser).mockRejectedValue(new Error('Cannot delete'))

    await expect(AdminUsersService.deleteUser('user-1', 'admin-1')).rejects.toThrow(
      'Cannot delete',
    )
  })
})
