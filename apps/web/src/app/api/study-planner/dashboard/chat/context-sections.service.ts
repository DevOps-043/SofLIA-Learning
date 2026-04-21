import { resolveSessionCalendarSync } from './calendar.service'
import { isWorkBlockEvent } from './analysis-slots.service'
import {
  formatDate,
  formatPreferredDays,
  formatTime,
  translateStatus,
} from './format.utils'
import { getSessionLessonSummary } from './context-prompt.service'
import type { CalendarEvent, SyncResult } from './types'

export { buildProactiveAnalysisSection } from './context-proactive-section.service'

interface ContextPlan {
  id: string
  name: string
  description: string | null
  timezone: string | null
  preferred_days: number[]
}

interface ContextSession {
  id: string
  title: string
  start_time: string
  end_time: string
  duration_minutes: number | null
  status: string
  external_event_id: string | null
  calendar_provider: string | null
  metrics: unknown
  plan_id: string
}

interface ContextPlanReference {
  id: string
  name: string
}

export function buildOrphanedSessionsAlertSection(
  syncResult: SyncResult | undefined,
): string {
  if (!syncResult || syncResult.orphanedSessions.length === 0) {
    return ''
  }

  return `## CAMBIOS DETECTADOS EN EL CALENDARIO
Se detecto que estas sesiones del plan ya no tienen un vinculo valido con el calendario:
${syncResult.orphanedSessions.map((session) => `- "${session}"`).join('\n')}

IMPORTANTE:
1. Estas sesiones NO fueron eliminadas automaticamente del sistema.
2. Debes preguntarle al usuario si quiere eliminarlas, reprogramarlas o resincronizar el plan.
`
}

export function buildCalendarEventsTodaySection(
  events: CalendarEvent[],
  provider?: 'google' | 'microsoft' | null,
): string {
  const providerLabel =
    provider === 'microsoft'
      ? 'Microsoft Calendar'
      : provider === 'google'
        ? 'Google Calendar'
        : 'calendario externo'

  const lines = [`## EVENTOS DEL CALENDARIO EXTERNO - HOY (${providerLabel})`]

  if (events.length === 0) {
    lines.push(`No hay eventos programados para hoy en ${providerLabel}.`)
    return lines.join('\n')
  }

  for (const event of events) {
    const typeLabel = event.isStudySession ? '[estudio]' : '[evento]'
    const timeStr = event.isAllDay
      ? 'Todo el dia'
      : `${formatTime(new Date(event.start))} - ${formatTime(new Date(event.end))}`

    lines.push(`- ${typeLabel} ${event.title} (${timeStr}) [ID: ${event.id}]`)
  }

  return lines.join('\n')
}

export function buildCoverageFallbackSection(): string {
  return `## COBERTURA DETERMINISTICA DEL PLAN
No se pudo verificar la cobertura del plan. No inventes conteos de lecciones.`
}

export function buildPlanOverviewSection(plan: ContextPlan): string {
  return `## PLAN DE ESTUDIOS ACTIVO
- Nombre: ${plan.name}
- Descripcion: ${plan.description || 'Sin descripcion'}
- Zona horaria: ${plan.timezone || 'America/Mexico_City'}
- Dias preferidos: ${formatPreferredDays(plan.preferred_days || [])}`
}

