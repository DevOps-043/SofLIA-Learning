import { afterEach, describe, expect, it } from 'vitest'
import { requireHumanVerification } from '../bot-protection'

const ORIGINAL_TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY

afterEach(() => {
  process.env.TURNSTILE_SECRET_KEY = ORIGINAL_TURNSTILE_SECRET
})

describe('requireHumanVerification', () => {
  it('skips verification when no captcha provider is configured', async () => {
    delete process.env.TURNSTILE_SECRET_KEY

    await expect(requireHumanVerification(new FormData())).resolves.toEqual({
      ok: true,
      skipped: true,
    })
  })

  it('rejects missing captcha tokens when Turnstile is configured', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'test-secret'

    await expect(requireHumanVerification(new FormData())).resolves.toEqual({
      ok: false,
      error: 'Completa la verificacion humana para continuar.',
    })
  })
})
