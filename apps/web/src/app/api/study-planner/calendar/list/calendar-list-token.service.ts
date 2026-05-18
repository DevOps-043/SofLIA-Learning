import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createAdminClient } from './calendar-list-admin-client'
import { getRefreshConfig } from './calendar-list-token.config'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import type {
  CalendarIntegrationRow,
  TokenRefreshResponse,
} from './calendar-list-token.types'

export { createAdminClient } from './calendar-list-admin-client'
export type { CalendarIntegrationRow } from './calendar-list-token.types'

export async function refreshAccessToken(
  integration: CalendarIntegrationRow,
): Promise<{ success: boolean; accessToken?: string }> {
  try {
    const refreshConfig = getRefreshConfig(integration)
    if (!refreshConfig) {
      return { success: false }
    }

    const response = await fetchWithCircuitBreaker('calendar-list-token-refresh', refreshConfig.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(refreshConfig.body),
    })

    if (!response.ok) {
      return { success: false }
    }

    const tokens: TokenRefreshResponse = await response.json()
    if (!tokens.access_token) {
      return { success: false }
    }

    await persistTokens(integration, tokens)
    return { success: true, accessToken: tokens.access_token }
  } catch (error) {
    techDebtLogger.error('[Calendar List] Error refrescando token:', error)
    return { success: false }
  }
}

async function persistTokens(
  integration: CalendarIntegrationRow,
  tokens: TokenRefreshResponse,
): Promise<void> {
  const supabase = createAdminClient()

  await supabase
    .from('calendar_integrations')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || integration.refresh_token,
      expires_at: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', integration.id)
}
