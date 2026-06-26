import {
  buildSanitizedContextExcerpt,
  sanitizeUntrustedString,
} from '@/lib/security/context-sanitizer'
import { evaluatePromptInjectionRisk } from '@/lib/security/prompt-injection-detector'

import type { CourseActivityContext } from '../activity-submission.server.service'
import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
  DialogueState,
} from '../../types/dialogue-runtime'
import { evaluateDialogueTurn } from './dialogue-evaluator.service'
import { recordDialogueEvent } from './dialogue-events.service'
import { decideDialogueNextState } from './dialogue-policy-engine.service'
import { persistDialogueResult } from './dialogue-result.service'
import { DialogueRuntimeError } from './dialogue-runtime.errors'
import {
  findTurnByClientTurnId,
  createDialogueSession,
  getDialogueEvaluations,
  getDialogueResult,
  getDialogueSessionById,
  getDialogueTurns,
  getLatestDialogueSession,
  getOrCreateDialogueSession,
  insertDialogueEvaluation,
  insertDialogueTurn,
  resolveDialogueConfig,
  toDialogueSessionResponse,
  updateDialogueSessionAfterTurn,
} from './dialogue-session.service'
import { generateDialogueTutorMessage } from './dialogue-tutor.service'
import type { DialogueSessionRow, DialogueTurnRow } from './dialogue-tables'
import {
  buildDialogueTechnicalRecovery,
  isRecoverableDialogueEvaluationError,
} from './dialogue-technical-recovery.service'

/**
 * Reintenta la evaluación UNA vez ante un fallo recuperable (timeouts/errores
 * transitorios de la IA). Si el segundo intento también falla, propaga el error para
 * que el runtime entre en la recuperación escalada (pista → rescate → video).
 */
async function evaluateDialogueTurnWithRetry(
  params: Parameters<typeof evaluateDialogueTurn>[0],
) {
  try {
    return await evaluateDialogueTurn(params)
  } catch (error) {
    if (!isRecoverableDialogueEvaluationError(error)) throw error
    await new Promise((resolve) => setTimeout(resolve, 600))
    return await evaluateDialogueTurn(params)
  }
}

/**
 * Cuenta cuántos mensajes de recuperación técnica consecutivos lleva SofLIA (mirando
 * los turnos de asistente más recientes hacia atrás). Sirve para ESCALAR la guía en
 * vez de repetir el mismo texto: 1er fallo pide reenvío, 2do da pista, 3er+ rescata.
 */
function countConsecutiveTechnicalRecoveries(turns: DialogueTurnRow[]): number {
  let count = 0
  for (let index = turns.length - 1; index >= 0; index -= 1) {
    const turn = turns[index]
    if (turn.role !== 'assistant') continue
    const metadata = turn.metadata as { technicalRecovery?: unknown } | null | undefined
    if (metadata?.technicalRecovery) {
      count += 1
    } else {
      break
    }
  }
  return count
}

