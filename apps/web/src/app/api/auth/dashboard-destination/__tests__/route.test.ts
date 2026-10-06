import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createAdminClientMock,
  getCurrentUserMock,
  resolveOAuthDashboardDestinationMock,
} = vi.hoisted(() => ({
  createAdminClientMock: vi.fn(),
  getCurrentUserMock: vi.fn(),
  resolveOAuthDashboardDestinationMock: vi.fn(),
}))

vi.mock('@/features/auth/services/session.service', () => ({
  SessionService: {
    getCurrentUser: getCurrentUserMock,
  },
}))

vi.mock('@/features/auth/services/oauth-flow', () => ({
  resolveOAuthDashboardDestination: resolveOAuthDashboardDestinationMock,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

import { GET } from '../route'

describe('/api/auth/dashboard-destination route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createAdminClientMock.mockReturnValue({ from: vi.fn() })
  })

  it('returns an error envelope when the user is not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null)

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(createAdminClientMock).not.toHaveBeenCalled()
    expect(payload).toEqual({
      details: { destination: '/auth' },
      error: 'UNAUTHENTICATED',
      message: 'No autenticado.',
    })
  })

  it('returns the resolved destination for authenticated users', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'user-1' })
    resolveOAuthDashboardDestinationMock.mockResolvedValue('/admin')

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({
      destination: '/admin',
      success: true,
    })
    expect(resolveOAuthDashboardDestinationMock).toHaveBeenCalledWith(
      createAdminClientMock.mock.results[0].value,
      'user-1',
    )
  })
})
