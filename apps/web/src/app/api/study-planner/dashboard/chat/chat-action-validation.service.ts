import { z } from 'zod'
import type { ActionResult, ActionType } from './types'

const MUTATIVE_ACTION_TYPES = new Set<ActionType>([
  'move_session',
  'delete_session',
  'resize_session',
  'create_session',
  'update_session',
  'create_calendar_event',
  'move_calendar_event',
  'delete_calendar_event',
  'create_micro_session',
  'recover_missed_session',
  'resync_calendar_sessions',
  'rebalance_plan',
  'reduce_session_load',
  'update_calendar_selection',
  'delete_plan',
  'rebalance',
  'rebalanzar',
  'redistribuir',
])

const actionTypeSchema = z.enum([
  'move_session',
  'delete_session',
  'resize_session',
  'create_session',
  'update_session',
  'reschedule_sessions',
  'get_plan_summary',
  'list_calendar_events',
  'create_calendar_event',
  'move_calendar_event',
  'delete_calendar_event',
  'rebalance_plan',
  'create_micro_session',
  'reduce_session_load',
  'recover_missed_session',
  'resync_calendar_sessions',
  'update_calendar_selection',
  'delete_plan',
  'rebalance',
  'rebalanzar',
  'redistribuir',
  'none',
] satisfies [ActionType, ...ActionType[]])

const unknownRecordSchema = z.record(z.string(), z.unknown())

const baseActionSchema = z.object({
  confirmationMessage: z.string().optional(),
  confirmationNeeded: z.boolean().optional(),
  data: unknownRecordSchema.optional(),
  type: actionTypeSchema,
})

const sessionMoveSchema = z.object({
  newEndTime: z.string().min(1),
  newStartTime: z.string().min(1),
  sessionId: z.string().min(1),
})

const sessionIdSchema = z.object({
  sessionId: z.string().min(1),
})

const resizeSessionSchema = z.object({
  newDurationMinutes: z.number().positive(),
  sessionId: z.string().min(1),
})

const createSessionSchema = z.object({
  courseId: z.string().optional(),
  description: z.string().optional(),
  endTime: z.string().min(1),
  lessonId: z.string().optional(),
  startTime: z.string().min(1),
  title: z.string().min(1),
})

const rebalanceSchema = z.object({
  reason: z.string().optional(),
  sessionsToMove: z.array(sessionMoveSchema).min(1).optional(),
})

const reduceSessionLoadSchema = z.object({
  date: z.string().optional(),
  sessionsToReduce: z.array(z.object({
    newData: z.object({
      durationMinutes: z.number().positive().optional(),
      endTime: z.string().optional(),
      startTime: z.string().optional(),
    }).optional(),
    reduceAction: z.enum(['delete', 'resize', 'move']),
    sessionId: z.string().min(1),
  })).min(1),
})

const updateCalendarSelectionSchema = z.object({
  selectedCalendarIds: z.array(z.string().min(1)).min(1),
})

const resyncCalendarSessionsSchema = z.object({
  sessionIds: z.array(z.string().min(1)).min(1),
})

export function normalizeActionType(type: ActionType): ActionType {
  if (type === 'rebalance' || type === 'rebalanzar' || type === 'redistribuir') {
    return 'rebalance_plan'
  }

  return type
}

export function isMutativeDashboardAction(type: ActionType): boolean {
  return MUTATIVE_ACTION_TYPES.has(type)
}

export function defaultConfirmationMessage(action: ActionResult): string {
  switch (normalizeActionType(action.type)) {
    case 'delete_plan':
      return 'Confirma si quieres eliminar el plan completo. Esta accion no se puede deshacer.'
    case 'delete_session':
      return 'Confirma si quieres eliminar esta sesion del plan.'
    case 'move_session':
    case 'recover_missed_session':
      return 'Confirma si quieres reprogramar esta sesion.'
    case 'resync_calendar_sessions':
      return 'Confirma si quieres recrear en Google Calendar los eventos perdidos de estas sesiones.'
    case 'update_calendar_selection':
      return 'Confirma si quieres cambiar los calendarios usados para calcular tu disponibilidad.'
    case 'rebalance_plan':
      return 'Confirma si quieres redistribuir las sesiones atrasadas del plan.'
    case 'reduce_session_load':
      return 'Confirma si quieres reducir la carga de sesiones.'
    default:
      return action.message || 'Confirma si quieres aplicar este cambio.'
  }
}

function validateActionData(type: ActionType, data: Record<string, unknown>) {
  switch (normalizeActionType(type)) {
    case 'move_session':
      return sessionMoveSchema.safeParse(data)
    case 'delete_session':
      return sessionIdSchema.safeParse(data)
    case 'resize_session':
      return resizeSessionSchema.safeParse(data)
    case 'create_session':
      return createSessionSchema.safeParse(data)
    case 'update_session':
      return sessionIdSchema.passthrough().safeParse(data)
    case 'create_micro_session':
      return createSessionSchema.pick({ endTime: true, startTime: true }).passthrough().safeParse(data)
    case 'recover_missed_session':
      return sessionMoveSchema.safeParse(data)
    case 'resync_calendar_sessions':
      return resyncCalendarSessionsSchema.safeParse(data)
    case 'rebalance_plan':
      return rebalanceSchema.safeParse(data)
    case 'reduce_session_load':
      return reduceSessionLoadSchema.safeParse(data)
    case 'update_calendar_selection':
      return updateCalendarSelectionSchema.safeParse(data)
    case 'delete_plan':
      return z.object({}).passthrough().safeParse(data)
    default:
      return unknownRecordSchema.safeParse(data)
  }
}

function validationMessage(error: z.ZodError): string {
  const issue = error.issues[0]
  const path = issue?.path.length ? issue.path.join('.') : 'data'
  return `Acción inválida: ${path} ${issue?.message || 'no es válido'}`
}

export function parseActionTagContent(content: string): ActionResult {
  try {
    const rawActionData: unknown = JSON.parse(content.trim())
    const parsedAction = baseActionSchema.safeParse(rawActionData)

    if (!parsedAction.success) {
      return {
        type: 'none',
        data: {},
        status: 'error',
        code: 'invalid_action_schema',
        message: validationMessage(parsedAction.error),
        requiresConfirmation: false,
      }
    }

    const actionData = parsedAction.data
    const normalizedType = normalizeActionType(actionData.type)
    const data = actionData.data || {}
    const dataValidation = validateActionData(normalizedType, data)

    if (!dataValidation.success) {
      return {
        type: normalizedType,
        data,
        status: 'error',
        code: 'invalid_action_data',
        message: validationMessage(dataValidation.error),
        requiresConfirmation: false,
      }
    }

    const requiresConfirmation =
      actionData.confirmationNeeded === true ||
      isMutativeDashboardAction(normalizedType)

    return {
      type: normalizedType,
      data: dataValidation.data,
      status: requiresConfirmation ? 'confirmation_needed' : 'pending',
      requiresConfirmation,
      message: actionData.confirmationMessage,
    }
  } catch {
    return {
      type: 'none',
      data: {},
      status: 'error',
      code: 'invalid_action_json',
      message: 'No pude interpretar una acción propuesta por SofLIA.',
      requiresConfirmation: false,
    }
  }
}
