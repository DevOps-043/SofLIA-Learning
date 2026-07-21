import { deepParseJsonValue } from './json'
import { isQuizLikeContent } from './quiz'
import { stripQuizAnswerKey } from './quiz-sanitize'
import { extractDisplayContent } from './display-content'
import { isDisplayablePlainString } from './normalizer-utils'

export function normalizeImportedActivityContent(
  activityType: string | null | undefined,
  rawContent: unknown,
): string {
  if (activityType === 'quiz' || activityType === 'lia_script' || activityType === 'ai_chat') {
    return typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent ?? {})
  }

  const displayContent = extractDisplayContent(rawContent)
  if (displayContent) return displayContent
  return typeof rawContent === 'string' && isDisplayablePlainString(rawContent) ? rawContent : ''
}

export function normalizeImportedMaterialContent(rawContent: unknown): unknown {
  const parsed = deepParseJsonValue(rawContent)
  if (parsed === null || parsed === undefined) return null

  if (typeof parsed === 'string') return isDisplayablePlainString(parsed) ? parsed : null
  if (isQuizLikeContent(parsed)) return parsed

  return extractDisplayContent(parsed) ?? null
}

export function normalizeActivityContentForClient(
  activityType: string | null | undefined,
  rawContent: unknown,
): unknown {
  const parsed = deepParseJsonValue(rawContent)
  // SEGURIDAD: nunca enviar la clave de respuestas del quiz al cliente.
  if (activityType === 'quiz') return stripQuizAnswerKey(parsed)
  if (activityType === 'ai_chat') return parsed

  const displayContent = extractDisplayContent(parsed)
  if (displayContent) return displayContent
  return typeof parsed === 'string' && isDisplayablePlainString(parsed) ? parsed : ''
}

export function normalizeMaterialContentForClient(
  materialType: string | null | undefined,
  rawContent: unknown,
  fallbackDescription?: unknown,
): unknown {
  const parsed = deepParseJsonValue(rawContent)
  // SEGURIDAD: nunca enviar la clave de respuestas del quiz al cliente.
  if (materialType === 'quiz') return stripQuizAnswerKey(parsed)

  const displayContent = extractDisplayContent(parsed) ?? extractDisplayContent(fallbackDescription)
  if (displayContent) return displayContent

  if (typeof parsed === 'string' && isDisplayablePlainString(parsed)) {
    return parsed
  }

  return fallbackDescription ?? null
}

export function normalizeContentForRenderer(content: unknown): string {
  if (content === null || content === undefined) return ''

  const displayContent = extractDisplayContent(content)
  if (displayContent) return displayContent

  const parsed = deepParseJsonValue(content)
  return typeof parsed === 'string' && isDisplayablePlainString(parsed) ? parsed : ''
}
