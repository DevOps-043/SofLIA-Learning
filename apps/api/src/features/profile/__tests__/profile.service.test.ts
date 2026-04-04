import { beforeEach, describe, expect, it, vi } from 'vitest'

import { NotFoundError } from '@/core/errors/app-error'

import { ProfileService } from '../profile.service'
import type { ProfileRepository } from '../profile.repository'
import type { UserProfile } from '../profile.types'

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user-1',
    username: 'testuser',
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    display_name: 'Test User',
    bio: null,
    location: null,
    phone: null,
    profile_picture_url: null,
    last_login_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeRepository(overrides: Partial<ProfileRepository> = {}): ProfileRepository {
  return {
    findById: vi.fn().mockResolvedValue(makeProfile()),
    update: vi.fn().mockResolvedValue(makeProfile()),
    updateProfilePicture: vi.fn().mockResolvedValue(makeProfile()),
    ...overrides,
  } as unknown as ProfileRepository
}

describe('ProfileService', () => {
  let service: ProfileService
  let repo: ProfileRepository

  beforeEach(() => {
    repo = makeRepository()
    service = new ProfileService(repo)
  })

  describe('getProfile', () => {
    it('returns profile for valid user', async () => {
      const profile = await service.getProfile('user-1')
      expect(profile.id).toBe('user-1')
      expect(repo.findById).toHaveBeenCalledWith('user-1')
    })

    it('throws NotFoundError when user does not exist', async () => {
      repo = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
      service = new ProfileService(repo)
      await expect(service.getProfile('missing')).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateProfile', () => {
    it('updates and returns profile', async () => {
      const updated = makeProfile({ first_name: 'Updated' })
      repo = makeRepository({ update: vi.fn().mockResolvedValue(updated) })
      service = new ProfileService(repo)

      const result = await service.updateProfile('user-1', { first_name: 'Updated' })
      expect(result.first_name).toBe('Updated')
    })

    it('throws NotFoundError when update returns null', async () => {
      repo = makeRepository({ update: vi.fn().mockResolvedValue(null) })
      service = new ProfileService(repo)
      await expect(service.updateProfile('user-1', {})).rejects.toThrow(NotFoundError)
    })
  })

  describe('updateProfilePicture', () => {
    it('updates profile picture url', async () => {
      const updated = makeProfile({ profile_picture_url: 'https://example.com/pic.jpg' })
      repo = makeRepository({ updateProfilePicture: vi.fn().mockResolvedValue(updated) })
      service = new ProfileService(repo)

      const result = await service.updateProfilePicture('user-1', 'https://example.com/pic.jpg')
      expect(result.profile_picture_url).toBe('https://example.com/pic.jpg')
    })
  })
})
