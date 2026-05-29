import { normalizeQuizQuestions } from '@/lib/course-content'

import type { QuizSourceData } from './types'

export function normalizeQuizData(data?: QuizSourceData | null) {
  if (!data) {
    return null
  }

  const rawItems = Array.isArray(data.questions)
    ? data.questions
    : Array.isArray(data.items)
      ? data.items
      : []

  return {
    ...data,
    items: undefined,
    passing_score: Number(data.passing_score) || 80,
    questions: normalizeQuizQuestions(rawItems),
  }
}
