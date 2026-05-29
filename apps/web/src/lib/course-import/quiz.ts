import { normalizeQuizQuestions } from '@/lib/course-content'

import type { QuizSourceData } from './types'

export function normalizeQuizData(data?: unknown) {
  if (!data || typeof data !== 'object') return null

  const quizData = data as QuizSourceData
  const rawItems = Array.isArray(quizData.questions)
    ? quizData.questions
    : (Array.isArray(quizData.items) ? quizData.items : [])

  return {
    ...quizData,
    questions: normalizeQuizQuestions(rawItems),
    items: undefined,
    passing_score: Number(quizData.passing_score) || 80,
  }
}
