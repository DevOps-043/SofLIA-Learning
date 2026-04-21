import { createAdminClient, syncSessionWithCalendar } from '../calendar.service'
import { logger } from '../../../../../../lib/utils/logger'
import type { ActionResult } from '../types'
import { withTimezoneOffset } from './planning-actions-v2-timezone.service'

const DEFAULT_TZ_OFFSET = '-06:00'

function formatWithDefaultOffset(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}:00${DEFAULT_TZ_OFFSET}`
}

async function calculateSessionsToMove(params: {
  planId: string
  supabase: ReturnType<typeof createAdminClient>
}): Promise<
  | {
      sessionsToMove: Array<{
        sessionId: string
        newStartTime: string
        newEndTime: string
      }>
    }
  | { error: string }
> {
  const now = new Date()
  const { data: overdueSessions, error: fetchError } = await params.supabase
    .from('study_sessions')
    .select('id, title, start_time, end_time, duration_minutes')
    .eq('plan_id', params.planId)
    .eq('status', 'planned')
    .lt('end_time', now.toISOString())
    .order('start_time', { ascending: true })

  if (fetchError || !overdueSessions || overdueSessions.length === 0) {
    return { error: 'No se encontraron sesiones pendientes para redistribuir.' }
  }

  const preferredHours = [8, 9, 10, 17, 18, 19, 20]
  const sessionsToMove: Array<{
    sessionId: string
    newStartTime: string
    newEndTime: string
  }> = []
  let dayOffset = 0
  let hourIndex = 0

  for (const session of overdueSessions) {
    let foundSlot = false
    while (!foundSlot && dayOffset < 14) {
      const targetDate = new Date(now)
      targetDate.setDate(targetDate.getDate() + dayOffset)
      targetDate.setHours(preferredHours[hourIndex], 0, 0, 0)

      if (targetDate > now) {
        const duration = session.duration_minutes || 30
        const endDate = new Date(targetDate.getTime() + duration * 60 * 1000)

        sessionsToMove.push({
          sessionId: session.id,
          newStartTime: formatWithDefaultOffset(targetDate),
          newEndTime: formatWithDefaultOffset(endDate),
        })
        foundSlot = true
      }

      hourIndex += 1
      if (hourIndex >= preferredHours.length) {
        hourIndex = 0
        dayOffset += 1
      }
    }
  }

  if (!sessionsToMove.length) {
    return { error: 'No se pudieron calcular nuevos horarios para las sesiones.' }
  }

  return { sessionsToMove }
}

export async function executeRebalancePlan(
  userId: string,
  planId: string,
  action: ActionResult,
): Promise<ActionResult> {
  const supabase = createAdminClient()
  let { sessionsToMove } = (action.data || {}) as {
    sessionsToMove?: Array<{
      sessionId: string
      newStartTime: string
      newEndTime: string
    }>
  }

  if (!sessionsToMove || !sessionsToMove.length) {
    const calculated = await calculateSessionsToMove({ planId, supabase })
    if ('error' in calculated) {
      return { ...action, status: 'error', message: calculated.error }
    }
    sessionsToMove = calculated.sessionsToMove
  }

  const results: Array<{ sessionId: string; success: boolean }> = []

  for (const sessionMove of sessionsToMove) {
    const startTimeISO = withTimezoneOffset(sessionMove.newStartTime)
    const endTimeISO = withTimezoneOffset(sessionMove.newEndTime)
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

    if (error) {
      logger.error(`Error moviendo sesion ${sessionMove.sessionId}: ${error.message}`)
      results.push({ sessionId: sessionMove.sessionId, success: false })
      continue
    }

    results.push({ sessionId: sessionMove.sessionId, success: true })
    await syncSessionWithCalendar(userId, sessionMove.sessionId, 'update', {
      start_time: startTimeISO,
      end_time: endTimeISO,
    })
  }

  const successCount = results.filter((result) => result.success).length

  return {
    ...action,
    status: successCount > 0 ? 'success' : 'error',
    message:
      successCount > 0
        ? `Plan rebalanceado: ${successCount}/${sessionsToMove.length} sesiones reprogramadas.`
        : 'No se pudieron reprogramar las sesiones.',
    data: { results, sessionsRebalanced: successCount },
  }
}
