import type { CalendarIntegrationRow, TokenRefreshConfig } from './calendar-token-manager.types'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_OAUTH_CLIENT_ID ||
  ''

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.GOOGLE_OAUTH_CLIENT_SECRET ||
  ''

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_OAUTH_CLIENT_ID ||
  ''

const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
  process.env.MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_OAUTH_CLIENT_SECRET ||
  ''

export function getTokenRefreshConfig(
  integration: CalendarIntegrationRow,
): TokenRefreshConfig | null {
  if (!integration.refresh_token) {
    return null
  }

  if (integration.provider === 'google') {
    return {
      url: 'https://oauth2.googleapis.com/token',
      body: {
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      },
    }
  }

  if (integration.provider === 'microsoft') {
    return {
      url: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      body: {
        client_id: MICROSOFT_CLIENT_ID,
        client_secret: MICROSOFT_CLIENT_SECRET,
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      },
    }
  }

  return null
}
