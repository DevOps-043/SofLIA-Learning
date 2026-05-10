import type {
  DialogueActivityConfig,
  DialogueEvaluationResult,
  DialoguePolicyDecision,
  DialogueState,
} from '../../types/dialogue-runtime'

type DialoguePolicyInput = {
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
) {
  const met = new Set(evaluation.criteriaMet)
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
  const requiredCriteriaMet = allRequiredCriteriaMet(config, evaluation)
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

  if (
    evaluation.overallScore >= policy.approvalMinimum &&
    requiredCriteriaMet &&
    evaluation.decision === 'complete'
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

  if (
    input.lowEvidenceTurns >= policy.rescueAfterLowEvidenceTurns &&
    input.hintsUsed >= policy.maxHints
  ) {
    return {
      nextState: 'RESCUE',
      nextAction: 'explain_rescue_model',
      reason: 'Hay baja evidencia repetida y ya se agotaron las pistas disponibles.',
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