function toDialogueState(value: string): DialogueState {
  const states: DialogueState[] = [
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

  return states.includes(value as DialogueState)
    ? (value as DialogueState)
    : 'START'
}

function buildSecurityEvaluation(
  config: DialogueActivityConfig,
): DialogueEvaluationResult {
  return {
    backendNotes: 'Prompt injection or internal prompt extraction attempt.',
    criteriaMet: [],
    criteriaMissing: config.successCriteria.map((criterion) => criterion.id),
    decision: 'security_block',
    dimensionScores: [],
    evidenceQuotes: [],
    feedbackForTutor:
      'La respuesta intento manipular el sistema o revelar instrucciones internas.',
    flags: {
      contradiction: false,
      evasiveAnswer: true,
      keywordStuffing: false,
      memorizedWithoutLogic: false,
      promptInjection: true,
    },
    overallScore: 0,
    recommendedNextState: 'FAIL_OR_RETRY',
  }
}

async function ensureOpeningTurn(input: {
  client: unknown
  config: DialogueActivityConfig
  session: DialogueSessionRow
}) {
  const turns = await getDialogueTurns(input.client, input.session.session_id)
  if (turns.length > 0) {
    return turns
  }

  const openingTurn = await insertDialogueTurn({
    client: input.client,
    content: input.config.openingMessage,
    metadata: { source: 'opening_message' },
    role: 'assistant',
    session: input.session,
    stateAfter: 'ELICIT_RESPONSE',
    stateBefore: 'START',
    turnNumber: 1,
  })

  await recordDialogueEvent(input.client, {
    activityId: input.session.activity_id,
    eventType: 'dialogue_started',
    payload: { state: input.session.state },
    sessionId: input.session.session_id,
    userId: input.session.user_id,
  })

  return [openingTurn]
}

async function buildResponse(input: {
  client: unknown
  session: DialogueSessionRow
}) {
  const [turns, result] = await Promise.all([
    getDialogueTurns(input.client, input.session.session_id),
    getDialogueResult(input.client, input.session.session_id),
  ])

  return toDialogueSessionResponse({
    result,
    session: input.session,
    turns,
  })
}

export async function getDialogueRuntimeSession(input: {
  client: unknown
  context: CourseActivityContext
  restart?: boolean
}) {
  const config = resolveDialogueConfig(input.context)
  const latestSession = await getLatestDialogueSession(input)
  const session =
    !input.restart && latestSession && latestSession.state !== 'FAIL_OR_RETRY'
      ? latestSession
      : input.restart
        ? await createDialogueSession({ ...input, config })
        : await getOrCreateDialogueSession({ ...input, config })

  await ensureOpeningTurn({
    client: input.client,
    config,
    session,
  })

  return buildResponse({ client: input.client, session })
}

export async function processDialogueMessage(input: {
  client: unknown
  clientTurnId?: string
  context: CourseActivityContext
  message: string
  sessionId?: string
}) {
  const config = resolveDialogueConfig(input.context)
  const session = input.sessionId
    ? await getDialogueSessionById({
        client: input.client,
        context: input.context,
        sessionId: input.sessionId,
      })
    : await getOrCreateDialogueSession({
        client: input.client,
        config,
        context: input.context,
      })

  if (['COMPLETE', 'SESSION_SUMMARY'].includes(session.state)) {
    throw new DialogueRuntimeError(
      'DIALOGUE_SESSION_CLOSED',
      409,
      'La sesion de dialogo ya fue cerrada',
    )
  }

  if (input.clientTurnId) {
    const existingTurn = await findTurnByClientTurnId({
      client: input.client,
      clientTurnId: input.clientTurnId,
      sessionId: session.session_id,
    })

    if (existingTurn) {
      return buildResponse({ client: input.client, session })
    }
  }

  const existingTurns = await ensureOpeningTurn({
    client: input.client,
    config,
    session,
  })
  const sanitizedMessage = sanitizeUntrustedString(input.message, 6000)
  const risk = evaluatePromptInjectionRisk({
    contextExcerpt: buildSanitizedContextExcerpt({
      activityId: input.context.activity.activity_id,
      goal: config.visibleGoal,
      scenario: config.scenario,
    }),
    message: sanitizedMessage,
  })

  const userTurn = await insertDialogueTurn({
    client: input.client,
    clientTurnId: input.clientTurnId,
    content: sanitizedMessage,
    metadata: {
      security: {
        action: risk.action,
        categories: risk.categories,
        score: risk.score,
      },
    },
    role: 'user',
    session,
    stateBefore: toDialogueState(session.state),
    turnNumber: existingTurns.length + 1,
  })

  await recordDialogueEvent(input.client, {
    activityId: input.context.activity.activity_id,
    eventType: 'user_turn_submitted',
    payload: {
      clientTurnId: input.clientTurnId,
      securityAction: risk.action,
    },
    sessionId: session.session_id,
    userId: input.context.userId,
  })

  const previousEvaluations = await getDialogueEvaluations(
    input.client,
    session.session_id,
  )
  const recentTurns = [...existingTurns, userTurn]
  // Criteria confirmed across all turns before this one (union from session state).
  const priorAccumulatedCriteriaMet: string[] = session.criteria_met ?? []
  let evaluationWithModel: {
    evaluation: DialogueEvaluationResult
    modelName: string
  }

  try {
    evaluationWithModel =
      risk.action === 'block'
        ? {
            evaluation: buildSecurityEvaluation(config),
            modelName: 'security-guardrail',
          }
        : await evaluateDialogueTurnWithRetry({
            accumulatedCriteriaMet: priorAccumulatedCriteriaMet,
            config,
            organizationAiContext: input.context.organizationAiContext,
            previousEvaluations,
            recentTurns,
            studentMessage: sanitizedMessage,
          })
  } catch (error) {
    if (!isRecoverableDialogueEvaluationError(error)) {
      throw error
    }

    await recordDialogueEvent(input.client, {
      activityId: input.context.activity.activity_id,
      eventType: 'evaluation_failed',
      payload: {
        code: error.code,
        status: error.status,
      },
      sessionId: session.session_id,
      userId: input.context.userId,
    })

    // Recuperación ESCALADA: en vez de repetir siempre el mismo texto, escala según
    // cuántos fallos técnicos consecutivos van (reenvío → pista → rescate + video).
    const recoveryAttempt = countConsecutiveTechnicalRecoveries(existingTurns) + 1
    const assistantMessage = buildDialogueTechnicalRecovery({ config, attempt: recoveryAttempt })
    const currentState = toDialogueState(session.state)

    await insertDialogueTurn({
      client: input.client,
      content: assistantMessage,
      metadata: {
        technicalRecovery: {
          code: error.code,
        },
      },
      role: 'assistant',
      session,
      stateAfter: currentState,
      stateBefore: currentState,
      turnNumber: existingTurns.length + 2,
    })

    const responseSession = await buildResponse({
      client: input.client,
      session,
    })

    return {
      assistantMessage,
      evaluationSummary: {
        criteriaMet: session.criteria_met,
        criteriaMissing: session.criteria_missing,
        score: session.current_score,
      },
      result: null,
      session: responseSession,
      state: currentState,
    }
  }

  const evaluationRow = await insertDialogueEvaluation({
    client: input.client,
    evaluation: evaluationWithModel.evaluation,
    modelName: evaluationWithModel.modelName,
    sessionId: session.session_id,
    turnId: userTurn.turn_id,
  })

  await recordDialogueEvent(input.client, {
    activityId: input.context.activity.activity_id,
    eventType: 'evaluation_completed',
    payload: {
      evaluationId: evaluationRow.evaluation_id,
      score: evaluationWithModel.evaluation.overallScore,
      decision: evaluationWithModel.evaluation.decision,
    },
    sessionId: session.session_id,
    userId: input.context.userId,
  })

  // Accumulated criteria = confirmed in prior turns UNION confirmed in this turn.
  const allCriteriaIds = config.successCriteria.map((criterion) => criterion.id)
  const accumulatedCriteriaMet = [
    ...new Set([...priorAccumulatedCriteriaMet, ...evaluationWithModel.evaluation.criteriaMet]),
  ]

  const policy = decideDialogueNextState({
    accumulatedCriteriaMet,
    config,
    currentState: toDialogueState(session.state),
    evaluation: evaluationWithModel.evaluation,
    hintsUsed: session.hints_used,
    lowEvidenceTurns: session.low_evidence_turns,
    turnsCount: session.turns_count + 1,
  })

  const updatedSession = await updateDialogueSessionAfterTurn({
    allCriteriaIds,
    client: input.client,
    evaluation: evaluationWithModel.evaluation,
    policy,
    session,
  })

  const assistantMessage = await generateDialogueTutorMessage({
    config,
    evaluation: evaluationWithModel.evaluation,
    organizationAiContext: input.context.organizationAiContext,
    policy,
    recentTurns,
  })

  await insertDialogueTurn({
    client: input.client,
    content: assistantMessage,
    metadata: {
      evaluationId: evaluationRow.evaluation_id,
      policy,
    },
    role: 'assistant',
    session: updatedSession,
    stateAfter: policy.nextState,
    stateBefore: toDialogueState(session.state),
    turnNumber: existingTurns.length + 2,
  })

  if (policy.nextState === 'HINT') {
    await recordDialogueEvent(input.client, {
      activityId: input.context.activity.activity_id,
      eventType: 'hint_given',
      payload: { hintId: policy.hintToUse?.id },
      sessionId: session.session_id,
      userId: input.context.userId,
    })
  }

  if (policy.nextState === 'RESCUE') {
    await recordDialogueEvent(input.client, {
      activityId: input.context.activity.activity_id,
      eventType: 'rescue_triggered',
      sessionId: session.session_id,
      userId: input.context.userId,
    })
  }

  let result = null
  if (policy.shouldPersistResult) {
    result = await persistDialogueResult({
      client: input.client,
      config,
      context: input.context,
      evaluation: evaluationWithModel.evaluation,
      session: updatedSession,
      shouldComplete: policy.shouldComplete,
    })

    await recordDialogueEvent(input.client, {
      activityId: input.context.activity.activity_id,
      eventType: policy.shouldComplete ? 'dialogue_completed' : 'dialogue_failed',
      payload: { score: result.score },
      sessionId: session.session_id,
      userId: input.context.userId,
    })
  }

  const responseSession = await buildResponse({
    client: input.client,
    session: updatedSession,
  })

  return {
    assistantMessage,
    evaluationSummary: {
      criteriaMet: evaluationWithModel.evaluation.criteriaMet,
      criteriaMissing: evaluationWithModel.evaluation.criteriaMissing,
      score: evaluationWithModel.evaluation.overallScore,
    },
    result,
    session: responseSession,
    state: policy.nextState,
  }
}
