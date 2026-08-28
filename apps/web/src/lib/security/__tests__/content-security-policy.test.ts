import { describe, expect, it } from 'vitest'
import {
  buildEnforcedContentSecurityPolicy,
  createContentSecurityPolicyNonce,
} from '../content-security-policy'

describe('enforced content security policy', () => {
  it('uses a unique nonce and never enables arbitrary inline/eval scripts', () => {
    const firstNonce = createContentSecurityPolicyNonce()
    const secondNonce = createContentSecurityPolicyNonce()
    const policy = buildEnforcedContentSecurityPolicy(firstNonce)

    expect(firstNonce).not.toBe(secondNonce)
    expect(policy).toContain(`'nonce-${firstNonce}'`)
    expect(policy).toContain("'strict-dynamic'")
    expect(policy).not.toContain("'unsafe-eval'")
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/)
  })
})
