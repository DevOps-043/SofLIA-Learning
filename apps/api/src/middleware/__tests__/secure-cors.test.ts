import { describe, expect, it } from 'vitest'
import { CORS_PREFLIGHT_MAX_AGE_SECONDS } from '../secure-cors.constants'
import { isOriginAllowed } from '../secure-cors.origins'

describe('secure CORS policy', () => {
  it('rejects origins outside the allowlist', () => {
    expect(isOriginAllowed('https://evil.example', ['https://soflia.com'])).toBe(false)
  })

  it('allows exact production origins', () => {
    expect(isOriginAllowed('https://soflia.com', ['https://soflia.com'])).toBe(true)
  })

  it('supports one-label tenant subdomains when explicitly configured', () => {
    expect(isOriginAllowed('https://acme.soflia.com', ['https://*.soflia.com'])).toBe(true)
    expect(isOriginAllowed('https://nested.acme.soflia.com', ['https://*.soflia.com'])).toBe(false)
  })

  it('keeps preflight cache at ten minutes', () => {
    expect(CORS_PREFLIGHT_MAX_AGE_SECONDS).toBe(600)
  })
})
