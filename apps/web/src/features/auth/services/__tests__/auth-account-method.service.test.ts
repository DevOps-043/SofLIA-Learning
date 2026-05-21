import { describe, expect, it } from 'vitest'
import {
  AuthAccountMethodService,
  buildOAuthLoginRequiredMessage,
  formatAuthProviderList,
  hasUsableLocalPassword,
} from '../auth-account-method.service'

function createSupabaseMock(providers: Array<{ provider: string | null }>) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => Promise.resolve({ data: providers, error: null }),
        }),
      }),
    }),
  }
}

describe('AuthAccountMethodService', () => {
  it('deduplicates only Google and Microsoft auth providers', async () => {
    const providers = await AuthAccountMethodService.getOAuthProviders(
      createSupabaseMock([
        { provider: 'google' },
        { provider: 'google' },
        { provider: 'github' },
        { provider: 'microsoft' },
        { provider: null },
      ]) as never,
      'user-1',
    )

    expect(providers).toEqual(['google', 'microsoft'])
  })

  it('marks empty password hashes as unusable local credentials', () => {
    expect(hasUsableLocalPassword(null)).toBe(false)
    expect(hasUsableLocalPassword('')).toBe(false)
    expect(hasUsableLocalPassword('  ')).toBe(false)
    expect(hasUsableLocalPassword('$2a$12$valid-bcrypt-like-value')).toBe(true)
  })

  it('disables local credentials when Google or Microsoft OAuth is linked', async () => {
    const status = await AuthAccountMethodService.getAccountMethodStatus({
      passwordHash: '$2a$12$valid-bcrypt-like-value',
      supabase: createSupabaseMock([{ provider: 'google' }]) as never,
      userId: 'user-1',
    })

    expect(status).toEqual({
      canUseLocalCredentials: false,
      oauthProviders: ['google'],
    })
  })

  it('uses the legacy user oauth provider as a fallback', async () => {
    const status = await AuthAccountMethodService.getAccountMethodStatus({
      legacyOAuthProvider: 'microsoft',
      passwordHash: '$2a$12$valid-bcrypt-like-value',
      supabase: createSupabaseMock([]) as never,
      userId: 'user-1',
    })

    expect(status).toEqual({
      canUseLocalCredentials: false,
      oauthProviders: ['microsoft'],
    })
  })

  it('formats OAuth login messages with the available providers', () => {
    expect(formatAuthProviderList(['google'])).toBe('Google')
    expect(formatAuthProviderList(['google', 'microsoft'])).toBe('Google o Microsoft')
    expect(buildOAuthLoginRequiredMessage(['microsoft'])).toBe(
      'Cuenta registrada con OAuth. Inicia sesion con Microsoft.',
    )
  })
})
