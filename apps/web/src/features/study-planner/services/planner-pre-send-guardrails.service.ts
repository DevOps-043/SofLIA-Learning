import {
  LOOP_PATTERNS,
  PROMPT_INJECTION_PATTERNS,
} from './planner-guardrails.constants'
import {
  buildLoopEscapeInstruction,
  normalizePlannerText,
} from './planner-guardrails-text.utils'
import type {
  ApplyPlannerPreSendGuardrailsParams,
  PlannerPreSendGuardrailResult,
} from './planner-guardrails.types'

export function applyPlannerPreSendGuardrails(
  params: ApplyPlannerPreSendGuardrailsParams,
): PlannerPreSendGuardrailResult {
  const normalizedMessage = normalizePlannerText(params.message)
  const normalizedEnrichedMessage = normalizePlannerText(params.enrichedMessage)

  const hasInjectionAttempt = PROMPT_INJECTION_PATTERNS.some((pattern) =>
    pattern.test(normalizedMessage) || pattern.test(normalizedEnrichedMessage),
  )

  if (hasInjectionAttempt) {
    return {
      blocked: true,
      enrichedMessage: params.enrichedMessage,
      assistantMessage:
        'Entiendo que quieres probar diferentes cosas, pero estoy aqui especificamente para ayudarte con tu plan de estudios. Â¿En que puedo asistirte con la planificacion de tus cursos?',
    }
  }

  const lastAssistantMessages = params.conversationHistory
    .filter((entry) => entry.role === 'assistant')
    .slice(-5)

  const loopCount = lastAssistantMessages.filter((entry) => {
    const normalizedContent = normalizePlannerText(entry.content)
    return LOOP_PATTERNS.some((pattern) => pattern.test(normalizedContent))
  }).length

  if (loopCount >= 2) {
    return {
      blocked: false,
      enrichedMessage: buildLoopEscapeInstruction(params.message),
    }
  }

  return {
    blocked: false,
    enrichedMessage: params.enrichedMessage,
  }
}
