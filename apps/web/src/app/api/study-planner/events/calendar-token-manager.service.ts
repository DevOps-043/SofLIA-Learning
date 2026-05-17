import { createAdminClient } from './calendar-token-manager.client'
import { getTokenRefreshConfig } from './calendar-token-manager.config'
import type {
  CalendarIntegrationRow,
  TokenRefreshResponse,
} from './calendar-token-manager.types'

export type { CalendarIntegrationRow } from './calendar-token-manager.types'

export async function refreshAccessToken(
  integration: CalendarIntegrationRow,
): Promise<{ success: boolean; accessToken?: string }> {
  const refreshConfig = getTokenRefreshConfig(integration)

  if (!refreshConfig) {
    return { success: false }
  }

  try {
    const response = await fetch(refreshConfig.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(refreshConfig.body),
    })

    if (!response.ok) {
      return { success: false }
    }

    const tokens = await response.json() as TokenRefreshResponse
    await persistRefreshedTokens(integration, tokens)

    return { success: true, accessToken: tokens.access_token }
  } catch (error) {
    console.error('Error en refreshAccessToken:', error)
    return { success: false }
  }
}

async function persistRefreshedTokens(
  integration: CalendarIntegrationRow,
  tokens: TokenRefreshResponse,
): Promise<void> {
  const supabase = createAdminClient()
  const updates: Record<string, string | null> = {
    access_token: tokens.access_token,
    expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
  }

  if (integration.provider === 'microsoft') {
    updates.refresh_token = tokens.refresh_token || integration.refresh_token || null
  }

  await supabase
    .from('calendar_integrations')
    .update(updates)
    .eq('id', integration.id)
}
