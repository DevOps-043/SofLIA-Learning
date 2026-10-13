// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { updateSession } from '../middleware'

vi.mock('@supabase/ssr', () => ({ createServerClient: vi.fn() }))

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllEnvs())

describe('middleware session refresh', () => {
  it.each(['/', '/api/cron/process-notebook-generation', '/api/internal/jobs/system-status-check'])
    ('does not require Auth for an anonymous request to %s', async pathname => {
      const result = await updateSession(new NextRequest(`https://learning.test${pathname}`))
      expect(result.user).toBeNull()
      expect(createServerClient).not.toHaveBeenCalled()
    })

  it('keeps scheduler authorization independent of stale browser cookies', async () => {
    await updateSession(new NextRequest('https://learning.test/api/cron/process-notebook-generation', {
      headers: { cookie: 'sb-project-auth-token=stale' },
    }))
    expect(createServerClient).not.toHaveBeenCalled()
  })

  it('forwards rotated cookies to the handler and preserves the CSP nonce', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://project.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')
    const request = new NextRequest('https://learning.test/dashboard', {
      headers: { cookie: 'sb-project-auth-token.0=old; preference=dark', 'x-nonce': 'nonce' },
    })
    const getUser = vi.fn()
    vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
      getUser.mockImplementation(async () => {
        options?.cookies.setAll?.([{ name: 'sb-project-auth-token.0', value: 'rotated', options: { path: '/' } }], {})
        return { data: { user: { id: 'verified-user' } }, error: null }
      })
      return { auth: { getUser } } as unknown as ReturnType<typeof createServerClient>
    })
    const result = await updateSession(request)
    expect(result.user?.id).toBe('verified-user')
    expect(result.response.headers.get('x-middleware-request-cookie')).toContain('sb-project-auth-token.0=rotated')
    expect(result.response.headers.get('x-middleware-request-x-nonce')).toBe('nonce')
    expect(result.response.cookies.get('sb-project-auth-token.0')?.value).toBe('rotated')
  })
})
