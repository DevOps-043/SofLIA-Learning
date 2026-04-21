import type { ActionResult } from '../types'
import { deleteStudyPlanForUser } from '../../../plan/plan-delete.server.service'

export async function executeDeletePlan(
  userId: string,
  planId: string,
  action: ActionResult,
): Promise<ActionResult> {
  const result = await deleteStudyPlanForUser({ userId, planId })

  if (result.status === 'not_found' || result.status === 'error') {
    return {
      ...action,
      status: 'error',
      message: result.error || 'No se pudo eliminar el plan de estudios.',
      data: {
        deletedSessions: result.deletedSessionsCount,
        deletedCalendarEvents: result.deletedCalendarEventsCount,
        calendarDeletionErrors: result.calendarDeletionErrors,
      },
    }
  }

  return {
    ...action,
    status: result.ok ? 'success' : 'error',
    message: result.ok
      ? `Plan de estudios eliminado. ${result.deletedSessionsCount} sesion(es) removida(s) del calendario y la base de datos. Ya puedes crear un nuevo plan para este taller.`
      : `El plan se elimino de la base de datos, pero quedaron ${result.calendarDeletionErrors} evento(s) pendientes en Google Calendar.`,
    data: {
      deletedSessions: result.deletedSessionsCount,
      deletedCalendarEvents: result.deletedCalendarEventsCount,
      calendarDeletionErrors: result.calendarDeletionErrors,
      calendarEventsNotFound: result.calendarEventsNotFound,
    },
  }
}
