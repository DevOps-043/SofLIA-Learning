import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service'
import {
  createAdminClient,
  normalizeCalendarEventId,
  parseSessionMetrics,
  resolveSessionCalendarSync,
} from './calendar.service'

interface SessionPlannedLesson {
  lessonId?: string
  lessonTitle?: string
  courseId?: string
  courseTitle?: string
  durationMinutes?: number
}

interface SessionMetricsPayload {
  plannedLessonTitles?: string[]
  plannedLessons?: SessionPlannedLesson[]
  calendarSync?: {
    provider?: string
    calendarId?: string | null
    externalEventId?: string
    normalizedExternalEventId?: string
    source?: string
    lastSyncedAt?: string
  } | null
}

function formatSelectedCalendarIds(selectedCalendarIds: string[] | null): string {
  if (!selectedCalendarIds || selectedCalendarIds.length === 0) {
    return 'solo principal (sin configurar)'
  }

  return selectedCalendarIds.join(', ')
}

export function getSessionLessonSummary(
  sessionTitle: string,
  metrics: unknown,
): { lessonTitles: string[]; totalMinutes: number | null } {
  const parsedMetrics = parseSessionMetrics(metrics) as SessionMetricsPayload | null
  const plannedLessons = parsedMetrics?.plannedLessons || []
  const plannedLessonTitles = parsedMetrics?.plannedLessonTitles || []

  const lessonTitles = Array.from(
    new Set([
      ...plannedLessons
        .map((lesson) => lesson.lessonTitle?.trim())
        .filter((value): value is string => Boolean(value)),
      ...plannedLessonTitles
        .map((title) => title?.trim())
        .filter((value): value is string => Boolean(value)),
    ]),
  ).filter((title) => title !== sessionTitle)

  const totalMinutes = plannedLessons.reduce((sum, lesson) => {
    return sum + (typeof lesson.durationMinutes === 'number' ? lesson.durationMinutes : 0)
  }, 0)

  return {
    lessonTitles,
    totalMinutes: totalMinutes > 0 ? totalMinutes : null,
  }
}

export async function getStudySessionEventIds(
  supabase: ReturnType<typeof createAdminClient>,
  userId: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from('study_sessions')
    .select('external_event_id, metrics')
    .eq('user_id', userId)
    .not('external_event_id', 'is', null)

  const ids = new Set<string>()
  for (const row of data ?? []) {
    const calendarSync = resolveSessionCalendarSync({
      externalEventId: row.external_event_id,
      metrics: row.metrics,
    })
    const normalizedId = normalizeCalendarEventId(
      calendarSync?.normalizedExternalEventId || row.external_event_id,
    )
    if (normalizedId) {
      ids.add(normalizedId)
    }
  }

  return ids
}

export async function buildCalendarListContext(params: {
  accessToken: string
  provider: 'google' | 'microsoft'
  selectedCalendarIds: string[] | null
}): Promise<string> {
  const { accessToken, provider, selectedCalendarIds } = params
  const currentSelection = formatSelectedCalendarIds(selectedCalendarIds)

  if (provider === 'google') {
    const calendars = await CalendarIntegrationService.getGoogleCalendarList(accessToken)
    if (calendars.length === 0) {
      return ''
    }

    let context = '\n## CALENDARIOS DISPONIBLES DEL USUARIO (Google)\n'
    context += `Seleccion actual: ${currentSelection}\n`

    for (const cal of calendars) {
      const isSelected = selectedCalendarIds ? selectedCalendarIds.includes(cal.id) : cal.primary
      context += `- ${isSelected ? '[seleccionado]' : '[no seleccionado]'} "${cal.summary}" (ID: ${cal.id})${cal.primary ? ' [PRINCIPAL]' : ''}\n`
    }

    context += '\nEl usuario puede pedirte que cambies que calendarios se consideran para su disponibilidad. Usa la accion update_calendar_selection con los IDs deseados. SIEMPRE debe quedar al menos 1 calendario seleccionado.\n'
    return context
  }

  const calendars = await CalendarIntegrationService.getMicrosoftCalendarList(accessToken)
  if (calendars.length === 0) {
    return ''
  }

  let context = '\n## CALENDARIOS DISPONIBLES DEL USUARIO (Microsoft)\n'
  context += `Seleccion actual: ${currentSelection}\n`

  for (const cal of calendars) {
    const isSelected = selectedCalendarIds ? selectedCalendarIds.includes(cal.id) : cal.isDefaultCalendar
    context += `- ${isSelected ? '[seleccionado]' : '[no seleccionado]'} "${cal.name}" (ID: ${cal.id})${cal.isDefaultCalendar ? ' [PRINCIPAL]' : ''}\n`
  }

  context += '\nEl usuario puede pedirte que cambies que calendarios se consideran para su disponibilidad. Usa la accion update_calendar_selection con los IDs deseados. SIEMPRE debe quedar al menos 1 calendario seleccionado.\n'
  return context
}
