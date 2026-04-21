import { logger } from '../../../../lib/utils/logger'
import {
  createAdminClient,
  getCalendarAccessToken,
} from '../dashboard/chat/calendar.service'
import {
  deleteGooglePlanEvent,
  deleteMicrosoftCalendarEvent,
  resolveDeletePlanExternalEvent,
} from './plan-delete-calendar.service'
import type {
  DeletePlanExecutionResult,
  DeletePlanSessionRow,
} from './plan-delete.types'

async function deleteExternalCalendarEvents(params: {
  userId: string
  sessions: DeletePlanSessionRow[]
}): Promise<Pick<
  DeletePlanExecutionResult,
  'deletedCalendarEventsCount' | 'calendarDeletionErrors' | 'calendarEventsNotFound'
>> {
  const sessionsWithEvents = params.sessions.filter((session) =>
    Boolean(
      resolveDeletePlanExternalEvent({
        externalEventId: session.external_event_id,
        calendarProvider: session.calendar_provider,
        metrics: session.metrics,
      }).externalEventId,
    ),
  )

  if (sessionsWithEvents.length === 0) {
    return {
      deletedCalendarEventsCount: 0,
      calendarDeletionErrors: 0,
      calendarEventsNotFound: 0,
    }
  }

  const { accessToken, provider, calendarId } = await getCalendarAccessToken(params.userId)

  if (!accessToken || !provider) {
    return {
      deletedCalendarEventsCount: 0,
      calendarDeletionErrors: 0,
      calendarEventsNotFound: 0,
    }
  }

  let deletedCalendarEventsCount = 0
  let calendarDeletionErrors = 0
  let calendarEventsNotFound = 0

  for (const session of sessionsWithEvents) {
    const resolved = resolveDeletePlanExternalEvent({
      externalEventId: session.external_event_id,
      calendarProvider: session.calendar_provider,
      metrics: session.metrics,
    })

    if (!resolved.externalEventId) {
      continue
    }

    try {
      if (resolved.provider === 'microsoft') {
        const deletion = await deleteMicrosoftCalendarEvent(accessToken, resolved.externalEventId)
        if (deletion.notFound) {
          calendarEventsNotFound += 1
        } else {
          deletedCalendarEventsCount += 1
        }
        continue
      }

      const deleted = await deleteGooglePlanEvent({
        accessToken,
        externalEventId: resolved.externalEventId,
        calendarId: resolved.calendarId || calendarId,
        sessionId: session.id,
      })

      if (deleted) {
        deletedCalendarEventsCount += 1
      } else {
        calendarDeletionErrors += 1
      }
    } catch (error) {
      logger.error('deleteStudyPlanForUser: error deleting calendar event', {
        error,
        sessionId: session.id,
        externalEventId: resolved.externalEventId,
        provider: resolved.provider,
      })
      calendarDeletionErrors += 1
    }
  }

  return {
    deletedCalendarEventsCount,
    calendarDeletionErrors,
    calendarEventsNotFound,
  }
}

export async function deleteStudyPlanForUser(params: {
  userId: string
  planId: string
}): Promise<DeletePlanExecutionResult> {
  const supabase = createAdminClient()

  const { data: plan, error: planError } = await supabase
    .from('study_plans')
    .select('id')
    .eq('id', params.planId)
    .eq('user_id', params.userId)
    .single()

  if (planError || !plan) {
    logger.error('deleteStudyPlanForUser: plan not found or unauthorized', {
      error: planError,
      planId: params.planId,
      userId: params.userId,
    })
    return {
      ok: false,
      status: 'not_found',
      error: 'Plan no encontrado o no autorizado',
      deletedSessionsCount: 0,
      deletedCalendarEventsCount: 0,
      calendarDeletionErrors: 0,
      calendarEventsNotFound: 0,
    }
  }

  const { data: sessions, error: sessionsFetchError } = await supabase
    .from('study_sessions')
    .select('id, external_event_id, calendar_provider, metrics')
    .eq('plan_id', plan.id)

  if (sessionsFetchError) {
    logger.error('deleteStudyPlanForUser: error fetching sessions', sessionsFetchError)
  }

  const calendarDeletion = await deleteExternalCalendarEvents({
    userId: params.userId,
    sessions: sessions || [],
  })

  await Promise.allSettled([
    supabase.from('calendar_sync_history').delete().eq('plan_id', plan.id),
    supabase.from('lesson_tracking').delete().eq('plan_id', plan.id),
    ...(sessions && sessions.length > 0
      ? [supabase.from('lesson_tracking').delete().in('session_id', sessions.map((session) => session.id))]
      : []),
  ])

  const { error: sessionsError, count: deletedSessionsCount } = await supabase
    .from('study_sessions')
    .delete({ count: 'exact' })
    .eq('plan_id', plan.id)

  if (sessionsError) {
    logger.error('deleteStudyPlanForUser: error deleting sessions', sessionsError)
    return {
      ok: false,
      status: 'error',
      error: `Error al eliminar las sesiones: ${sessionsError.message}`,
      planId: plan.id,
      deletedSessionsCount: 0,
      ...calendarDeletion,
    }
  }

  const { error: deleteError } = await supabase
    .from('study_plans')
    .delete()
    .eq('id', plan.id)

  if (deleteError) {
    logger.error('deleteStudyPlanForUser: error deleting plan', deleteError)
    return {
      ok: false,
      status: 'error',
      error: `Error al eliminar el plan: ${deleteError.message}`,
      planId: plan.id,
      deletedSessionsCount: deletedSessionsCount || 0,
      ...calendarDeletion,
    }
  }

  return {
    ok: calendarDeletion.calendarDeletionErrors === 0,
    status: 'success',
    planId: plan.id,
    deletedSessionsCount: deletedSessionsCount || 0,
    ...calendarDeletion,
  }
}
