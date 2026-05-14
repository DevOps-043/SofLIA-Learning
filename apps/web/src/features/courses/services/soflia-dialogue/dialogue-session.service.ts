import {
  dialogueActivityConfigSchema,
  isDialogueActivityConfig,
  isTerminalDialogueState,
  type DialogueActivityConfig,
  type DialogueEvaluationResult,
  type DialoguePolicyDecision,
  type DialogueState,
} from '../../types/dialogue-runtime'
import type { CourseActivityContext } from '../activity-submission.server.service'
import { DialogueRuntimeError } from './dialogue-runtime.errors'
import {
  dialogueEvaluationsTable,
  dialogueResultsTable,
  dialogueSessionsTable,
  dialogueTurnsTable,
  type DialogueEvaluationRow,
  type DialogueResultRow,
  type DialogueSessionRow,
  type DialogueTurnRow,
} from './dialogue-tables'

const activeDialogueStates: DialogueState[] = [
  'START',
  'ELICIT_RESPONSE',
  'EVALUATE_RESPONSE',
  'CHALLENGE_OR_PROBE',
  'HINT',
  'RESCUE',
]

export const MAX_DIALOGUE_ACTIVITY_ATTEMPTS = 3

export type DialogueAttemptDecision =
  | {
      kind: 'can_create'
      attemptNumber: number
    }
  | {
      kind: 'limit_reached'
    }

export function resolveDialogueAttempt(
  existingSessionCount: number,
  maxAttempts = MAX_DIALOGUE_ACTIVITY_ATTEMPTS,
): DialogueAttemptDecision {
  if (existingSessionCount >= maxAttempts) {
    return { kind: 'limit_reached' }
  }

  return {
    kind: 'can_create',
    attemptNumber: existingSessionCount + 1,
  }
}

export function resolveDialogueConfig(
  context: CourseActivityContext,
): DialogueActivityConfig {
  if (!isDialogueActivityConfig(context.resolvedActivityConfig)) {
    throw new DialogueRuntimeError(
      'DIALOGUE_CONFIG_INVALID',
      400,
      'La actividad no tiene configuracion SOFLIA_DIALOGUE valida',
    )
  }

  return context.resolvedActivityConfig
}

function normalizeSessionState(value: string): DialogueState {
  const parsed = dialogueActivityConfigSchema.shape
  void parsed
  const allowed: DialogueState[] = [
    'START',
    'ELICIT_RESPONSE',
    'EVALUATE_RESPONSE',
    'CHALLENGE_OR_PROBE',
    'HINT',
    'RESCUE',
    'COMPLETE',
    'FAIL_OR_RETRY',
    'SESSION_SUMMARY',
  ]

  return allowed.includes(value as DialogueState)
    ? (value as DialogueState)
    : 'START'
}

export async function getActiveDialogueSession(input: {
  client: unknown
  context: CourseActivityContext
}) {
  const { data, error } = await dialogueSessionsTable(input.client)
    .select('*')
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)
    .in('state', activeDialogueStates)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar la sesion de dialogo',
      { message: error.message },
    )
  }

  return data
}

export async function getLatestDialogueSession(input: {
  client: unknown
  context: CourseActivityContext
}) {
  const { data, error } = await dialogueSessionsTable(input.client)
    .select('*')
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar la sesion de dialogo',
      { message: error.message },
    )
  }

  return data
}

export async function getDialogueSessionById(input: {
  client: unknown
  context: CourseActivityContext
  sessionId: string
}) {
  const { data, error } = await dialogueSessionsTable(input.client)
    .select('*')
    .eq('session_id', input.sessionId)
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar la sesion de dialogo',
      { message: error.message },
    )
  }

  if (!data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_SESSION_NOT_FOUND',
      404,
      'Sesion de dialogo no encontrada',
    )
  }

  return data
}

