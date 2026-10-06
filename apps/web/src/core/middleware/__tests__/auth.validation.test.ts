import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { NextRequest } from 'next/server'

import { createServerClient } from '@supabase/ssr'
import { createAdminClient } from '../../../lib/supabase/admin'
import { resolveAuthenticatedUserId } from '../auth.session'

vi.mock('server-only', () => ({}))
vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))
vi.mock('../../../lib/supabase/admin', () => ({ createAdminClient: vi.fn() }))
vi.mock('../auth.session', () => ({ resolveAuthenticatedUserId: vi.fn() }))
vi.mock('../auth.logging', () => ({
  getClientIp: vi.fn(() => '203.0.113.10'),
  logSecurityEvent: vi.fn(),
}))

import { validateRoleAccess } from '../auth.validation'

function buildRequest(pathname: string): NextRequest {
  return {
    nextUrl: { pathname },
    headers: new Headers(),
    cookies: { getAll: () => [] },
  } as unknown as NextRequest
}

function mockAdminUsersRow(row: { id: string; platform_role: string | null } | null) {
  const single = vi.fn().mockResolvedValue({
    data: row,
    error: row ? null : { message: 'no rows' },
  })
  const eq = vi.fn(() => ({ single }))
  const select = vi.fn(() => ({ eq }))
  const from = vi.fn(() => ({ select }))
  vi.mocked(createAdminClient).mockReturnValue(
    { from } as unknown as ReturnType<typeof createAdminClient>,
  )
  return { from, select, eq, single }
}

describe('validateRoleAccess', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // The anon/cookie-bound client is only exercised through
    // resolveAuthenticatedUserId in these tests, so a bare stand-in is enough.
    vi.mocked(createServerClient).mockReturnValue({} as ReturnType<typeof createServerClient>)
  })

  it('reads platform_role with the service-role client for a session resolved via the legacy/refresh-token fallback (OAuth logins never mint a native Supabase session)', async () => {
    vi.mocked(resolveAuthenticatedUserId).mockResolvedValue({ userId: 'user-1' })
    const { from, eq } = mockAdminUsersRow({ id: 'user-1', platform_role: 'Usuario' })

    const result = await validateRoleAccess(buildRequest('/dashboard'))

    expect(from).toHaveBeenCalledWith('users')
    expect(eq).toHaveBeenCalledWith('id', 'user-1')
    expect(result).toMatchObject({ isValid: true, userId: 'user-1', role: 'Usuario' })
  })

  it('skips resolveAuthenticatedUserId and still uses the service-role client when preResolvedUserId is already known', async () => {
    mockAdminUsersRow({ id: 'user-2', platform_role: 'Administrador' })

    const result = await validateRoleAccess(buildRequest('/admin/dashboard'), 'Administrador', 'user-2')

    expect(resolveAuthenticatedUserId).not.toHaveBeenCalled()
    expect(result).toMatchObject({ isValid: true, userId: 'user-2', role: 'Administrador' })
  })

  it('reports insufficient permissions, not "user not found", when the role legitimately lacks access', async () => {
    vi.mocked(resolveAuthenticatedUserId).mockResolvedValue({ userId: 'user-3' })
    mockAdminUsersRow({ id: 'user-3', platform_role: 'Usuario' })

    const result = await validateRoleAccess(buildRequest('/admin/dashboard'), 'Administrador')

    expect(result).toMatchObject({ isValid: false, error: 'Insufficient permissions' })
  })

  it('returns "No session found" without ever calling the users table when no session resolves at all', async () => {
    vi.mocked(resolveAuthenticatedUserId).mockResolvedValue({ userId: null })

    const result = await validateRoleAccess(buildRequest('/dashboard'))

    expect(createAdminClient).not.toHaveBeenCalled()
    expect(result).toEqual({ isValid: false, error: 'No session found' })
  })
})
