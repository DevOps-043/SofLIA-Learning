export interface CalendarApiEventRecord {
  id: string
  title: string
  description?: string
  start: string
  end: string
  location?: string
  isAllDay?: boolean
  calendarId?: string
  linkedStudySessionId?: string
  linkedStudyPlanId?: string
  linkedClientReferenceId?: string
}

export interface CalendarApiPayload {
  events?: CalendarApiEventRecord[]
  provider?: 'google' | 'microsoft'
  warning?: string
  error?: string
  hint?: string
}

export interface StudySessionApiRecord {
  id: string
  title?: string
  description?: string
  start_time: string
  end_time: string
  external_event_id?: string | null
  plan_id?: string
  metrics?: {
    calendarSync?: {
      provider?: string
      calendarId?: string | null
      externalEventId?: string
      normalizedExternalEventId?: string
      source?: string
      lastSyncedAt?: string
    } | null
  } | null
}

export interface StudySessionsApiPayload {
  sessions?: StudySessionApiRecord[]
}

export interface CustomEventApiRecord {
  id: string
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  is_all_day?: boolean
  google_event_id?: string | null
  color?: string
}

export interface CustomEventsApiPayload {
  events?: CustomEventApiRecord[]
  warning?: string
  error?: string
  hint?: string
}

export interface MutationApiPayload {
  error?: string
}
