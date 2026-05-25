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

  const normalizedQuestions = rawItems.map((question) => {
    const options = Array.isArray(question.options)
      ? question.options.map((option) =>
          typeof option === 'string' ? option : String(option)
        )
      : []

    return {
      correctAnswer: normalizeCorrectAnswer(question.correctAnswer, question.correct_answer, options),
      explanation: question.explanation || '',
      id: question.id || `q-${Math.random().toString(36).substr(2, 9)}`,
      options,
      points: Number(question.points) || 1,
      question: question.question || question.questionText || '',
      questionType: (question.questionType || question.type || 'multiple_choice').toLowerCase(),
    }
  })

  return {
    ...data,
    items: undefined,
    passing_score: Number(data.passing_score) || 80,
    questions: normalizedQuestions,
  }
}

function normalizeCorrectAnswer(
  correctAnswer: string | number | undefined,
  correctAnswerSnake: string | number | undefined,
  options: string[]
): string {
  let normalized =
    correctAnswer !== undefined
      ? correctAnswer
      : correctAnswerSnake !== undefined
        ? correctAnswerSnake
        : ''

  if (typeof normalized === 'number' && options[normalized]) {
    normalized = options[normalized]
  }

  return typeof normalized === 'string' ? normalized : String(normalized)
}
