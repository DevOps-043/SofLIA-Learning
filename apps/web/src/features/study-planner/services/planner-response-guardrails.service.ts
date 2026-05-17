import {
  FINAL_SUMMARY_RESPONSE_TOKENS,
  PROMPT_LEAK_PREFIXES,
} from './planner-guardrails.constants'
import {
  includesAny,
  normalizePlannerText,
  sanitizeHolidayMentions,
} from './planner-guardrails-text.utils'
import type { PlannerFinalSaveGuardrailParams } from './planner-guardrails.types'

export function sanitizePlannerAssistantResponse(value: string): string {
  const normalizedValue = normalizePlannerText(value)

  if (PROMPT_LEAK_PREFIXES.some((prefix) => normalizedValue.startsWith(prefix))) {
    return 'Perfecto. Vamos a continuar. Â¿Que mas necesitas para tu plan de estudios?'
  }

  return sanitizeHolidayMentions(value)
}

export function shouldMarkFinalSummaryFromResponse(value: string): boolean {
  return includesAny(normalizePlannerText(value), FINAL_SUMMARY_RESPONSE_TOKENS)
}

export function shouldOpenCourseSelectorFromResponse(value: string): boolean {
  const normalizedValue = normalizePlannerText(value)

  return normalizedValue.includes('seleccionar cursos') ||
    normalizedValue.includes('que cursos') ||
    normalizedValue.includes('cursos te gustaria incluir')
}

export function shouldTriggerPlannerFinalSave(
  params: PlannerFinalSaveGuardrailParams,
): boolean {
  if (params.savedLessonDistributionCount === 0) {
    return false
  }

  const normalizedMessage = normalizePlannerText(params.userMessage)
  const normalizedResponse = normalizePlannerText(params.liaResponse)

  const userConfirmed = /^(si|ok|claro|perfecto|me parece|esta bien|adelante|dale|va|seguro|gracias|genial)/i
    .test(normalizedMessage)

  const liaConfirmedSaving = /(guardad|guardar|exito|comenzar|dashboard|redireccion|creado|alegra|disfrut)/i
    .test(normalizedResponse)

  return userConfirmed && liaConfirmedSaving
}
