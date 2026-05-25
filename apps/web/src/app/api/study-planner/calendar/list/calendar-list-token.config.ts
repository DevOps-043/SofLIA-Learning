import type { CalendarIntegrationRow, RefreshConfig } from './calendar-list-token.types'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_OAUTH_CLIENT_ID

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.GOOGLE_OAUTH_CLIENT_SECRET

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_OAUTH_CLIENT_ID

const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_OAUTH_CLIENT_SECRET

export function getRefreshConfig(integration: CalendarIntegrationRow): RefreshConfig | null {
  if (!integration.refresh_token) {
    return null
  }

  if (integration.provider === 'google') {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      return null
    }

    return buildRefreshConfig('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: integration.refresh_token,
      grant_type: 'refresh_token',
    })
  }

  if (!MICROSOFT_CLIENT_ID || !MICROSOFT_CLIENT_SECRET) {
    return null
  }

  return buildRefreshConfig('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    refresh_token: integration.refresh_token,
    grant_type: 'refresh_token',
    scope: 'offline_access Calendars.Read User.Read',
  })
}

function buildRefreshConfig(url: string, body: Record<string, string>): RefreshConfig {
  return { url, body }
}
