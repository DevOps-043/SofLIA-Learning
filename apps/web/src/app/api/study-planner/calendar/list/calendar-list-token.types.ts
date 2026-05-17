import type { CalendarIntegrationMetadata } from '../../../../../features/study-planner/types/user-context.types'

export interface CalendarIntegrationRow {
  id: string
  provider: 'google' | 'microsoft'
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  metadata: CalendarIntegrationMetadata | null
}

export interface TokenRefreshResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

export interface RefreshConfig {
  url: string
  body: Record<string, string>
}
