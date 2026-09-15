import { describe, expect, it } from 'vitest'
import { getLegacyRegisterInvitePath } from '../legacy-register-route.service'

describe('getLegacyRegisterInvitePath', () => {
  it('maps valid legacy bulk invitation tokens to the canonical landing page', () => {
    const token = 'Y2x-TE2zMXrP2DtuIAGK_n-RXuRs254Y'

    expect(getLegacyRegisterInvitePath(token)).toBe(`/invite/${token}`)
  })

  it.each([
    undefined,
    ['valid-token-that-must-not-be-ambiguous'],
    'short',
    '../dashboard',
    'https://attacker.example/invite/token',
  ])('rejects missing or unsafe legacy values: %j', (value) => {
    expect(getLegacyRegisterInvitePath(value)).toBeNull()
  })
})
