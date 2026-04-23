import { SupabaseClient } from '@supabase/supabase-js'
import { gradeQuizAttempt } from './quiz-grading'
import { resolveQuizContext } from './quiz-context'
import { buildQuizAttemptMessage } from './response-message'
import { syncLessonQuizProgress } from './lesson-quiz-progress'
import { persistQuizSubmission } from './submission-persistence'
import { ApiRouteResult, QuizSubmitRequestBody } from './types'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Returns a trimmed, validated UUID or null. Rejects non-UUID strings to prevent malformed DB queries. */
function resolveOrganizationId(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return UUID_REGEX.test(trimmed) ? trimmed : null
}

export async function submitQuizAttempt(
  supabase: SupabaseClient,
  params: { slug: string; lessonId: string; userId: string; body: QuizSubmitRequestBody },
): Promise<ApiRouteResult> {
  const { slug, lessonId, userId, body } = params
  if (!body.answers || !body.quizData || (!body.materialId && !body.activityId)) {
    return { status: 400, body: { error: 'Datos incompletos: se requieren answers, quizData y materialId o activityId' } }
  }

  const organizationId = resolveOrganizationId(body.organizationId)

  const { enrollmentId } = await resolveQuizContext(supabase, slug, lessonId, userId, organizationId)
  const grade = gradeQuizAttempt(body)
  const persistence = await persistQuizSubmission(supabase, { userId, lessonId, enrollmentId, body, grade })

  await syncLessonQuizProgress(supabase, {
    userId,
    lessonId,
    enrollmentId,
    percentageScore: grade.percentageScore,
    isPassed: grade.isPassed,
    existingSubmission: persistence.existingSubmission,
    didImproveBestScore: persistence.didImproveBestScore,
  })

  return {
    status: 200,
    body: {
      success: true,
      message: buildQuizAttemptMessage(persistence),
      saved: persistence.shouldPersistAttempt,
      result: {
        score: grade.correctAnswers,
        totalQuestions: grade.totalQuestions,
        totalPoints: grade.calculatedTotalPoints,
        pointsEarned: grade.pointsEarned,
        percentage: grade.percentageScore,
        isPassed: grade.isPassed,
        submission: persistence.submissionResult,
        bestScore: persistence.bestScore,
      },
    },
  }
}
