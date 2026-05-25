export interface RefreshCredentials {
  clientId: string
  clientSecret: string
  tokenUrl: string
}

export function getRefreshCredentials(provider: string): RefreshCredentials | null {
  if (provider === 'google') {
    return {
      clientId:
        process.env.GOOGLE_CALENDAR_CLIENT_ID
        || process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID
        || process.env.GOOGLE_CLIENT_ID
        || '',
      clientSecret:
        process.env.GOOGLE_CALENDAR_CLIENT_SECRET
        || process.env.GOOGLE_CLIENT_SECRET
        || '',
      tokenUrl: 'https://oauth2.googleapis.com/token',
    }
  }

  if (provider === 'microsoft') {
    return {
      clientId:
        process.env.MICROSOFT_CALENDAR_CLIENT_ID
        || process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID
        || process.env.MICROSOFT_CLIENT_ID
        || '',
      clientSecret:
        process.env.MICROSOFT_CALENDAR_CLIENT_SECRET
        || process.env.MICROSOFT_CLIENT_SECRET
        || '',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    }
  }

  return null
}
