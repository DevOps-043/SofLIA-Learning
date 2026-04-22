import { createAdminClient } from './calendar.service'
import type { ActionResult } from './types'

const WEEKDAY_PATTERNS: Array<{ weekday: number; patterns: string[] }> = [
  { weekday: 0, patterns: ['domingo'] },
  { weekday: 1, patterns: ['lunes', 'monday'] },
  { weekday: 2, patterns: ['martes', 'tuesday'] },
  { weekday: 3, patterns: ['miercoles', 'miércoles', 'wednesday'] },
  { weekday: 4, patterns: ['jueves', 'thursday'] },
  { weekday: 5, patterns: ['viernes', 'friday'] },
  { weekday: 6, patterns: ['sabado', 'sábado', 'saturday'] },
]

function inferRequestedWeekday(message?: string): number | null {
  if (!message) {
    return null
  }

  const normalized = message.toLowerCase()
  for (const option of WEEKDAY_PATTERNS) {
    if (option.patterns.some((pattern) => normalized.includes(pattern))) {
      return option.weekday
    }
  }

  return null
}

export async function resolveMissingSessionReference(params: {
  userId: string
  planId: string
  action: ActionResult
  userMessage?: string
}): Promise<ActionResult> {
  if (
    !['move_session', 'delete_session', 'resize_session', 'recover_missed_session']
      .includes(params.action.type)
  ) {
    return params.action
  }

  const actionData =
    params.action.data && typeof params.action.data === 'object'
      ? { ...(params.action.data as Record<string, unknown>) }
      : {}

  if (typeof actionData.sessionId === 'string' && actionData.sessionId.trim()) {
    return { ...params.action, data: actionData }
  }

  const requestedWeekday = inferRequestedWeekday(params.userMessage)
  if (requestedWeekday === null) {
    return params.action
  }

  const supabase = createAdminClient()
  const now = new Date()
  const searchEnd = new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000)
  const { data: sessions, error } = await supabase
    .from('study_sessions')
    .select('id, title, start_time, end_time, status')
    .eq('user_id', params.userId)
    .eq('plan_id', params.planId)
    .gte('start_time', now.toISOString())
    .lte('start_time', searchEnd.toISOString())
    .order('start_time', { ascending: true })

  if (error || !sessions?.length) {
    return params.action
  }

  const candidates = sessions.filter((session) => {
    return new Date(session.start_time).getDay() === requestedWeekday
  })

  if (candidates.length === 1) {
    actionData.sessionId = candidates[0].id
    return { ...params.action, data: actionData }
  }

  if (candidates.length > 1) {
    return {
      ...params.action,
      status: 'confirmation_needed',
      message: `Encontré ${candidates.length} sesiones para ese día. Indícame cuál quieres mover o borrar: ${candidates.map((session) => `"${session.title}"`).join(' | ')}`,
      data: actionData,
    }
  }

  return params.action
}
