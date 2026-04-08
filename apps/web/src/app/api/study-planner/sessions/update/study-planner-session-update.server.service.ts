import { createAdminClient } from '@/lib/supabase/admin'
import { syncSessionWithCalendar } from '../../dashboard/chat/calendar.service'
import {
  getOwnedStudyPlan,
  getStudySessionsForPlan,
  updateStudySessionTimeWindow,
} from './study-planner-session-update.db'
import {
  buildStudyPlannerSessionLookup,
  buildUpdatedSessionWindow,
  findMatchingStudySession,
  parseOriginalSessionReference,
  parseSessionTime,
  parseSessionUpdateDate,
} from './study-planner-session-update.utils'
import type {
  StudyPlannerSessionUpdateRecord,
  UpdateSessionRequest,
  UpdateStudyPlannerSessionsServiceResult,
} from './study-planner-session-update.types'

interface UpdateStudyPlannerSessionsForUserParams {
  userId: string
  request: UpdateSessionRequest
}

function buildInvalidOriginalReferenceError(
  originalStartTime: string,
): string {
  return `Formato de hora invalido: ${originalStartTime}`
}

function buildInvalidUpdatedWindowError(
  dateStr: string,
  newStartTime: string,
  newEndTime: string,
): string {
  const hasValidDate = Boolean(parseSessionUpdateDate(dateStr))
  const hasValidStartTime = Boolean(parseSessionTime(newStartTime))
  const hasValidEndTime = Boolean(parseSessionTime(newEndTime))

  if (!hasValidDate || !hasValidStartTime || !hasValidEndTime) {
    return `Formato de hora invalido: ${newStartTime} o ${newEndTime}`
  }

  return `Hora de fin debe ser posterior a hora de inicio para ${dateStr}`
}

function windowsOverlap(
  leftStartIso: string,
  leftEndIso: string,
  rightStartIso: string,
  rightEndIso: string,
): boolean {
  return (
    new Date(leftStartIso).getTime() < new Date(rightEndIso).getTime() &&
    new Date(rightStartIso).getTime() < new Date(leftEndIso).getTime()
  )
}

function findOverlappingSession(
  sessionsById: Map<string, StudyPlannerSessionUpdateRecord>,
  sessionId: string,
  startTimeIso: string,
  endTimeIso: string,
): StudyPlannerSessionUpdateRecord | null {
  for (const candidate of sessionsById.values()) {
    if (candidate.id === sessionId) {
      continue
    }

    if (
      windowsOverlap(
        startTimeIso,
        endTimeIso,
        candidate.start_time,
        candidate.end_time,
      )
    ) {
      return candidate
    }
  }

  return null
}

export async function updateStudyPlannerSessionsForUser(
  params: UpdateStudyPlannerSessionsForUserParams,
): Promise<UpdateStudyPlannerSessionsServiceResult> {
  const supabase = createAdminClient()
  const plan = await getOwnedStudyPlan(
    supabase,
    params.request.planId,
    params.userId,
  )

  if (!plan) {
    return { kind: 'plan_not_found' }
  }

  const sessions = await getStudySessionsForPlan(
    supabase,
    params.request.planId,
    params.userId,
  )

  if (sessions.length === 0) {
    return { kind: 'no_sessions' }
  }

  const lookup = buildStudyPlannerSessionLookup(sessions)
  const plannedSessionsById = new Map(
    sessions.map((session) => [session.id, { ...session }]),
  )
  let updatedCount = 0
  const errors: string[] = []
  const updatedSessions = new Map<
    string,
    {
      id: string
      clientReferenceId?: string
      title?: string
      startTime: string
      endTime: string
    }
  >()

  for (const update of params.request.updates) {
    try {
      const originalReference = parseOriginalSessionReference(update)

      if (!originalReference && !update.sessionId) {
        errors.push(buildInvalidOriginalReferenceError(update.originalStartTime))
        continue
      }

      const matchingSession = originalReference
        ? findMatchingStudySession(lookup, update, originalReference)
        : update.sessionId
          ? lookup.sessionsById.get(update.sessionId) ?? null
          : null

      if (!matchingSession) {
        errors.push(
          `No se encontro sesion para ${update.dateStr} a las ${update.originalStartTime}`,
        )
        continue
      }

      const updatedWindow = buildUpdatedSessionWindow(update)

      if (!updatedWindow) {
        errors.push(
          buildInvalidUpdatedWindowError(
            update.dateStr,
            update.newStartTime,
            update.newEndTime,
          ),
        )
        continue
      }

      const nextStartIso = updatedWindow.startDateTime.toISOString()
      const nextEndIso = updatedWindow.endDateTime.toISOString()
      const overlappingSession = findOverlappingSession(
        plannedSessionsById,
        matchingSession.id,
        nextStartIso,
        nextEndIso,
      )

      if (overlappingSession) {
        errors.push(
          `La sesion ${matchingSession.title || matchingSession.id} se traslapa con ${overlappingSession.title || overlappingSession.id}`,
        )
        continue
      }

      await updateStudySessionTimeWindow(
        supabase,
        matchingSession.id,
        params.userId,
        nextStartIso,
        nextEndIso,
      )

      const calendarSyncResult = await syncSessionWithCalendar(
        params.userId,
        matchingSession.id,
        'update',
        {
          start_time: nextStartIso,
          end_time: nextEndIso,
        },
      )

      if (!calendarSyncResult.success) {
        errors.push(
          `Sesion ${matchingSession.id} actualizada en base de datos pero no sincronizada con calendario: ${calendarSyncResult.message || 'Error desconocido'}`,
        )
      }

      plannedSessionsById.set(matchingSession.id, {
        ...matchingSession,
        start_time: nextStartIso,
        end_time: nextEndIso,
      })
      updatedSessions.set(matchingSession.id, {
        id: matchingSession.id,
        clientReferenceId: matchingSession.client_reference_id,
        title: matchingSession.title,
        startTime: nextStartIso,
        endTime: nextEndIso,
      })
      updatedCount += 1
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error desconocido'
      errors.push(`Error procesando ${update.dateStr}: ${message}`)
    }
  }

  return {
    kind: 'updated',
    updatedCount,
    totalUpdates: params.request.updates.length,
    errors,
    updatedSessions: Array.from(updatedSessions.values()),
  }
}
