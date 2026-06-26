import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
  DialoguePolicyDecision,
  DialogueState,
} from '../../types/dialogue-runtime'

type DialoguePolicyInput = {
  accumulatedCriteriaMet: string[]
  config: DialogueActivityConfig
  currentState: DialogueState
  evaluation: DialogueEvaluationResult
  hintsUsed: number
  lowEvidenceTurns: number
  turnsCount: number
}

function hasSecurityFlags(evaluation: DialogueEvaluationResult) {
  return (
    evaluation.flags.promptInjection ||
    evaluation.flags.keywordStuffing ||
    evaluation.flags.memorizedWithoutLogic
  )
}

function requiredCriteria(config: DialogueActivityConfig) {
  return config.successCriteria
    .filter((criterion) => criterion.required)
    .map((criterion) => criterion.id)
}

function allRequiredCriteriaMet(
  config: DialogueActivityConfig,
  evaluation: DialogueEvaluationResult,
  accumulatedCriteriaMet: string[],
) {
  // Union criteria confirmed in this turn with those confirmed in earlier turns.
  const met = new Set([...accumulatedCriteriaMet, ...evaluation.criteriaMet])
  return requiredCriteria(config).every((criterionId) => met.has(criterionId))
}

function findNextHint(
  config: DialogueActivityConfig,
  criteriaMissing: string[],
  hintsUsed: number,
) {
  const missing = new Set(criteriaMissing)

  return (
    config.hintLadder
      .slice()
      .sort((left, right) => left.level - right.level)
      .find((hint) => {
        if (hint.level <= hintsUsed) {
          return false
        }

        return !hint.targetCriterionId || missing.has(hint.targetCriterionId)
      }) ?? null
  )
}

export function decideDialogueNextState(
  input: DialoguePolicyInput,
): DialoguePolicyDecision {
  const { config, currentState, evaluation } = input
  const policy = config.policy
  const requiredCriteriaMet = allRequiredCriteriaMet(
    config,
    evaluation,
    input.accumulatedCriteriaMet,
  )
  const securityBlocked = hasSecurityFlags(evaluation)

  if (securityBlocked) {
    return {
      nextState: 'FAIL_OR_RETRY',
      nextAction: 'security_retry',
      reason: 'La respuesta activo banderas de seguridad o intento de manipular la evaluacion.',
      shouldComplete: false,
      shouldPersistResult: true,
      hintToUse: null,
    }
  }

  // Complete when:
  //   - Score reaches the approval threshold
  //   - All required criteria are met (union of accumulated + current turn)
  //   - The evaluator hasn't flagged this as low-evidence, a failure, or a security issue
  // Note: we intentionally do NOT require evaluation.decision === 'complete' because the
  // evaluator judges only the current message in isolation; a student who distributed correct
  // answers across multiple turns would never produce a single 'complete' decision even though
  // all criteria are covered.
  if (
    evaluation.overallScore >= policy.approvalMinimum &&
    requiredCriteriaMet &&
    evaluation.decision !== 'low_evidence' &&
    evaluation.decision !== 'fail_or_retry' &&
    evaluation.decision !== 'security_block'
  ) {
    return {
      nextState: 'COMPLETE',
      nextAction: 'complete_with_feedback',
      reason: 'La respuesta alcanza el score minimo y cubre los criterios obligatorios.',
      shouldComplete: true,
      shouldPersistResult: true,
      hintToUse: null,
    }
  }

  if (
    currentState === 'RESCUE' ||
    input.turnsCount >= policy.maxTurns ||
    evaluation.decision === 'fail_or_retry'
  ) {
    return {
      nextState: policy.allowRetry ? 'FAIL_OR_RETRY' : 'SESSION_SUMMARY',
      nextAction: policy.allowRetry ? 'offer_retry' : 'close_without_retry',
      reason: 'La sesion alcanzo el limite de avance util sin cubrir criterios obligatorios.',
      shouldComplete: false,
      shouldPersistResult: true,
      hintToUse: null,
    }
  }

  // El estudiante está estancado si la última evaluación no muestra avance real
  // (sin puntaje y sin criterios cubiertos). Antes el RESCUE exigía además
  // `lowEvidenceTurns >= N`, pero el evaluador suele devolver `needs_hint` (que NO
  // incrementa lowEvidenceTurns), así que el rescate nunca llegaba y la conversación
  // se quedaba en bucle de CHALLENGE_OR_PROBE. Ahora, agotadas las pistas y sin
  // criterios obligatorios cubiertos, rescatamos cuando hay baja evidencia repetida
  // O cuando no hay ningún progreso: damos el modelo de referencia y redirigimos al
  // video en lugar de seguir sondeando indefinidamente.
  const isMakingProgress =
    evaluation.overallScore > 0 ||
    evaluation.criteriaMet.length > 0 ||
    input.accumulatedCriteriaMet.length > 0

  if (
    input.hintsUsed >= policy.maxHints &&
    !requiredCriteriaMet &&
    (input.lowEvidenceTurns >= policy.rescueAfterLowEvidenceTurns || !isMakingProgress)
  ) {
    return {
      nextState: 'RESCUE',
      nextAction: 'explain_rescue_model',
      reason: 'Se agotaron las pistas y el estudiante sigue sin avanzar; conviene rescatar.',
      shouldComplete: false,
      shouldPersistResult: false,
      hintToUse: null,
    }
  }

  const nextHint = findNextHint(
    config,
    evaluation.criteriaMissing,
    input.hintsUsed,
  )

  if (
    nextHint &&
    input.hintsUsed < policy.maxHints &&
    (evaluation.decision === 'needs_hint' ||
      evaluation.decision === 'low_evidence' ||
      input.lowEvidenceTurns > 0)
  ) {
    return {
      nextState: 'HINT',
      nextAction: 'give_hint',
      reason: 'La respuesta necesita apoyo graduado antes de rescatar o fallar.',
      shouldComplete: false,
      shouldPersistResult: false,
      hintToUse: nextHint,
    }
  }

  return {
    nextState: 'CHALLENGE_OR_PROBE',
    nextAction: 'probe_missing_criteria',
    reason: 'La respuesta contiene evidencia parcial y conviene profundizar.',
    shouldComplete: false,
    shouldPersistResult: false,
    hintToUse: null,
  }
}
