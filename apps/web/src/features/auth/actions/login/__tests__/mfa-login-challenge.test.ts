import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  buildFormDataFromLoginMfaChallenge,
  createLoginMfaChallenge,
  LoginMfaChallengeError,
  verifyLoginMfaChallenge,
} from '../mfa-login-challenge'

const headers = new Headers({
  'user-agent': 'vitest',
  'x-real-ip': '127.0.0.1',
})

describe('login MFA challenge', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('creates and verifies a challenge bound to nonce and request fingerprint', () => {
    vi.stubEnv('MFA_LOGIN_CHALLENGE_SECRET', 'x'.repeat(32))
    const formData = new FormData()
    formData.set('organizationId', 'org-1')
    formData.set('organizationSlug', 'acme')

    const challenge = createLoginMfaChallenge({
      emailOrUsername: 'admin@example.com',
      formData,
      headers,
      rememberMe: true,
      userId: 'user-1',
    })

    const payload = verifyLoginMfaChallenge({
      cookieNonce: challenge.nonce,
      headers,
      token: challenge.token,
    })

    expect(payload.userId).toBe('user-1')
    expect(payload.rememberMe).toBe(true)
    expect(payload.organizationSlug).toBe('acme')
  })

  it('rejects a challenge when the nonce cookie is missing', () => {
    vi.stubEnv('MFA_LOGIN_CHALLENGE_SECRET', 'x'.repeat(32))
    const challenge = createLoginMfaChallenge({
      emailOrUsername: 'admin@example.com',
      formData: new FormData(),
      headers,
      rememberMe: false,
      userId: 'user-1',
    })

    expect(() =>
      verifyLoginMfaChallenge({
        cookieNonce: undefined,
        headers,
        token: challenge.token,
      }),
    ).toThrow(LoginMfaChallengeError)
  })

  it('rebuilds only the organization context needed after MFA', () => {
    vi.stubEnv('MFA_LOGIN_CHALLENGE_SECRET', 'x'.repeat(32))
    const formData = new FormData()
    formData.set('invitationToken', 'invite-token')
    const challenge = createLoginMfaChallenge({
      emailOrUsername: 'admin@example.com',
      formData,
      headers,
      rememberMe: false,
      userId: 'user-1',
    })
    const payload = verifyLoginMfaChallenge({
      cookieNonce: challenge.nonce,
      headers,
      token: challenge.token,
    })

    const rebuilt = buildFormDataFromLoginMfaChallenge(payload)

    expect(rebuilt.get('invitationToken')).toBe('invite-token')
    expect(rebuilt.get('password')).toBeNull()
  })
})