export async function getOrCreateDialogueSession(input: {
  client: unknown
  config: DialogueActivityConfig
  context: CourseActivityContext
}) {
  const activeSession = await getActiveDialogueSession(input)
  if (activeSession) {
    return activeSession
  }

  return createDialogueSession(input)
}

export async function createDialogueSession(input: {
  client: unknown
  config: DialogueActivityConfig
  context: CourseActivityContext
}) {
  const { count, error: countError } = await dialogueSessionsTable(input.client)
    .select('session_id', { count: 'exact', head: true })
    .eq('user_id', input.context.userId)
    .eq('activity_id', input.context.activity.activity_id)
    .eq('enrollment_id', input.context.enrollmentId)

  if (countError) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible validar los intentos del dialogo',
      { message: countError.message },
    )
  }

  const attemptDecision = resolveDialogueAttempt(count || 0)

  if (attemptDecision.kind === 'limit_reached') {
    throw new DialogueRuntimeError(
      'DIALOGUE_ATTEMPT_LIMIT_REACHED',
      409,
      'Se alcanzo el limite de 3 intentos para esta actividad',
    )
  }

  const { data, error } = await dialogueSessionsTable(input.client)
    .insert({
      activity_config_snapshot: input.config,
      activity_id: input.context.activity.activity_id,
      course_id: input.context.courseId,
      criteria_missing: input.config.successCriteria.map((criterion) => criterion.id),
      enrollment_id: input.context.enrollmentId,
      lesson_id: input.context.lessonId,
      organization_id: input.context.organizationId,
      prompt_version:
        input.config.versioning.promptVersion ||
        input.config.evaluator.promptVersion,
      rubric_version: input.config.versioning.rubricVersion,
      schema_version: input.config.schemaVersion,
      state: 'START',
      user_id: input.context.userId,
    })
    .select('*')
    .single()

  if (error || !data) {
    if (error?.message?.includes('limite de 3 intentos')) {
      throw new DialogueRuntimeError(
        'DIALOGUE_ATTEMPT_LIMIT_REACHED',
        409,
        'Se alcanzo el limite de 3 intentos para esta actividad',
      )
    }

    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible iniciar la sesion de dialogo',
      { message: error?.message },
    )
  }

  return data
}

export async function getDialogueTurns(client: unknown, sessionId: string) {
  const { data, error } = await dialogueTurnsTable(client)
    .select('*')
    .eq('session_id', sessionId)
    .order('turn_number', { ascending: true })

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar los turnos del dialogo',
      { message: error.message },
    )
  }

  return data ?? []
}

export async function getDialogueEvaluations(client: unknown, sessionId: string) {
  const { data, error } = await dialogueEvaluationsTable(client)
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar las evaluaciones del dialogo',
      { message: error.message },
    )
  }

  return data ?? []
}

export async function findTurnByClientTurnId(input: {
  client: unknown
  clientTurnId: string
  sessionId: string
}) {
  const { data, error } = await dialogueTurnsTable(input.client)
    .select('*')
    .eq('session_id', input.sessionId)
    .eq('client_turn_id', input.clientTurnId)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar el turno idempotente',
      { message: error.message },
    )
  }

  return data
}

export async function insertDialogueTurn(input: {
  client: unknown
  clientTurnId?: string | null
  content: string
  metadata?: Record<string, unknown>
  role: 'user' | 'assistant' | 'system'
  session: DialogueSessionRow
  stateAfter?: DialogueState | null
  stateBefore?: DialogueState | null
  turnNumber?: number
}) {
  const nextTurnNumber = input.turnNumber ?? input.session.turns_count + 1
  const { data, error } = await dialogueTurnsTable(input.client)
    .insert({
      client_turn_id: input.clientTurnId ?? null,
      content: input.content,
      metadata: input.metadata ?? {},
      role: input.role,
      session_id: input.session.session_id,
      state_after: input.stateAfter ?? null,
      state_before: input.stateBefore ?? input.session.state,
      turn_number: nextTurnNumber,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible guardar el turno del dialogo',
      { message: error?.message },
    )
  }

  return data
}

