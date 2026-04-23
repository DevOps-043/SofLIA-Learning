import type { QuizSourceData } from './types'

function normalizeCorrectAnswer(
  correctAnswer: string | number | undefined,
  options: string[],
) {
  if (typeof correctAnswer === 'number' && options[correctAnswer]) {
    return options[correctAnswer]
  }
  if (typeof correctAnswer === 'string') return correctAnswer
  return String(correctAnswer || '')
}

export function normalizeQuizData(data?: QuizSourceData | null) {
  if (!data) return null

  const rawItems = Array.isArray(data.questions)
    ? data.questions
    : Array.isArray(data.items)
      ? data.items
      : []

  const questions = rawItems.map((question) => {
    const options = Array.isArray(question.options)
      ? question.options.map((option) => typeof option === 'string' ? option : String(option))
      : []
    const correctAnswer = question.correctAnswer ?? question.correct_answer

    return {
      id: question.id || `q-${Math.random().toString(36).substr(2, 9)}`,
      question: question.question || question.questionText || '',
      questionType: (question.questionType || question.type || 'multiple_choice').toLowerCase(),
      options,
      correctAnswer: normalizeCorrectAnswer(correctAnswer, options),
      explanation: question.explanation || '',
      points: Number(question.points) || 1,
    }
  })

  return {
    ...data,
    questions,
    items: undefined,
    passing_score: Number(data.passing_score) || 80,
  }
}
