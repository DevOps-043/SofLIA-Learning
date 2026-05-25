export interface CalendarIntegrationRow {
  id: string
  access_token: string | null
  provider: 'google' | 'microsoft' | string
  refresh_token?: string | null
  expires_at?: string | null
  metadata?: { secondary_calendar_id?: string } | null
}

export interface TokenRefreshResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
}

export interface TokenRefreshConfig {
  url: string
  body: Record<string, string>
}
