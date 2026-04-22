import { createAdminClient, syncSessionWithCalendar } from '../calendar.service'
import { logger } from '../../../../../../lib/utils/logger'
import type { ActionResult } from '../types'
import { validateStrictLessonOrder } from './lesson-order-guardrails.service'
import { validatePlacementAgainstCalendarRules } from './scheduling-guardrails.service'
import { withTimezoneOffset } from './planning-actions-v2-timezone.service'

export async function executeRebalancePlanV2(
  userId: string,
  planId: string,
  action: ActionResult,
  userMessage?: string,
): Promise<ActionResult> {
  const supabase = createAdminClient()
  const { sessionsToMove } = (action.data || {}) as {
    sessionsToMove?: Array<{
      sessionId: string
      newStartTime: string
      newEndTime: string
    }>
  }

  if (!sessionsToMove || sessionsToMove.length === 0) {
    return {
      ...action,
      status: 'error',
      message: 'No se especificaron sesiones para rebalancear de forma segura.',
    }
  }

  const orderValidation = await validateStrictLessonOrder({
    userId,
    planId,
    proposedMoves: sessionsToMove.map((sessionMove) => ({
      sessionId: sessionMove.sessionId,
      newStartTime: withTimezoneOffset(sessionMove.newStartTime),
    })),
  })

  if (!orderValidation.valid) {
    return {
      ...action,
      status: 'error',
      code: orderValidation.code,
      message: orderValidation.message,
    }
  }

  const results: Array<{ sessionId: string; success: boolean }> = []
  const appliedIds = new Set<string>()

  for (const sessionMove of sessionsToMove) {
    const startTimeISO = withTimezoneOffset(sessionMove.newStartTime)
    const endTimeISO = withTimezoneOffset(sessionMove.newEndTime)

    if (appliedIds.has(sessionMove.sessionId)) {
      results.push({ sessionId: sessionMove.sessionId, success: false })
      continue
    }

    const placementValidation = await validatePlacementAgainstCalendarRules({
      userId,
      sessionId: sessionMove.sessionId,
      startTimeIso: startTimeISO,
      endTimeIso: endTimeISO,
      userMessage,
    })

    if (!placementValidation.valid) {
      logger.warn(
        `Rebalance rechazado para ${sessionMove.sessionId}: ${placementValidation.message}`,
      )
      results.push({ sessionId: sessionMove.sessionId, success: false })
      continue
    }

    const start = new Date(startTimeISO)
    const end = new Date(endTimeISO)
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60))

    const { error } = await supabase
      .from('study_sessions')
      .update({
        start_time: startTimeISO,
        end_time: endTimeISO,
        duration_minutes: durationMinutes,
      })
      .eq('id', sessionMove.sessionId)
      .eq('plan_id', planId)

    if (error) {
      results.push({ sessionId: sessionMove.sessionId, success: false })
      continue
    }

    await syncSessionWithCalendar(userId, sessionMove.sessionId, 'update', {
      start_time: startTimeISO,
      end_time: endTimeISO,
    })

    appliedIds.add(sessionMove.sessionId)
    results.push({ sessionId: sessionMove.sessionId, success: true })
  }

  const successCount = results.filter((result) => result.success).length

  return {
    ...action,
    status: successCount > 0 ? 'success' : 'error',
    message:
      successCount > 0
        ? `Plan rebalanceado: ${successCount}/${sessionsToMove.length} sesiones reprogramadas sin violar las reglas del calendario ni el orden pedagógico.`
        : 'No se pudieron reprogramar las sesiones sin violar las reglas de trabajo/calendario.',
    data: { results, sessionsRebalanced: successCount },
  }
}
