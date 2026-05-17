import { deepParseJsonValue } from '@/lib/course-content'

export interface QuizQuestionLike {
  question?: unknown
  questionText?: unknown
}

export function getQuizQuestions(value: unknown): QuizQuestionLike[] {
  const parsed = deepParseJsonValue(value)

  if (Array.isArray(parsed)) {
    return parsed.filter(isQuizQuestionLike)
  }

  if (!parsed || typeof parsed !== 'object') {
    return []
  }

  const record = parsed as Record<string, unknown>
  const questions = Array.isArray(record.questions)
    ? record.questions
    : Array.isArray(record.items)
      ? record.items
      : []

  return questions.filter(isQuizQuestionLike)
}

export function extractQuizPlainText(value: unknown): string {
  return getQuizQuestions(value)
    .map((question) => {
      if (typeof question.question === 'string') return question.question
      if (typeof question.questionText === 'string') return question.questionText
      return ''
    })
    .filter(Boolean)
    .join(' ')
}

function isQuizQuestionLike(item: unknown): item is QuizQuestionLike {
  return typeof item === 'object' && item !== null
}
