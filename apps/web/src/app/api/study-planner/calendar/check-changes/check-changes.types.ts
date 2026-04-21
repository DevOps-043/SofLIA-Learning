export interface CalendarIntegrationRow {
  id: string;
  provider: 'google' | 'microsoft' | string;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: string | null;
  metadata?: {
    secondary_calendar_id?: string;
    selected_calendar_ids?: string[];
  } | null;
}

export interface StudySessionRow {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  external_event_id: string | null;
  calendar_provider?: 'google' | 'microsoft' | null;
  status?: string;
  plan_id?: string | null;
  metrics?: Record<string, unknown> | null;
}

export interface ExternalCalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  calendarId?: string;
  linkedStudySessionId?: string;
}

export interface TokenRefreshResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface CalendarChange {
  type: 'deleted_event' | 'modified_event' | 'conflict';
  sessionId: string;
  sessionTitle: string;
  eventTime: string;
  externalEventId: string;
  suggestedAction?: string;
}

export interface CheckChangesResponse {
  success: boolean;
  data?: {
    changes: CalendarChange[];
    deletedSessions: number;
    modifiedSessions: number;
  };
  error?: string;
}
