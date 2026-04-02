import { createAdminClient } from '@/lib/supabase/admin'
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
  let updatedCount = 0
  const errors: string[] = []

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

      await updateStudySessionTimeWindow(
        supabase,
        matchingSession.id,
        params.userId,
        updatedWindow.startDateTime.toISOString(),
        updatedWindow.endDateTime.toISOString(),
      )

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
  }
}
