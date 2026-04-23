import { hasPassedRequiredQuizzes, LessonProgressError } from '../lesson-progress.shared'
import type { QuizSubmissionRow, SupabaseServerClient } from './types'

export async function validateRequiredQuizzes(
  supabase: SupabaseServerClient,
  userId: string,
  lessonId: string,
  enrollmentId: string,
) {
  const [materialQuizzes, activityQuizzes] = await Promise.all([
    supabase.from('lesson_materials').select('material_id').eq('lesson_id', lessonId).eq('material_type', 'quiz'),
    supabase.from('lesson_activities').select('activity_id').eq('lesson_id', lessonId).eq('activity_type', 'quiz').eq('is_required', true),
  ])

  const materialIds = (materialQuizzes.data || []).map((quiz) => quiz.material_id)
  const activityIds = (activityQuizzes.data || []).map((quiz) => quiz.activity_id)
  const totalRequiredQuizzes = materialIds.length + activityIds.length
  if (totalRequiredQuizzes === 0) return

  let submissionsQuery = supabase
    .from('user_quiz_submissions')
    .select('is_passed')
    .eq('user_id', userId)
    .eq('lesson_id', lessonId)
    .eq('enrollment_id', enrollmentId)

  if (materialIds.length > 0 && activityIds.length > 0) {
    submissionsQuery = submissionsQuery.or(`material_id.in.(${materialIds.join(',')}),activity_id.in.(${activityIds.join(',')})`)
  } else if (materialIds.length > 0) {
    submissionsQuery = submissionsQuery.in('material_id', materialIds)
  } else if (activityIds.length > 0) {
    submissionsQuery = submissionsQuery.in('activity_id', activityIds)
  }

  const { data: submissions } = await submissionsQuery
  if (hasPassedRequiredQuizzes(totalRequiredQuizzes, (submissions || []) as QuizSubmissionRow[])) return

  const passedSubmissions = (submissions || []).filter((submission) => submission.is_passed).length
  throw new LessonProgressError('REQUIRED_QUIZ_NOT_PASSED', 400, 'Hace falta realizar actividad', {
    totalRequired: totalRequiredQuizzes,
    passed: passedSubmissions,
    message: `Debes completar y aprobar todos los quizzes obligatorios (${passedSubmissions}/${totalRequiredQuizzes} completados)`,
  })
}
