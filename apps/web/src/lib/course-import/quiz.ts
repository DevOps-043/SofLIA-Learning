import type { QuizSourceData } from './types'

export function normalizeQuizData(data?: unknown) {
  if (!data || typeof data !== 'object') return null

  const quizData = data as QuizSourceData
  const rawItems = Array.isArray(quizData.questions)
    ? quizData.questions
    : (Array.isArray(quizData.items) ? quizData.items : [])
  const questions = rawItems.map((question) => {
    const options = Array.isArray(question.options) ? question.options.map(String) : []
    let correctAnswer = question.correctAnswer ?? question.correct_answer ?? ''

    if (typeof correctAnswer === 'number' && options[correctAnswer]) {
      correctAnswer = options[correctAnswer]
    } else if (typeof correctAnswer !== 'string') {
      correctAnswer = String(correctAnswer)
    }

    return {
      id: question.id || `q-${Math.random().toString(36).substr(2, 9)}`,
      question: question.question || question.questionText || '',
      questionType: (question.questionType || question.type || 'multiple_choice').toLowerCase(),
      options,
      correctAnswer,
      explanation: question.explanation || '',
      points: Number(question.points) || 1,
    }
  })

  return {
    ...quizData,
    questions,
    items: undefined,
    passing_score: Number(quizData.passing_score) || 80,
  }
}
