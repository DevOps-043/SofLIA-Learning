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
    if (Array.isArray(parsed)) return parsed as QuizQuestion[]
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) {
      return parsed.questions as QuizQuestion[]
    }
  } catch {}
  return []
}

export function parseRubricText(items: ActivityValidationRubricItem[]): string {
  return items.map((item) => item.description?.trim() || item.label).join('\n')
}
