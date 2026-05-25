import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  createClientMock,
  getCurrentUserMock,
  resolveOAuthDashboardDestinationMock,
} = vi.hoisted(() => ({
  createClientMock: vi.fn(),
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

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
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
    createClientMock.mockResolvedValue({ from: vi.fn() })
  })

  it('returns an error envelope when the user is not authenticated', async () => {
    getCurrentUserMock.mockResolvedValue(null)

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(401)
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
      expect.anything(),
      'user-1',
    )
  })
})
