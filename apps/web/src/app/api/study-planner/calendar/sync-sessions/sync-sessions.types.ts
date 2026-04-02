import type { CalendarIntegrationRecord } from '../events/calendar-events.types'

export interface SyncSessionsRequestBody {
  sessionIds: string[]
}

export interface SyncSessionsResponse {
  success: boolean
  data?: {
    syncedCount: number
    failedCount: number
    errors?: string[]
  }
  error?: string
}

export interface StudySessionRecord {
  id: string
  user_id: string
  title: string
  description: string | null
  start_time: string
  end_time: string
  plan_id: string | null
  course_id: string | null
}

export interface PreparedSyncSessionsContext {
  sessions: StudySessionRecord[]
  integration: CalendarIntegrationRecord
  accessToken: string
  timezone: string
  secondaryCalendarId: string | null
}

export interface SyncSessionEventResult {
  eventId: string | null
  newSecondaryCalendarId?: string | null
}
