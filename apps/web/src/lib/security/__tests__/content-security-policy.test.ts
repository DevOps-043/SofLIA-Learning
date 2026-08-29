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
    expect(policy).toContain(
      `script-src-elem 'self' 'nonce-${firstNonce}' https://netlify-rum.netlify.app`,
    )
    expect(policy).toContain('https://challenges.cloudflare.com')
    expect(policy).toContain('https://js.hcaptcha.com')
    expect(policy).toMatch(/connect-src[^;]*blob:/)
    expect(policy).not.toContain("'unsafe-eval'")
    expect(policy).not.toMatch(/script-src[^;]*'unsafe-inline'/)
  })

  it('permits React Refresh eval only in development', () => {
    const previousNodeEnv = process.env.NODE_ENV

    try {
      process.env.NODE_ENV = 'development'
      expect(buildEnforcedContentSecurityPolicy('development-nonce')).toMatch(
        /script-src[^;]*'unsafe-eval'/,
      )

      process.env.NODE_ENV = 'production'
      expect(buildEnforcedContentSecurityPolicy('production-nonce')).not.toMatch(
        /script-src[^;]*'unsafe-eval'/,
      )
    } finally {
      process.env.NODE_ENV = previousNodeEnv
    }
  })
})
