import { normalizeQuizQuestions } from '@/lib/course-content'

import type { QuizQuestion } from '../../quiz.utils'
import { parseJsonIfPossible } from './json'

export type QuizPayload = {
  questions: QuizQuestion[]
  totalPoints?: number
}

export function resolveQuizPayload(rawContent: unknown): QuizPayload | null {
  const parsedQuiz = parseJsonIfPossible(rawContent)

  let questions: unknown = parsedQuiz
  let totalPoints: number | undefined

  if (parsedQuiz && typeof parsedQuiz === 'object' && !Array.isArray(parsedQuiz) && 'questions' in parsedQuiz) {
    const quizRecord = parsedQuiz as { questions?: unknown; totalPoints?: unknown }

    questions = quizRecord.questions
    totalPoints = typeof quizRecord.totalPoints === 'number' ? quizRecord.totalPoints : undefined
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return null
  }

  const hasValidStructure = questions.every(
    (question) => question && typeof question === 'object' && ('question' in question || 'id' in question),
  )

  if (!hasValidStructure) {
    return null
  }

  // Resuelve correctAnswer al texto exacto de la opción (índices/letras/prefijos)
  // para que la calificación funcione aunque el contenido importado venga inconsistente.
  return {
    questions: normalizeQuizQuestions(questions as QuizQuestion[]) as unknown as QuizQuestion[],
    totalPoints,
  }
}
