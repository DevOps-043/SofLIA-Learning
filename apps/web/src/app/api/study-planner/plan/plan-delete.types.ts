export interface DeletePlanResponse {
  success: boolean
  message?: string
  error?: string
  deletedPlanId?: string
  deletedSessionsCount?: number
  deletedCalendarEventsCount?: number
  calendarDeletionErrors?: number
  calendarEventsNotFound?: number
}

export interface DeletePlanExecutionResult {
  ok: boolean
  status: 'success' | 'not_found' | 'error'
  error?: string
  planId?: string
  deletedSessionsCount: number
  deletedCalendarEventsCount: number
  calendarDeletionErrors: number
  calendarEventsNotFound: number
}

export interface DeletePlanSessionRow {
  id: string
  external_event_id?: string | null
  calendar_provider?: 'google' | 'microsoft' | null
  metrics?: unknown
}
