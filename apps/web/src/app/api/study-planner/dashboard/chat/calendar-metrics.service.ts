import type { Database } from '../../../../../lib/supabase/types'
import { createAdminClient } from './calendar-access.service'

export interface SessionCalendarSyncMetadata {
  provider: 'google' | 'microsoft'
  calendarId?: string | null
  externalEventId: string
  normalizedExternalEventId: string
  source: 'save_plan' | 'sync' | 'manual_action' | 'resync'
  lastSyncedAt: string
}

export interface SessionMetricsPayload {
  clientReferenceId?: string
  plannedCourseId?: string | null
  plannedLessonIds?: string[]
  plannedLessonTitles?: string[]
  plannedLessons?: Array<{
    courseId?: string
    courseTitle?: string
    lessonId?: string
    lessonTitle?: string
    lessonOrderIndex?: number
    moduleOrderIndex?: number
    moduleTitle?: string
    durationMinutes?: number
  }>
  calendarSync?: SessionCalendarSyncMetadata | null
}

export interface StudySessionCalendarLinkRecord {
  id: string
  plan_id?: string | null
  external_event_id?: string | null
  calendar_provider?: 'google' | 'microsoft' | null
  metrics?: SessionMetricsPayload | null
}

export function normalizeCalendarEventId(eventId: string | null | undefined): string {
  if (!eventId) {
    return ''
  }

  return String(eventId).trim()
}

export function parseSessionMetrics(metrics: unknown): SessionMetricsPayload | null {
  if (!metrics || typeof metrics !== 'object' || Array.isArray(metrics)) {
    return null
  }

  return metrics as SessionMetricsPayload
}

export function resolveSessionCalendarSync(params: {
  externalEventId?: string | null
  calendarProvider?: 'google' | 'microsoft' | null
  metrics?: unknown
}): SessionCalendarSyncMetadata | null {
  const parsedMetrics = parseSessionMetrics(params.metrics)
  const metricsSync = parsedMetrics?.calendarSync || null

  if (metricsSync?.externalEventId && metricsSync.provider) {
    return {
      ...metricsSync,
      normalizedExternalEventId:
        metricsSync.normalizedExternalEventId
        || normalizeCalendarEventId(metricsSync.externalEventId),
      calendarId: metricsSync.calendarId || null,
      source: metricsSync.source || 'sync',
      lastSyncedAt: metricsSync.lastSyncedAt || new Date().toISOString(),
    }
  }

  if (params.externalEventId && params.calendarProvider) {
    return {
      provider: params.calendarProvider,
      externalEventId: params.externalEventId,
      normalizedExternalEventId: normalizeCalendarEventId(params.externalEventId),
      calendarId: null,
      source: 'sync',
      lastSyncedAt: new Date().toISOString(),
    }
  }

  return null
}

function mergeSessionMetricsWithCalendarSync(params: {
  existingMetrics?: unknown
  eventId: string
  provider: 'google' | 'microsoft'
  calendarId?: string | null
  source?: SessionCalendarSyncMetadata['source']
}): SessionMetricsPayload {
  const parsedMetrics = parseSessionMetrics(params.existingMetrics) || {}

  return {
    ...parsedMetrics,
    calendarSync: {
      provider: params.provider,
      calendarId: params.calendarId || null,
      externalEventId: params.eventId,
      normalizedExternalEventId: normalizeCalendarEventId(params.eventId),
      source: params.source || 'sync',
      lastSyncedAt: new Date().toISOString(),
    },
  }
}

export function buildSessionCalendarSyncPatch(params: {
  eventId: string
  provider: 'google' | 'microsoft'
  calendarId?: string | null
  existingMetrics?: unknown
  source?: SessionCalendarSyncMetadata['source']
}): Pick<
  Database['public']['Tables']['study_sessions']['Update'],
  'external_event_id' | 'calendar_provider' | 'updated_at' | 'metrics'
> {
  return {
    external_event_id: params.eventId,
    calendar_provider: params.provider,
    metrics: mergeSessionMetricsWithCalendarSync({
      existingMetrics: params.existingMetrics,
      eventId: params.eventId,
      provider: params.provider,
      calendarId: params.calendarId,
      source: params.source,
    }),
    updated_at: new Date().toISOString(),
  }
}

export async function persistSessionCalendarSync(params: {
  supabase?: ReturnType<typeof createAdminClient>
  sessionId: string
  eventId: string
  provider: 'google' | 'microsoft'
  calendarId?: string | null
  source?: SessionCalendarSyncMetadata['source']
  existingSession?: StudySessionCalendarLinkRecord | null
}): Promise<void> {
  const supabase = params.supabase ?? createAdminClient()
  const sessionRecord =
    params.existingSession
    || (
      await supabase
        .from('study_sessions')
        .select('id, plan_id, external_event_id, calendar_provider, metrics')
        .eq('id', params.sessionId)
        .single()
    ).data

  const { error } = await supabase
    .from('study_sessions')
    .update(
      buildSessionCalendarSyncPatch({
        eventId: params.eventId,
        provider: params.provider,
        calendarId: params.calendarId,
        existingMetrics: sessionRecord?.metrics,
        source: params.source,
      }),
    )
    .eq('id', params.sessionId)

  if (error) {
    throw new Error(`Error guardando sincronizacion de calendario: ${error.message}`)
  }
}
