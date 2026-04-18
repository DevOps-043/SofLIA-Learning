import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { destroySessionMock } = vi.hoisted(() => ({
  destroySessionMock: vi.fn(),
}))

vi.mock('@/features/auth/services/session.service', () => ({
  SessionService: {
    destroySession: destroySessionMock,
  },
}))

vi.mock('@/lib/logger', () => ({
  logger: {
    auth: vi.fn(),
    error: vi.fn(),
  },
}))

import { POST } from '../route'

function createRequest(cookieHeader?: string): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/logout', {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    method: 'POST',
  })
}

describe('/api/auth/logout route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('destroys the server session and expires auth cookies', async () => {
    destroySessionMock.mockResolvedValue(undefined)

    const response = await POST()
    const payload = await response.json()
    const setCookieHeader = response.headers.get('set-cookie') || ''

    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(payload).toMatchObject({
      success: true,
      message: 'Sesion cerrada exitosamente',
    })
    expect(destroySessionMock).toHaveBeenCalledTimes(1)
    expect(setCookieHeader).toContain('access_token=')
    expect(setCookieHeader).toContain('refresh_token=')
    expect(setCookieHeader).toContain('aprende-y-aplica-session=')
    expect(setCookieHeader.toLowerCase()).toContain('max-age=0')
  })

  it('still expires auth cookies when session destruction fails', async () => {
    destroySessionMock.mockRejectedValue(new Error('database unavailable'))

    const response = await POST(
      createRequest('access_token=a; refresh_token=b; aprende-y-aplica-session=c')
    )
    const payload = await response.json()
    const setCookieHeader = response.headers.get('set-cookie') || ''

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      success: true,
      message: 'Sesion local cerrada',
    })
    expect(setCookieHeader).toContain('access_token=')
    expect(setCookieHeader).toContain('refresh_token=')
    expect(setCookieHeader).toContain('aprende-y-aplica-session=')
    expect(setCookieHeader.toLowerCase()).toContain('max-age=0')
  })
})
