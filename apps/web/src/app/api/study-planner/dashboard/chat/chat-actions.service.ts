import { logger } from '../../../../../lib/utils/logger'
import { createAdminClient } from './calendar.service'
import {
  executeCreateCalendarEvent,
  executeDeleteCalendarEvent,
  executeListCalendarEvents,
  executeMoveCalendarEvent,
} from './actions/calendar-actions.service'
import {
  executeCreateMicroSessionV2,
  executeDeletePlan,
  executeRebalancePlanV2,
  executeRecoverMissedSessionV2,
  executeReduceSessionLoadV2,
  executeUpdateCalendarSelection,
} from './actions/planning-actions-v2.service'
import {
  executeCreateSessionV2,
  executeDeleteSessionV2,
  executeMoveSessionV2,
  executeResizeSessionV2,
  executeUpdateSessionV2,
} from './actions/session-actions-v2.service'
import type { ActionResult, ActionType } from './types'

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

async function resolveMissingSessionReference(params: {
  userId: string
  planId: string
  action: ActionResult
  userMessage?: string
}): Promise<ActionResult> {
  if (!['move_session', 'delete_session', 'resize_session', 'recover_missed_session'].includes(params.action.type)) {
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

export function extractActionTags(response: string): {
  action: ActionResult | null
  actions: ActionResult[]
  cleanResponse: string
} {
  const actionMatches = response.matchAll(/<action>([\s\S]*?)<\/action>/g)
  const actions: ActionResult[] = []

  for (const actionMatch of actionMatches) {
    try {
      const actionData = JSON.parse(actionMatch[1].trim())

      if (!actionData.type) {
        continue
      }

      actions.push({
        type: String(actionData.type).toLowerCase() as ActionType,
        data: actionData.data || {},
        status: actionData.confirmationNeeded
          ? 'confirmation_needed'
          : 'pending',
        message: actionData.confirmationMessage,
      })
    } catch (error) {
      logger.error('Error parsing action JSON:', error)
    }
  }

  return {
    action: actions[0] || null,
    actions,
    cleanResponse: response.replace(/<action>[\s\S]*?<\/action>/g, '').trim(),
  }
}

export async function executeDashboardAction(
  userId: string,
  planId: string,
  action: ActionResult,
  userMessage?: string,
): Promise<ActionResult> {
  const resolvedAction = await resolveMissingSessionReference({
    userId,
    planId,
    action,
    userMessage,
  })

  if (resolvedAction.status === 'confirmation_needed') {
    return resolvedAction
  }

  switch (resolvedAction.type) {
    case 'move_session':
      return executeMoveSessionV2(userId, planId, resolvedAction, userMessage)
    case 'delete_session':
      return executeDeleteSessionV2(userId, planId, resolvedAction)
    case 'resize_session':
      return executeResizeSessionV2(userId, planId, resolvedAction, userMessage)
    case 'create_session':
      return executeCreateSessionV2(userId, planId, resolvedAction, userMessage)
    case 'update_session':
      return executeUpdateSessionV2(userId, planId, resolvedAction, userMessage)
    case 'list_calendar_events':
      return executeListCalendarEvents(userId, planId, resolvedAction)
    case 'create_calendar_event':
      return executeCreateCalendarEvent(userId, planId, resolvedAction)
    case 'move_calendar_event':
      return executeMoveCalendarEvent(userId, planId, resolvedAction)
    case 'delete_calendar_event':
      return executeDeleteCalendarEvent(userId, planId, resolvedAction)
    case 'create_micro_session':
      return executeCreateMicroSessionV2(userId, planId, resolvedAction, userMessage)
    case 'recover_missed_session':
      return executeRecoverMissedSessionV2(userId, planId, resolvedAction, userMessage)
    case 'rebalance_plan':
      return executeRebalancePlanV2(userId, planId, resolvedAction, userMessage)
    case 'reduce_session_load':
      return executeReduceSessionLoadV2(userId, planId, resolvedAction, userMessage)
    case 'update_calendar_selection':
      return executeUpdateCalendarSelection(userId, planId, resolvedAction)
    case 'delete_plan':
      return executeDeletePlan(userId, planId, resolvedAction)
    case 'rebalance':
    case 'rebalanzar':
    case 'redistribuir':
      return executeRebalancePlanV2(userId, planId, {
        ...resolvedAction,
        type: 'rebalance_plan',
      }, userMessage)
    default:
      return {
        ...resolvedAction,
        status: 'error',
        message: `Accion no reconocida: ${resolvedAction.type}`,
      }
  }
}

export async function resolveDashboardChatAction(
  userId: string,
  activePlanId: string | undefined,
  actions: ActionResult[],
  fallbackAction: ActionResult | null,
  userMessage?: string,
) {
  if (!activePlanId || actions.length === 0) {
    return fallbackAction || undefined
  }

  const pendingActions = actions.filter((action) => action.status === 'pending')
  const confirmationActions = actions.filter(
    (action) => action.status === 'confirmation_needed',
  )

  if (pendingActions.length > 0) {
    const results: ActionResult[] = []

    for (const pendingAction of pendingActions) {
      results.push(
        await executeDashboardAction(
          userId,
          activePlanId,
          pendingAction,
          userMessage,
        ),
      )
    }

    const failedAction = results.find((result) => result.status === 'error')
    return failedAction || results[results.length - 1]
  }

  return confirmationActions[0] || fallbackAction || undefined
}
