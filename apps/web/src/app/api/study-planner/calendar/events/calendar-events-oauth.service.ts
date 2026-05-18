import type { SupabaseClient } from '@supabase/supabase-js'
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker'
import type {
  CalendarIntegrationRecord,
  RefreshAccessTokenResult,
} from './calendar-events.types'

function getGoogleOAuthCredentials() {
  return {
    clientId:
      process.env.GOOGLE_CALENDAR_CLIENT_ID ||
      process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
      process.env.GOOGLE_CLIENT_ID ||
      process.env.GOOGLE_OAUTH_CLIENT_ID ||
      '',
    clientSecret:
      process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
      process.env.GOOGLE_CLIENT_SECRET ||
      process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
      '',
  }
}

function getMicrosoftOAuthCredentials() {
  return {
    clientId:
      process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
      process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
      process.env.MICROSOFT_CLIENT_ID ||
      process.env.MICROSOFT_OAUTH_CLIENT_ID ||
      '',
    clientSecret:
      process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
      process.env.MICROSOFT_CLIENT_SECRET ||
      process.env.MICROSOFT_OAUTH_CLIENT_SECRET ||
      '',
  }
}

export async function refreshCalendarAccessToken(
  supabase: SupabaseClient,
  integration: CalendarIntegrationRecord,
): Promise<RefreshAccessTokenResult> {
  try {
    if (!integration.refresh_token) {
      return { success: false }
    }

    if (integration.provider === 'google') {
      const credentials = getGoogleOAuthCredentials()
      if (!credentials.clientId || !credentials.clientSecret) {
        return { success: false }
      }

      const response = await fetchWithCircuitBreaker('google-oauth-calendar-events', 'https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: credentials.clientId,
          client_secret: credentials.clientSecret,
          refresh_token: integration.refresh_token,
          grant_type: 'refresh_token',
        }),
      })

      if (!response.ok) {
        return { success: false }
      }

      const tokens = await response.json()
      if (!tokens.access_token) {
        return { success: false }
      }

      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(
            Date.now() + (tokens.expires_in || 3600) * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)

      return { success: true, accessToken: tokens.access_token }
    }

    if (integration.provider === 'microsoft') {
      const credentials = getMicrosoftOAuthCredentials()
      if (!credentials.clientId || !credentials.clientSecret) {
        return { success: false }
      }

      const response = await fetchWithCircuitBreaker(
        'microsoft-oauth-calendar-events',
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
            refresh_token: integration.refresh_token,
            grant_type: 'refresh_token',
            scope: 'offline_access Calendars.Read User.Read',
          }),
        },
      )

      if (!response.ok) {
        return { success: false }
      }

      const tokens = await response.json()
      if (!tokens.access_token) {
        return { success: false }
      }

      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || integration.refresh_token,
          expires_at: new Date(
            Date.now() + (tokens.expires_in || 3600) * 1000,
          ).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id)

      return { success: true, accessToken: tokens.access_token }
    }

    return { success: false }
  } catch {
    return { success: false }
  }
}
