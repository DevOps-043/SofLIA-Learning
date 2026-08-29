import { NextRequest, NextResponse } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ProfileServerService } from '@/features/profile/services/profile-server.service'
import { requireUser } from '@/lib/auth/requireUser'
import { GET } from '../route'

vi.mock('server-only', () => ({}))
vi.mock('@/lib/auth/requireUser', () => ({ requireUser: vi.fn() }))
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('@/features/profile/services/profile-server.service', () => ({
  ProfileServerService: {
    getProfile: vi.fn(),
    getUserStats: vi.fn(),
    getUserSubscriptions: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

const requireUserMock = vi.mocked(requireUser)
const getProfileMock = vi.mocked(ProfileServerService.getProfile)
const getUserStatsMock = vi.mocked(ProfileServerService.getUserStats)
const getSubscriptionsMock = vi.mocked(ProfileServerService.getUserSubscriptions)

function request(path = '/api/profile?includeStats=1&org=org-1') {
  return new NextRequest(`http://localhost${path}`, {
    headers: { 'x-correlation-id': 'profile-request-id' },
  })
}

describe('GET /api/profile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    requireUserMock.mockResolvedValue({
      userEmail: 'user@example.test',
      userId: 'user-1',
      userRole: 'Business',
    })
    getProfileMock.mockResolvedValue({ id: 'user-1' } as never)
    getUserStatsMock.mockResolvedValue({
      certificates: 0,
      completedCourses: 0,
      completedLessons: 0,
      coursesInProgress: 0,
    })
    getSubscriptionsMock.mockResolvedValue([])
  })

  it('uses the authenticated user id for every profile query', async () => {
    const response = await GET(request())

    expect(response.status).toBe(200)
    expect(getProfileMock).toHaveBeenCalledWith('user-1', 'org-1')
    expect(getUserStatsMock).toHaveBeenCalledWith('user-1', 'org-1')
    expect(getSubscriptionsMock).toHaveBeenCalledWith('user-1')
  })

  it('propagates an authentication response without querying profile data', async () => {
    requireUserMock.mockResolvedValue(
      NextResponse.json({ error: 'UNAUTHENTICATED' }, { status: 401 }),
    )

    const response = await GET(request('/api/profile'))

    expect(response.status).toBe(401)
    expect(getProfileMock).not.toHaveBeenCalled()
  })

  it('returns a traceable generic error without leaking database details', async () => {
    getProfileMock.mockRejectedValue(
      new Error('sensitive PostgREST relation and policy details'),
    )

    const response = await GET(request('/api/profile'))
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toEqual({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Internal Server Error',
      requestId: 'profile-request-id',
    })
    expect(JSON.stringify(payload)).not.toContain('PostgREST')
  })
})
