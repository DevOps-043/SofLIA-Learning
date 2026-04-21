import { logger } from '../../../../../lib/utils/logger'
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
import {
  defaultConfirmationMessage,
  isMutativeDashboardAction,
  normalizeActionType,
  parseActionTagContent,
} from './chat-action-validation.service'
import { resolveMissingSessionReference } from './chat-action-session-reference.service'
import type { ActionProposal, ActionResult } from './types'

export function extractActionTags(response: string): {
  action: ActionResult | null
  actions: ActionResult[]
  cleanResponse: string
} {
  const actionMatches = response.matchAll(/<action>([\s\S]*?)<\/action>/g)
  const actions: ActionResult[] = []

  for (const actionMatch of actionMatches) {
    const parsedAction = parseActionTagContent(actionMatch[1])

    if (parsedAction.code === 'invalid_action_json') {
      logger.error('Error parsing action JSON from dashboard chat response')
    }

    actions.push(parsedAction)
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
  options?: { confirmed?: boolean; traceId?: string },
): Promise<ActionResult> {
  const actionForResolution =
    options?.confirmed && action.status === 'confirmation_needed'
      ? { ...action, status: 'pending' as const }
      : action

  const resolvedAction = await resolveMissingSessionReference({
    userId,
    planId,
    action: actionForResolution,
    userMessage,
  })

  if (resolvedAction.status === 'confirmation_needed') {
    return resolvedAction
  }

  logger.info('[StudyPlanner] Ejecutando accion de dashboard', {
    actionType: resolvedAction.type,
    confirmationState: options?.confirmed ? 'confirmed' : resolvedAction.status,
    planId,
    traceId: options?.traceId,
    userId,
  })

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
      return executeRebalancePlanV2(
        userId,
        planId,
        {
          ...resolvedAction,
          type: 'rebalance_plan',
        },
        userMessage,
      )
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
  traceId?: string,
) {
  if (!activePlanId || actions.length === 0) {
    return fallbackAction || undefined
  }

  const readOnlyMode = process.env.STUDY_PLANNER_ACTIONS_READONLY === 'true'
  const normalizedActions = actions.map((action) => ({
    ...action,
    traceId,
    type: normalizeActionType(action.type),
  }))

  const errorAction = normalizedActions.find((action) => action.status === 'error')
  if (errorAction) {
    return errorAction
  }

  const mutativeProposal = normalizedActions.find((action) =>
    action.status === 'confirmation_needed' ||
    isMutativeDashboardAction(action.type) ||
    readOnlyMode,
  )

  if (mutativeProposal) {
    return {
      ...mutativeProposal,
      status: 'confirmation_needed' as const,
      requiresConfirmation: true,
      message: mutativeProposal.message || defaultConfirmationMessage(mutativeProposal),
    }
  }

  const pendingActions = normalizedActions.filter((action) => action.status === 'pending')
  const confirmationActions = normalizedActions.filter(
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
          { traceId },
        ),
      )
    }

    const failedAction = results.find((result) => result.status === 'error')
    return failedAction || results[results.length - 1]
  }

  return confirmationActions[0] || fallbackAction || undefined
}

export function buildActionProposals(
  actions: ActionResult[],
  traceId?: string,
): ActionProposal[] {
  return actions
    .filter((action) =>
      action.status === 'confirmation_needed' ||
      action.status === 'error' ||
      isMutativeDashboardAction(action.type),
    )
    .map((action) => {
      const normalizedAction: ActionProposal = {
        ...action,
        data: action.data && typeof action.data === 'object' ? action.data : {},
        requiresConfirmation:
          action.status !== 'error' &&
          (action.requiresConfirmation || isMutativeDashboardAction(action.type)),
        status: action.status === 'error' ? 'error' : 'confirmation_needed',
        traceId,
        type: normalizeActionType(action.type),
      }

      return {
        ...normalizedAction,
        message:
          normalizedAction.message ||
          (normalizedAction.status === 'error'
            ? 'La accion propuesta no es valida.'
            : defaultConfirmationMessage(normalizedAction)),
      }
    })
}
