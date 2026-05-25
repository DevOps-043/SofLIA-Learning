import type { SavePlanSessionInsertRow } from './save-plan.types'
import {
  buildConflict,
  isBlockingSessionStatus,
  parseTime,
  windowsOverlap,
} from './save-plan-conflicts.time'
import type {
  ExistingStudySessionRow,
  SavePlanSessionConflict,
  SavePlanSupabaseClient,
} from './save-plan-conflicts.types'

export type { SavePlanSessionConflict } from './save-plan-conflicts.types'

export function findInPayloadSessionConflict(
  sessions: SavePlanSessionInsertRow[],
): SavePlanSessionConflict | null {
  const orderedSessions = [...sessions].sort(
    (left, right) => parseTime(left.start_time) - parseTime(right.start_time),
  )

  for (let index = 1; index < orderedSessions.length; index += 1) {
    const previousSession = orderedSessions[index - 1]
    const currentSession = orderedSessions[index]

    if (
      windowsOverlap(
        previousSession.start_time,
        previousSession.end_time,
        currentSession.start_time,
        currentSession.end_time,
      )
    ) {
      return buildConflict(currentSession, previousSession.title)
    }
  }

  return null
}

export async function findExistingStudySessionConflict(params: {
  supabase: SavePlanSupabaseClient
  userId: string
  sessions: SavePlanSessionInsertRow[]
}): Promise<SavePlanSessionConflict | null> {
  if (params.sessions.length === 0) {
    return null
  }

  const rangeStart = new Date(
    Math.min(...params.sessions.map((session) => parseTime(session.start_time))),
  ).toISOString()
  const rangeEnd = new Date(
    Math.max(...params.sessions.map((session) => parseTime(session.end_time))),
  ).toISOString()

  const { data, error } = await params.supabase
    .from('study_sessions')
    .select('id, plan_id, title, start_time, end_time, status')
    .eq('user_id', params.userId)
    .lt('start_time', rangeEnd)
    .gt('end_time', rangeStart)

  if (error) {
    throw new Error(`No se pudo validar conflictos con sesiones existentes: ${error.message}`)
  }

  const existingSessions = ((data || []) as ExistingStudySessionRow[])
    .filter((session) => isBlockingSessionStatus(session.status))

  for (const candidate of params.sessions) {
    const conflictingSession = existingSessions.find((session) =>
      windowsOverlap(
        candidate.start_time,
        candidate.end_time,
        session.start_time,
        session.end_time,
      ),
    )

    if (conflictingSession) {
      return buildConflict(
        candidate,
        conflictingSession.title || `sesion ${conflictingSession.id}`,
      )
    }
  }

  return null
}

export function formatSavePlanConflictError(conflict: SavePlanSessionConflict): string {
  return `La sesion "${conflict.candidateTitle}" se traslapa con "${conflict.conflictingTitle}" (${conflict.startTime} - ${conflict.endTime}). Ajusta el horario antes de guardar el plan.`
}
