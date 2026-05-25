import type { SessionMetricsPayload } from '../dashboard/chat/calendar.service'
import type {
  CreatedStudySessionRow,
  InvalidSavePlanSession,
  SavePlanSessionInput,
  SavePlanSessionInsertRow,
} from './save-plan.types'
import { resolveStudySessionTitle } from '../study-session-title.utils'

export function buildSessionsToInsert(params: {
  sessions: SavePlanSessionInput[]
  planId: string
  userId: string
  organizationId: string | null
}): {
  sessionsToInsert: SavePlanSessionInsertRow[]
  invalidSessions: InvalidSavePlanSession[]
} {
  const sessionsToInsert: SavePlanSessionInsertRow[] = []
  const invalidSessions: InvalidSavePlanSession[] = []

  for (let index = 0; index < params.sessions.length; index += 1) {
    const session = params.sessions[index]
    const missingFields: string[] = []

    if (!session.title || typeof session.title !== 'string' || session.title.trim() === '') {
      missingFields.push('title')
    }
    if (!session.startTime || typeof session.startTime !== 'string') {
      missingFields.push('startTime')
    }
    if (!session.endTime || typeof session.endTime !== 'string') {
      missingFields.push('endTime')
    }

    if (missingFields.length > 0) {
      invalidSessions.push({
        index: index + 1,
        reason: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
      })
      continue
    }

    let startDate: Date
    let endDate: Date

    try {
      startDate = new Date(session.startTime)
      endDate = new Date(session.endTime)

      if (Number.isNaN(startDate.getTime())) {
        invalidSessions.push({
          index: index + 1,
          reason: `startTime invalido: ${session.startTime}`,
        })
        continue
      }

      if (Number.isNaN(endDate.getTime())) {
        invalidSessions.push({
          index: index + 1,
          reason: `endTime invalido: ${session.endTime}`,
        })
        continue
      }

      if (endDate.getTime() <= startDate.getTime()) {
        invalidSessions.push({
          index: index + 1,
          reason: 'endTime debe ser posterior a startTime',
        })
        continue
      }
    } catch (dateError) {
      invalidSessions.push({
        index: index + 1,
        reason: `Error parseando fechas: ${dateError instanceof Error ? dateError.message : 'Error desconocido'}`,
      })
      continue
    }

    sessionsToInsert.push({
      organization_id: params.organizationId,
      plan_id: params.planId,
      user_id: params.userId,
      title: resolveStudySessionTitle(session).substring(0, 500),
      description: session.description ? session.description.substring(0, 2000) : null,
      course_id: session.courseId || null,
      lesson_id: session.lessonId || null,
      start_time: session.startTime,
      end_time: session.endTime,
      status: 'planned',
      is_ai_generated: session.isAiGenerated !== undefined ? session.isAiGenerated : true,
      session_type: session.sessionType || 'medium',
      metrics: {
        generationSource: session.isAiGenerated !== false ? 'ai_generated' : 'manual',
        clientReferenceId:
          typeof session.clientReferenceId === 'string' ? session.clientReferenceId : undefined,
        plannedCourseId: session.courseId || null,
        plannedLessonIds: Array.isArray(session.plannedLessons)
          ? session.plannedLessons
              .map((lesson) => lesson.lessonId)
              .filter((lessonId): lessonId is string => typeof lessonId === 'string' && lessonId.trim() !== '')
          : undefined,
        plannedLessonTitles: Array.isArray(session.plannedLessons)
          ? session.plannedLessons
              .map((lesson) => lesson.lessonTitle?.trim())
              .filter(
                (lessonTitle): lessonTitle is string =>
                  typeof lessonTitle === 'string' && lessonTitle !== '',
              )
          : undefined,
        plannedLessons: Array.isArray(session.plannedLessons)
          ? session.plannedLessons
          : undefined,
      } satisfies SessionMetricsPayload,
    })
  }

  return { sessionsToInsert, invalidSessions }
}

export function formatInvalidSessionsError(
  invalidSessions: InvalidSavePlanSession[],
): string {
  return invalidSessions.map((session) => `Sesion ${session.index}: ${session.reason}`).join('; ')
}

export function mapCreatedSessions(
  createdSessions: CreatedStudySessionRow[] | null | undefined,
) {
  return (
    createdSessions?.map((session) => ({
      id: session.id,
      clientReferenceId:
        typeof session.metrics?.clientReferenceId === 'string'
          ? session.metrics.clientReferenceId
          : undefined,
      startTime: session.start_time,
      endTime: session.end_time,
    })) || []
  )
}
