import { normalizeQuizQuestions } from '@/lib/course-content'

import type { QuizQuestion } from '../QuizBuilder'
import type { ActivityValidationRubricItem } from '@/features/courses/types/activity-config'

export function parsePromptList(rawPrompts: string | null | undefined): string[] {
  if (!rawPrompts) return ['']
  try {
    const parsed = JSON.parse(rawPrompts)
    if (Array.isArray(parsed)) {
      const items = parsed.map((item) => String(item).trim()).filter(Boolean)
      return items.length > 0 ? items : ['']
    }
  } catch {}
  const items = rawPrompts.split('\n').map((item) => item.trim()).filter(Boolean)
  return items.length > 0 ? items : ['']
}

export function parseQuizQuestions(rawContent: string): QuizQuestion[] {
  try {
    const parsed = JSON.parse(rawContent)
    const rawQuestions = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)
        ? parsed.questions
        : null
    if (rawQuestions) {
      // Resuelve correctAnswer (índices/letras/prefijos) y canoniza V/F al cargar,
      // para que el editor muestre la respuesta correcta seleccionada.
      return normalizeQuizQuestions(rawQuestions) as unknown as QuizQuestion[]
    }
  } catch {}
  return []
}

export function parseRubricText(items: ActivityValidationRubricItem[]): string {
  return items.map((item) => item.description?.trim() || item.label).join('\n')
}
