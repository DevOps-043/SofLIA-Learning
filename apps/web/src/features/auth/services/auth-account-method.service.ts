import type { createClient } from '../../../lib/supabase/server'

export const AUTH_OAUTH_PROVIDERS = ['google', 'microsoft'] as const

export type AuthOAuthProvider = (typeof AUTH_OAUTH_PROVIDERS)[number]

type AuthAccountSupabaseClient = Awaited<ReturnType<typeof createClient>>

interface OAuthProviderRow {
  provider: string | null
}

export interface AuthAccountMethodStatus {
  canUseLocalCredentials: boolean
  oauthProviders: AuthOAuthProvider[]
}

function isAuthOAuthProvider(provider: string | null | undefined): provider is AuthOAuthProvider {
  return provider === 'google' || provider === 'microsoft'
}

function normalizeAuthOAuthProviders(
  providers: Array<string | null | undefined>,
): AuthOAuthProvider[] {
  return Array.from(new Set(providers.filter(isAuthOAuthProvider)))
}

export function hasUsableLocalPassword(passwordHash: string | null | undefined): boolean {
  return Boolean(passwordHash?.trim())
}

export function formatAuthProviderList(providers: readonly AuthOAuthProvider[]): string {
  const labels = providers.map((provider) => (provider === 'google' ? 'Google' : 'Microsoft'))

  if (labels.length <= 1) {
    return labels[0] || 'Google/Microsoft'
  }

  return `${labels.slice(0, -1).join(', ')} o ${labels[labels.length - 1]}`
}

export function buildOAuthLoginRequiredMessage(providers: readonly AuthOAuthProvider[]): string {
  return `Cuenta registrada con OAuth. Inicia sesion con ${formatAuthProviderList(providers)}.`
}

export class AuthAccountMethodService {
  static async getOAuthProviders(
    supabase: AuthAccountSupabaseClient,
    userId: string,
  ): Promise<AuthOAuthProvider[]> {
    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('provider')
      .eq('user_id', userId)
      .in('provider', [...AUTH_OAUTH_PROVIDERS])

    if (error) {
      throw new Error(`Error obteniendo proveedores OAuth: ${error.message}`)
    }

    return Array.from(
      new Set(((data || []) as OAuthProviderRow[]).map((row) => row.provider).filter(isAuthOAuthProvider)),
    )
  }

  static async getAccountMethodStatus(params: {
    legacyOAuthProvider?: string | null
    passwordHash?: string | null
    supabase: AuthAccountSupabaseClient
    userId: string
  }): Promise<AuthAccountMethodStatus> {
    const oauthProviders = normalizeAuthOAuthProviders([
      params.legacyOAuthProvider,
      ...(await this.getOAuthProviders(params.supabase, params.userId)),
    ])

    return {
      canUseLocalCredentials: oauthProviders.length === 0 && hasUsableLocalPassword(params.passwordHash),
      oauthProviders,
    }
  }
}
