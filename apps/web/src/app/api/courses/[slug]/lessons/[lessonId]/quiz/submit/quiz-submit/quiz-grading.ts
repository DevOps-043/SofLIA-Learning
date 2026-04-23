import { isAnswerCorrect } from './answer-evaluation'
import { QuizGradeResult, QuizQuestionRow, QuizSubmitRequestBody } from './types'

// Default threshold used when the quiz record does not define its own pass_threshold.
// TODO(migration): Add a `pass_threshold` column to the `quizzes` table so each quiz
// can define its own passing criteria. Read it via resolveQuizContext and pass it here.
const DEFAULT_QUIZ_PASS_THRESHOLD_PERCENT = 80

export function extractQuizQuestions(quizData: QuizSubmitRequestBody['quizData']) {
  if (Array.isArray(quizData)) return quizData
  return Array.isArray(quizData?.questions) ? quizData.questions : []
}

export function gradeQuizAttempt(
  body: QuizSubmitRequestBody,
  passThresholdPercent: number = DEFAULT_QUIZ_PASS_THRESHOLD_PERCENT,
): QuizGradeResult {
  const questions = extractQuizQuestions(body.quizData)
  const answers = body.answers || {}

  const { correctAnswers, pointsEarned } = questions.reduce(
    (result, question) => {
      const questionId = question.id || question.question_id
      const selectedAnswer = questionId ? answers[questionId] : undefined
      if (selectedAnswer === undefined || !isAnswerCorrect(question, selectedAnswer)) return result
      return { correctAnswers: result.correctAnswers + 1, pointsEarned: result.pointsEarned + (question.points || 1) }
    },
    { correctAnswers: 0, pointsEarned: 0 },
  )

  const totalQuestions = questions.length
  const percentageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 10000) / 100 : 0
  return {
    calculatedTotalPoints: body.totalPoints ?? questions.reduce((sum, question) => sum + (question.points || 1), 0),
    correctAnswers,
    isPassed: percentageScore >= passThresholdPercent,
    percentageScore,
    pointsEarned,
    questions: questions as QuizQuestionRow[],
    totalQuestions,
  }
}
