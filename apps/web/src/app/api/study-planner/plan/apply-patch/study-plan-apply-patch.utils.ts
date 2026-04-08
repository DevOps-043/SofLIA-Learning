import type {
  MoveDayPatchOperation,
  ResizeSessionPatchOperation,
  StudyPlanApplyPatchRequest,
  StudyPlanPatchOperation,
} from './study-plan-apply-patch.types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function parseOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function parseStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }

  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item !== '')

  return items.length > 0 ? items : undefined
}

function assertSessionTarget(
  operation: Record<string, unknown>,
  operationType: string,
): { sessionId?: string; clientReferenceId?: string } {
  const sessionId = parseOptionalString(operation.sessionId)
  const clientReferenceId = parseOptionalString(operation.clientReferenceId)

  if (!sessionId && !clientReferenceId) {
    throw new Error(
      `La operacion ${operationType} requiere sessionId o clientReferenceId`,
    )
  }

  return { sessionId, clientReferenceId }
}

function parseMoveSessionOperation(
  operation: Record<string, unknown>,
): StudyPlanPatchOperation {
  const target = assertSessionTarget(operation, 'move_session')
  const targetDate = parseOptionalString(operation.targetDate)
  const targetStartTime = parseOptionalString(operation.targetStartTime)
  const targetEndTime = parseOptionalString(operation.targetEndTime)

  if (!targetDate || !targetStartTime || !targetEndTime) {
    throw new Error(
      'move_session requiere targetDate, targetStartTime y targetEndTime',
    )
  }

  return {
    type: 'move_session',
    ...target,
    targetDate,
    targetStartTime,
    targetEndTime,
  }
}

function parseResizeSessionOperation(
  operation: Record<string, unknown>,
): ResizeSessionPatchOperation {
  const target = assertSessionTarget(operation, 'resize_session')
  const targetStartTime = parseOptionalString(operation.targetStartTime)
  const targetEndTime = parseOptionalString(operation.targetEndTime)

  if (!targetStartTime || !targetEndTime) {
    throw new Error('resize_session requiere targetStartTime y targetEndTime')
  }

  return {
    type: 'resize_session',
    ...target,
    dateStr: parseOptionalString(operation.dateStr),
    targetStartTime,
    targetEndTime,
  }
}

function parseMoveDayOperation(
  operation: Record<string, unknown>,
): MoveDayPatchOperation {
  const sourceDate = parseOptionalString(operation.sourceDate)
  const targetDate = parseOptionalString(operation.targetDate)

  if (!sourceDate || !targetDate) {
    throw new Error('move_day requiere sourceDate y targetDate')
  }

  return {
    type: 'move_day',
    sourceDate,
    targetDate,
    sessionIds: parseStringArray(operation.sessionIds),
    clientReferenceIds: parseStringArray(operation.clientReferenceIds),
  }
}

function parsePatchOperation(operation: unknown): StudyPlanPatchOperation {
  if (!isRecord(operation)) {
    throw new Error('Cada operacion debe ser un objeto valido')
  }

  const type = parseOptionalString(operation.type)

  if (!type) {
    throw new Error('Cada operacion requiere un type valido')
  }

  switch (type) {
    case 'move_session':
      return parseMoveSessionOperation(operation)
    case 'resize_session':
      return parseResizeSessionOperation(operation)
    case 'move_day':
      return parseMoveDayOperation(operation)
    default:
      throw new Error(`Operacion no soportada: ${type}`)
  }
}

export function parseStudyPlanApplyPatchRequest(
  body: unknown,
): StudyPlanApplyPatchRequest {
  if (!isRecord(body)) {
    throw new Error('planId y operations son requeridos')
  }

  const planId = parseOptionalString(body.planId)
  const rawOperations = body.operations

  if (!planId || !Array.isArray(rawOperations) || rawOperations.length === 0) {
    throw new Error('planId y operations son requeridos')
  }

  return {
    planId,
    operations: rawOperations.map(parsePatchOperation),
  }
}