export function buildSessionsSection(sessions: ContextSession[]): string {
  const lines = ['## SESIONES DE ESTUDIO PROXIMAS (consulta en tiempo real a la BD)']

  if (sessions.length === 0) {
    lines.push(
      'IMPORTANTE: No hay sesiones de estudio programadas en este plan para las proximas semanas.',
    )
    return lines.join('\n')
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  sessions.forEach((session, index) => {
    const startDate = new Date(session.start_time)
    const endDate = new Date(session.end_time)
    const sessionDay = new Date(startDate)
    sessionDay.setHours(0, 0, 0, 0)

    let dayLabel = ''
    if (sessionDay.getTime() === today.getTime()) {
      dayLabel = ' [HOY]'
    } else if (sessionDay.getTime() === tomorrow.getTime()) {
      dayLabel = ' [MANANA]'
    }

    const lessonSummary = getSessionLessonSummary(session.title, session.metrics)
    const calendarSync = resolveSessionCalendarSync({
      externalEventId: session.external_event_id,
      calendarProvider: session.calendar_provider,
      metrics: session.metrics,
    })

    lines.push(`${index + 1}. ${session.title}${dayLabel}`)
    lines.push(`   - ID: ${session.id}`)
    lines.push(`   - Fecha: ${formatDate(startDate)}`)
    lines.push(`   - Hora: ${formatTime(startDate)} - ${formatTime(endDate)}`)
    lines.push(`   - Duracion: ${session.duration_minutes || 'N/A'} minutos`)
    lines.push(`   - Estado: ${translateStatus(session.status)}`)

    if (lessonSummary.lessonTitles.length > 0) {
      lines.push(`   - Lecciones del plan: ${lessonSummary.lessonTitles.join(' | ')}`)
    }

    lines.push(
      `   - Estado calendario: ${
        calendarSync?.externalEventId
          ? `Sincronizada (${calendarSync.provider || 'google'}${calendarSync.calendarId ? `, calendario ${calendarSync.calendarId}` : ''})`
          : 'Sin vinculo con calendario externo'
      }`,
    )

    if (
      lessonSummary.totalMinutes
      && session.duration_minutes
      && lessonSummary.totalMinutes !== session.duration_minutes
    ) {
      lines.push(`   - Tiempo total estimado asociado: ${lessonSummary.totalMinutes} minutos`)
    }
  })

  lines.push(`TOTAL: ${sessions.length} sesiones de estudio programadas en este plan.`)
  return lines.join('\n')
}

export function buildOtherPlansSection(
  otherSessions: ContextSession[],
  allUserPlans: ContextPlanReference[],
): string {
  if (otherSessions.length === 0) {
    return ''
  }

  const lines = ['## SESIONES DE OTROS PLANES (bloquean disponibilidad)']

  for (const session of otherSessions) {
    const planName =
      allUserPlans.find((plan) => plan.id === session.plan_id)?.name || 'Otro plan'
    const startDate = new Date(session.start_time)
    lines.push(
      `- ${session.title} [Plan: ${planName}] (${formatDate(startDate)} ${formatTime(startDate)})`,
    )
  }

  return lines.join('\n')
}

export function buildCalendarLoadSections(events: CalendarEvent[]): string[] {
  const workBlockEvents = events.filter(
    (event) => !event.isStudySession && isWorkBlockEvent(event),
  )
  const otherEvents = events.filter(
    (event) => !event.isStudySession && !isWorkBlockEvent(event),
  )
  const sections: string[] = []

  if (workBlockEvents.length > 0) {
    const lines = [
      '## BLOQUES DE TRABAJO DEL USUARIO (horario laboral)',
      'Las sesiones de estudio dentro de estos bloques son comportamiento correcto. No son conflictos.',
    ]

    for (const event of workBlockEvents) {
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)
      lines.push(
        `- ${event.title} - ${formatDate(startDate)}, ${formatTime(startDate)} - ${formatTime(endDate)} [ID: ${event.id}]`,
      )
    }

    sections.push(lines.join('\n'))
  }

  if (otherEvents.length > 0) {
    const lines = ['## OTROS EVENTOS DE LA SEMANA (pueden generar conflictos reales)']
    for (const event of otherEvents.slice(0, 10)) {
      const eventDate = new Date(event.start)
      const timeStr = event.isAllDay ? 'Todo el dia' : formatTime(eventDate)
      lines.push(`- ${event.title} - ${formatDate(eventDate)} ${timeStr} [ID: ${event.id}]`)
    }
    sections.push(lines.join('\n'))
  }

  return sections
}
