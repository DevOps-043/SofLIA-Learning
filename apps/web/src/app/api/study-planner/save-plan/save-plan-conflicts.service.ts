import type { createAdminClient } from './save-plan-organization.service'
import type { SavePlanSessionInsertRow } from './save-plan.types'

type SavePlanSupabaseClient = ReturnType<typeof createAdminClient>

interface ExistingStudySessionRow {
  id: string
  plan_id: string | null
  title: string | null
  start_time: string
  end_time: string
  status: string | null
}

export interface SavePlanSessionConflict {
  candidateTitle: string
  conflictingTitle: string
  startTime: string
  endTime: string
}

function parseTime(value: string): number {
  return new Date(value).getTime()
}

function windowsOverlap(
  leftStartIso: string,
  leftEndIso: string,
  rightStartIso: string,
  rightEndIso: string,
): boolean {
  return parseTime(leftStartIso) < parseTime(rightEndIso)
    && parseTime(rightStartIso) < parseTime(leftEndIso)
}

function isBlockingSessionStatus(status: string | null): boolean {
  return !status || !['cancelled', 'canceled', 'deleted'].includes(status)
}

function buildConflict(
  candidate: Pick<SavePlanSessionInsertRow, 'title' | 'start_time' | 'end_time'>,
  conflictingTitle: string,
): SavePlanSessionConflict {
  return {
    candidateTitle: candidate.title,
    conflictingTitle,
    startTime: candidate.start_time,
    endTime: candidate.end_time,
  }
}

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
