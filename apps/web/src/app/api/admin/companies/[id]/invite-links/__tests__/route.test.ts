import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  loggerError: vi.fn(),
  requireAdmin: vi.fn(),
}))

vi.mock('@/lib/auth/requireAdmin', () => ({
  requireAdmin: mocks.requireAdmin,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: mocks.loggerError },
}))

vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'test-token-with-at-least-32-chars'),
}))

import { POST } from '../route'

describe('POST /api/admin/companies/[id]/invite-links', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.requireAdmin.mockResolvedValue({
      userEmail: 'admin@example.com',
      userId: 'admin-user-id',
      userRole: 'administrator',
    })
  })

  it('persists a member bearer link with the server-only client', async () => {
    const link = {
      created_by: 'admin-user-id',
      expires_at: '2099-06-30T12:00:00.000Z',
      id: 'link-id',
      max_uses: 25,
      name: 'Equipo ventas',
      organization_id: 'company-id',
      role: 'member',
      status: 'active',
      token: 'test-token-with-at-least-32-chars',
    }
    const chain = createInsertChain({ data: link, error: null })
    const client = { from: vi.fn(() => chain) }
    mocks.createAdminClient.mockReturnValue(client)

    const response = await POST(createRequest(), routeContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ link, success: true })
    expect(client.from).toHaveBeenCalledWith('bulk_invite_links')
    expect(chain.insert).toHaveBeenCalledWith({
      created_by: 'admin-user-id',
      expires_at: '2099-06-30T12:00:00.000Z',
      max_uses: 25,
      name: 'Equipo ventas',
      organization_id: 'company-id',
      role: 'member',
      status: 'active',
      token: 'test-token-with-at-least-32-chars',
    })
  })

  it('rejects privileged bearer links before touching the database', async () => {
    const response = await POST(
      createRequest({ role: 'owner' }),
      routeContext(),
    )

    expect(response.status).toBe(422)
    expect(mocks.requireAdmin).not.toHaveBeenCalled()
    expect(mocks.createAdminClient).not.toHaveBeenCalled()
  })

  it('returns a safe error when persistence fails', async () => {
    const chain = createInsertChain({
      data: null,
      error: { code: '42501', message: 'permission denied' },
    })
    mocks.createAdminClient.mockReturnValue({ from: vi.fn(() => chain) })

    const response = await POST(createRequest(), routeContext())
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload).toEqual({
      error: 'Error al crear el enlace de invitacion',
      success: false,
    })
    expect(JSON.stringify(payload)).not.toContain('permission denied')
  })
})

function createInsertChain(result: unknown) {
  const chain = {
    insert: vi.fn(),
    select: vi.fn(),
    single: vi.fn(async () => result),
  }
  chain.insert.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  return chain
}

function createRequest(overrides: Record<string, unknown> = {}) {
  return new NextRequest(
    'http://localhost/api/admin/companies/company-id/invite-links',
    {
      body: JSON.stringify({
        expiresAt: '2099-06-30T12:00:00.000Z',
        maxUses: 25,
        name: 'Equipo ventas',
        role: 'member',
        ...overrides,
      }),
      headers: { 'content-type': 'application/json' },
      method: 'POST',
    },
  )
}

function routeContext() {
  return { params: Promise.resolve({ id: 'company-id' }) }
}
