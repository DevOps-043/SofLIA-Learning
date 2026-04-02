import { logger } from '../../../../../lib/utils/logger'
import {
  executeCreateCalendarEvent,
  executeDeleteCalendarEvent,
  executeListCalendarEvents,
  executeMoveCalendarEvent,
} from './actions/calendar-actions.service'
import {
  executeCreateMicroSession,
  executeRebalancePlan,
  executeRecoverMissedSession,
  executeReduceSessionLoad,
  executeUpdateCalendarSelection,
} from './actions/planning-actions.service'
import {
  executeCreateSession,
  executeDeleteSession,
  executeMoveSession,
  executeResizeSession,
  executeUpdateSession,
} from './actions/session-actions.service'
import type { ActionResult, ActionType } from './types'

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
): Promise<ActionResult> {
  switch (action.type) {
    case 'move_session':
      return executeMoveSession(userId, planId, action)
    case 'delete_session':
      return executeDeleteSession(userId, planId, action)
    case 'resize_session':
      return executeResizeSession(userId, planId, action)
    case 'create_session':
      return executeCreateSession(userId, planId, action)
    case 'update_session':
      return executeUpdateSession(userId, planId, action)
    case 'list_calendar_events':
      return executeListCalendarEvents(userId, planId, action)
    case 'create_calendar_event':
      return executeCreateCalendarEvent(userId, planId, action)
    case 'move_calendar_event':
      return executeMoveCalendarEvent(userId, planId, action)
    case 'delete_calendar_event':
      return executeDeleteCalendarEvent(userId, planId, action)
    case 'create_micro_session':
      return executeCreateMicroSession(userId, planId, action)
    case 'recover_missed_session':
      return executeRecoverMissedSession(userId, planId, action)
    case 'rebalance_plan':
      return executeRebalancePlan(userId, planId, action)
    case 'reduce_session_load':
      return executeReduceSessionLoad(userId, planId, action)
    case 'update_calendar_selection':
      return executeUpdateCalendarSelection(userId, planId, action)
    case 'rebalance':
    case 'rebalanzar':
    case 'redistribuir':
      return executeRebalancePlan(userId, planId, {
        ...action,
        type: 'rebalance_plan',
      })
    default:
      return {
        ...action,
        status: 'error',
        message: `Accion no reconocida: ${action.type}`,
      }
  }
}

export async function resolveDashboardChatAction(
  userId: string,
  activePlanId: string | undefined,
  actions: ActionResult[],
  fallbackAction: ActionResult | null,
) {
  if (!activePlanId || actions.length === 0) {
    return fallbackAction || undefined
  }

  const pendingActions = actions.filter((action) => action.status === 'pending')
  const confirmationActions = actions.filter(
    (action) => action.status === 'confirmation_needed',
  )

  if (pendingActions.length > 0) {
    const results = await Promise.all(
      pendingActions.map((action) =>
        executeDashboardAction(userId, activePlanId, action),
      ),
    )
    const failedAction = results.find((result) => result.status === 'error')
    return failedAction || results[results.length - 1]
  }

  return confirmationActions[0] || fallbackAction || undefined
}
