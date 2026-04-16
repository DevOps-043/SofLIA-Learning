import {
  getOwnedStudyPlan,
  getStudySessionsForPlan,
} from '../../sessions/update/study-planner-session-update.db'
import {
  buildStudyPlannerSessionLookup,
} from '../../sessions/update/study-planner-session-update.utils'
import {
  updateStudyPlannerSessionsForUser,
} from '../../sessions/update/study-planner-session-update.server.service'
import type { SessionUpdateInput } from '../../sessions/update/study-planner-session-update.types'
import type {
  StudyPlanApplyPatchRequest,
  StudyPlanPatchOperation,
} from './study-plan-apply-patch.types'
import { createAdminClient } from '@/lib/supabase/admin'

function toLocalDateStr(isoDate: string): string {
  const date = new Date(isoDate)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function toLocalTimeStr(isoDate: string): string {
  const date = new Date(isoDate)
  const hours = `${date.getHours()}`.padStart(2, '0')
  const minutes = `${date.getMinutes()}`.padStart(2, '0')
  return `${hours}:${minutes}`
}

function buildUpdateFromResolvedSession(params: {
  session: {
    id: string
    client_reference_id?: string
    start_time: string
    end_time: string
  }
  dateStr: string
  newStartTime: string
  newEndTime: string
}): SessionUpdateInput {
  return {
    sessionId: params.session.id,
    clientReferenceId: params.session.client_reference_id,
    dateStr: params.dateStr,
    originalStartTime: toLocalTimeStr(params.session.start_time),
    newStartTime: params.newStartTime,
    newEndTime: params.newEndTime,
  }
}

function expandPatchOperationToUpdates(
  operation: StudyPlanPatchOperation,
  sessions: Awaited<ReturnType<typeof getStudySessionsForPlan>>,
): SessionUpdateInput[] {
  const lookup = buildStudyPlannerSessionLookup(sessions)

  if (operation.type === 'move_day') {
    return sessions
      .filter((session) => toLocalDateStr(session.start_time) === operation.sourceDate)
      .filter((session) => {
        if (operation.sessionIds?.length) {
          return operation.sessionIds.includes(session.id)
        }
        if (operation.clientReferenceIds?.length) {
          return (
            !!session.client_reference_id &&
            operation.clientReferenceIds.includes(session.client_reference_id)
          )
        }
        return true
      })
      .map((session) =>
        buildUpdateFromResolvedSession({
          session,
          dateStr: operation.targetDate,
          newStartTime: toLocalTimeStr(session.start_time),
          newEndTime: toLocalTimeStr(session.end_time),
        }),
      )
  }

  const session =
    (operation.sessionId
      ? lookup.sessionsById.get(operation.sessionId)
      : undefined) ||
    (operation.clientReferenceId
      ? lookup.sessionsByClientReferenceId.get(operation.clientReferenceId)
      : undefined)

  if (!session) {
    return []
  }

  if (operation.type === 'move_session') {
    return [
      buildUpdateFromResolvedSession({
        session,
        dateStr: operation.targetDate,
        newStartTime: operation.targetStartTime,
        newEndTime: operation.targetEndTime,
      }),
    ]
  }

  return [
    buildUpdateFromResolvedSession({
      session,
      dateStr: operation.dateStr || toLocalDateStr(session.start_time),
      newStartTime: operation.targetStartTime,
      newEndTime: operation.targetEndTime,
    }),
  ]
}

export async function applyStudyPlanPatchForUser(params: {
  userId: string
  request: StudyPlanApplyPatchRequest
}) {
  const supabase = createAdminClient()
  const plan = await getOwnedStudyPlan(
    supabase,
    params.request.planId,
    params.userId,
  )

  if (!plan) {
    return { kind: 'plan_not_found' as const }
  }

  const sessions = await getStudySessionsForPlan(
    supabase,
    params.request.planId,
    params.userId,
  )

  if (sessions.length === 0) {
    return { kind: 'no_sessions' as const }
  }

  const updates = params.request.operations.flatMap((operation) =>
    expandPatchOperationToUpdates(operation, sessions),
  )

  if (updates.length === 0) {
    return {
      kind: 'updated' as const,
      updatedCount: 0,
      totalUpdates: 0,
      errors: ['No se encontraron sesiones objetivo para aplicar el patch'],
      updatedSessions: [],
    }
  }

  return updateStudyPlannerSessionsForUser({
    userId: params.userId,
    request: {
      planId: params.request.planId,
      updates,
    },
  })
}
