import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  createAdminClient: vi.fn(),
  loggerError: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: mocks.createAdminClient,
}))

vi.mock('@/features/auth/actions/invitation/index', () => ({
  consumeBulkInvitation: vi.fn(),
  createInvitationRuntime: vi.fn(),
}))

vi.mock('@/lib/utils/logger', () => ({
  logger: { error: mocks.loggerError },
}))

import { GET } from '../route'

describe('GET /api/invite/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('validates an active link through the server-only client', async () => {
    const chain = createSelectChain({
      data: activeLink(),
      error: null,
    })
    const client = { from: vi.fn(() => chain) }
    mocks.createAdminClient.mockReturnValue(client)

    const response = await GET(createRequest(), routeContext())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toMatchObject({
      invite: {
        id: 'link-id',
        remainingUses: 24,
        role: 'member',
      },
      organization: {
        id: 'company-id',
        name: 'Ditia',
        slug: 'ditia',
      },
      success: true,
      valid: true,
    })
    expect(payload.invite).not.toHaveProperty('token')
    expect(client.from).toHaveBeenCalledWith('bulk_invite_links')
  })

  it('returns not_found only for a genuine no-row result', async () => {
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() =>
        createSelectChain({
          data: null,
          error: { code: 'PGRST116', message: 'No rows' },
        }),
      ),
    })

    const response = await GET(createRequest(), routeContext())
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.reason).toBe('not_found')
  })

  it('does not disguise database or permission failures as missing tokens', async () => {
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() =>
        createSelectChain({
          data: null,
          error: { code: '42501', message: 'permission denied' },
        }),
      ),
    })

    const response = await GET(createRequest(), routeContext())
    const payload = await response.json()

    expect(response.status).toBe(500)
    expect(payload.reason).toBe('validation_error')
    expect(JSON.stringify(payload)).not.toContain('permission denied')
    expect(mocks.loggerError).toHaveBeenCalledWith(
      'Error resolving bulk invite link:',
      expect.objectContaining({ code: '42501' }),
    )
  })

  it('reports a paused existing link as paused instead of missing', async () => {
    mocks.createAdminClient.mockReturnValue({
      from: vi.fn(() =>
        createSelectChain({
          data: { ...activeLink(), status: 'paused' },
          error: null,
        }),
      ),
    })

    const response = await GET(createRequest(), routeContext())
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.reason).toBe('paused')
  })
})

function activeLink() {
  return {
    current_uses: 1,
    expires_at: '2099-06-30T12:00:00.000Z',
    id: 'link-id',
    max_uses: 25,
    name: 'Equipo ventas',
    organization_id: 'company-id',
    organizations: {
      brand_color_accent: '#22c55e',
      brand_color_primary: '#0f172a',
      brand_favicon_url: null,
      brand_logo_url: null,
      google_login_enabled: true,
      id: 'company-id',
      logo_url: null,
      microsoft_login_enabled: false,
      name: 'Ditia',
      slug: 'ditia',
    },
    role: 'member',
    status: 'active',
    token: 'existing-valid-token-1234567890',
  }
}

function createSelectChain(result: unknown) {
  const chain = {
    eq: vi.fn(),
    select: vi.fn(),
    single: vi.fn(async () => result),
  }
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  return chain
}

function createRequest() {
  return new Request(
    'http://localhost/api/invite/existing-valid-token-1234567890',
  )
}

function routeContext() {
  return {
    params: Promise.resolve({ token: 'existing-valid-token-1234567890' }),
  }
}
