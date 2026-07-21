import { resolveQuizPayload } from '@/features/courses/components/learn/activities/utils/quiz-payload'
import {
  isQuizAnswerCorrect,
  type QuizQuestion,
  type SelectedQuizAnswers,
} from '@/features/courses/components/learn/quiz.utils'

/**
 * Calificación autoritativa de quizzes en el servidor.
 *
 * SEGURIDAD: el endpoint de envío NO debe confiar en la clave de respuestas que
 * mande el cliente. Este servicio deriva las preguntas y su `correctAnswer` desde
 * el contenido almacenado en BD (`lesson_materials.content_data` /
 * `lesson_activities.activity_content`) usando exactamente la misma normalización
 * que el cliente (`resolveQuizPayload` -> `normalizeQuizQuestions`), de modo que
 * los IDs de pregunta y el orden de opciones coincidan y la respuesta del alumno
 * (índice de opción) se pueda calificar sin ambigüedad.
 */

const PASSING_THRESHOLD_PERCENT = 80

export interface GradedQuestionResult {
  questionId: string
  isCorrect: boolean
  /** Se revela SOLO en la respuesta post-envío, nunca en el payload de carga. */
  correctAnswer: string | number
  explanation: string | null
  points: number
}

export interface GradedQuizResult {
  totalQuestions: number
  correctAnswers: number
  pointsEarned: number
  totalPoints: number
  percentageScore: number
  isPassed: boolean
  perQuestion: GradedQuestionResult[]
}

/**
 * Deriva las preguntas calificables desde el contenido crudo almacenado en BD.
 * Devuelve `[]` si el contenido no es un quiz válido.
 */
export function resolveGradableQuizQuestions(
  rawStoredContent: unknown,
): QuizQuestion[] {
  const payload = resolveQuizPayload(rawStoredContent)
  return payload?.questions ?? []
}

/**
 * Califica las respuestas del alumno contra las preguntas derivadas del servidor.
 * `answers` está indexado por `questionId` y su valor es el índice de opción
 * seleccionado (o el texto de la opción), tal como lo envía el cliente.
 */
export function gradeQuiz(
  questions: QuizQuestion[],
  answers: SelectedQuizAnswers,
  passingThresholdPercent: number = PASSING_THRESHOLD_PERCENT,
): GradedQuizResult {
  const totalQuestions = questions.length

  let correctAnswers = 0
  let pointsEarned = 0
  let totalPoints = 0

  const perQuestion: GradedQuestionResult[] = questions.map((question) => {
    const questionPoints = question.points ?? 1
    totalPoints += questionPoints

    const selectedAnswer = answers[question.id]
    const isCorrect =
      selectedAnswer !== undefined && isQuizAnswerCorrect(question, selectedAnswer)

    if (isCorrect) {
      correctAnswers += 1
      pointsEarned += questionPoints
    }

    return {
      questionId: question.id,
      isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ? question.explanation : null,
      points: questionPoints,
    }
  })

  const percentageScore =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100 * 100) / 100
      : 0

  return {
    totalQuestions,
    correctAnswers,
    pointsEarned,
    totalPoints,
    percentageScore,
    isPassed: percentageScore >= passingThresholdPercent,
    perQuestion,
  }
}

export const QUIZ_PASSING_THRESHOLD_PERCENT = PASSING_THRESHOLD_PERCENT
