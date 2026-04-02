import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'

const createClientMock = vi.fn(() => ({ from: vi.fn() }))

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}))

describe('business-users-server.client', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.NEXT_PUBLIC_SUPABASE_URL
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
  })

  it('throws when service-role env vars are missing', async () => {
    const { createBusinessUsersAdminClient } = await import(
      '../business-users-server/client'
    )

    expect(() => createBusinessUsersAdminClient()).toThrow(
      'SUPABASE_SERVICE_ROLE_KEY no esta configurada',
    )
  })

  it('creates a non-persistent service client when env vars exist', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'

    const { createBusinessUsersAdminClient } = await import(
      '../business-users-server/client'
    )

    createBusinessUsersAdminClient()

    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-key',
      expect.objectContaining({
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }),
    )
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl
    process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  })
})
