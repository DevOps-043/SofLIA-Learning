import { afterEach, describe, expect, it, vi } from 'vitest'
import { getSecuritySigningSecret, signToken, verifyToken } from '../signed-token'

describe('security signing secret', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('fails closed when production has no signing secret', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SOFLIA_SECURITY_SIGNING_KEY', '')
    vi.stubEnv('NEXTAUTH_SECRET', '')
    vi.stubEnv('SUPABASE_JWT_SECRET', '')

    expect(() => getSecuritySigningSecret()).toThrow(
      'SOFLIA_SECURITY_SIGNING_KEY is required in production',
    )
  })

  it('rejects weak configured secrets', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SOFLIA_SECURITY_SIGNING_KEY', 'too-short')

    expect(() => getSecuritySigningSecret()).toThrow('at least 32 characters')
  })

  it('signs and verifies with a strong configured secret', () => {
    vi.stubEnv('SOFLIA_SECURITY_SIGNING_KEY', 'a'.repeat(64))
    const token = signToken({ subject: 'verification', exp: Date.now() + 60_000 })

    expect(verifyToken<{ subject: string; exp: number }>(token)).toMatchObject({
      subject: 'verification',
    })
  })
})