export async function insertDialogueEvaluation(input: {
  client: unknown
  evaluation: DialogueEvaluationResult
  modelName: string
  sessionId: string
  turnId: string
}) {
  const { data, error } = await dialogueEvaluationsTable(input.client)
    .insert({
      backend_notes: input.evaluation.backendNotes,
      criteria_met: input.evaluation.criteriaMet,
      criteria_missing: input.evaluation.criteriaMissing,
      decision: input.evaluation.decision,
      dimension_scores: input.evaluation.dimensionScores,
      evidence_quotes: input.evaluation.evidenceQuotes,
      feedback_for_tutor: input.evaluation.feedbackForTutor,
      flags: input.evaluation.flags,
      model_name: input.modelName,
      overall_score: input.evaluation.overallScore,
      raw_payload: input.evaluation,
      recommended_next_state: input.evaluation.recommendedNextState,
      session_id: input.sessionId,
      turn_id: input.turnId,
    })
    .select('*')
    .single()

  if (error || !data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible guardar la evaluacion del dialogo',
      { message: error?.message },
    )
  }

  return data
}

export async function updateDialogueSessionAfterTurn(input: {
  client: unknown
  evaluation: DialogueEvaluationResult
  policy: DialoguePolicyDecision
  session: DialogueSessionRow
}) {
  const nextState = input.policy.nextState
  const lowEvidenceTurns =
    input.evaluation.decision === 'low_evidence'
      ? input.session.low_evidence_turns + 1
      : 0
  const hintsUsed =
    nextState === 'HINT' ? input.session.hints_used + 1 : input.session.hints_used
  const turnsCount = input.session.turns_count + 1
  const now = new Date().toISOString()

  const { data, error } = await dialogueSessionsTable(input.client)
    .update({
      completed_at: isTerminalDialogueState(nextState) ? now : null,
      criteria_met: input.evaluation.criteriaMet,
      criteria_missing: input.evaluation.criteriaMissing,
      current_score: input.evaluation.overallScore,
      hints_used: hintsUsed,
      low_evidence_turns: lowEvidenceTurns,
      state: nextState,
      turns_count: turnsCount,
      updated_at: now,
    })
    .eq('session_id', input.session.session_id)
    .select('*')
    .single()

  if (error || !data) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible actualizar la sesion del dialogo',
      { message: error?.message },
    )
  }

  return data
}

export async function getDialogueResult(client: unknown, sessionId: string) {
  const { data, error } = await dialogueResultsTable(client)
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle()

  if (error) {
    throw new DialogueRuntimeError(
      'DIALOGUE_PERSISTENCE_FAILED',
      500,
      'No fue posible consultar el resultado del dialogo',
      { message: error.message },
    )
  }

  return data
}

export function toDialogueSessionResponse(input: {
  result?: DialogueResultRow | null
  session: DialogueSessionRow
  turns: DialogueTurnRow[]
}) {
  return {
    sessionId: input.session.session_id,
    state: normalizeSessionState(input.session.state),
    score: Number(input.session.current_score ?? 0),
    turnsCount: input.session.turns_count,
    hintsUsed: input.session.hints_used,
    criteriaMet: input.session.criteria_met ?? [],
    criteriaMissing: input.session.criteria_missing ?? [],
    startedAt: input.session.started_at,
    completedAt: input.session.completed_at,
    messages: input.turns.map((turn) => ({
      id: turn.turn_id,
      role: turn.role,
      content: turn.content,
      createdAt: turn.created_at,
    })),
    result: input.result
      ? {
          activityResult: input.result.activity_result,
          score: Number(input.result.score ?? 0),
          studentFeedback: input.result.student_feedback,
          criteriaMet: input.result.criteria_met ?? [],
          criteriaMissing: input.result.criteria_missing ?? [],
          analyticsTags: input.result.analytics_tags ?? [],
        }
      : null,
  }
}
