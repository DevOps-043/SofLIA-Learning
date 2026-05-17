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

  return hasValidStructure
    ? { questions: questions as QuizQuestion[], totalPoints }
    : null
}
