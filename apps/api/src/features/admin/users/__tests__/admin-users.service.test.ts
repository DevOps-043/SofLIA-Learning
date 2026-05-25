import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AdminUsersService } from '../admin-users.service'
import type { AdminUsersRepository } from '../admin-users.repository'
import {
  createAdminUserDetail,
  createAdminUserListItem,
  createRepositoryMock,
} from './admin-users.fixtures'

describe('AdminUsersService', () => {
  let repository: AdminUsersRepository
  let service: AdminUsersService

  beforeEach(() => {
    repository = createRepositoryMock()
    service = new AdminUsersService(repository)
  })

  it('normalizes the query and returns paginated metadata', async () => {
    vi.mocked(repository.findUsers).mockResolvedValue({
      users: [createAdminUserListItem()],
      total: 5,
    })

    const result = await service.getUsers({
      page: 2,
      limit: 2,
      search: ' Ada (admin) ',
      status: 'active',
    })

    expect(repository.findUsers).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 2,
        from: 2,
        to: 3,
        search: 'Ada admin',
        status: 'active',
      }),
    )
    expect(result.total_pages).toBe(3)
  })

  it('throws when the requested user does not exist', async () => {
    vi.mocked(repository.findById).mockResolvedValue(null)

    await expect(service.getUserById('missing-user')).rejects.toThrow(
      'Usuario no encontrado',
    )
  })

  it('prevents administrators from changing their own role', async () => {
    await expect(
      service.updateUserRole(
        'admin-1',
        {
          role: 'Instructor',
        },
        'admin-1',
      ),
    ).rejects.toThrow('No puedes cambiar tu propio rol desde este endpoint')
  })

  it('returns the existing soft-delete result when the user is already banned', async () => {
    vi.mocked(repository.findById).mockResolvedValue(
      createAdminUserDetail({
        id: 'user-2',
        is_banned: true,
        banned_at: '2026-04-02T10:00:00.000Z',
        ban_reason: 'security_lock',
      }),
    )

    const result = await service.softDeleteUser('user-2', 'admin-1')

    expect(repository.softDeleteUser).not.toHaveBeenCalled()
    expect(result).toEqual({
      user_id: 'user-2',
      banned_at: '2026-04-02T10:00:00.000Z',
      reason: 'security_lock',
    })
  })

  it('soft deletes active users with the default admin reason', async () => {
    vi.mocked(repository.findById).mockResolvedValue(
      createAdminUserDetail({
        id: 'user-2',
      }),
    )
    vi.mocked(repository.softDeleteUser).mockResolvedValue({
      user_id: 'user-2',
      banned_at: '2026-04-02T12:00:00.000Z',
      reason: 'deleted_by_admin',
    })

    const result = await service.softDeleteUser('user-2', 'admin-1')

    expect(repository.softDeleteUser).toHaveBeenCalledWith(
      'user-2',
      'deleted_by_admin',
    )
    expect(result.reason).toBe('deleted_by_admin')
  })
})
