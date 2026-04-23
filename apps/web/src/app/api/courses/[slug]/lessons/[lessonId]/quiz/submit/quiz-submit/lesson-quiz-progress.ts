import { SupabaseClient } from '@supabase/supabase-js'
import { lessonHasRequiredQuizzes } from './lesson-quiz-availability'

export async function syncLessonQuizProgress(
  supabase: SupabaseClient,
  params: {
    userId: string
    lessonId: string
    enrollmentId: string
    percentageScore: number
    isPassed: boolean
    existingSubmission: unknown
    didImproveBestScore: boolean
  },
) {
  const { userId, lessonId, enrollmentId, percentageScore, isPassed, existingSubmission, didImproveBestScore } = params
  if (!(await lessonHasRequiredQuizzes(supabase, lessonId))) return
  if (existingSubmission && !isPassed && !didImproveBestScore) return

  const now = new Date().toISOString()
  const { data: existingProgress } = await supabase
    .from('user_lesson_progress')
    .select('progress_id, quiz_progress_percentage, quiz_passed')
    .eq('enrollment_id', enrollmentId)
    .eq('lesson_id', lessonId)
    .single()

  const bestProgressScore = existingProgress?.quiz_progress_percentage
    ? Math.max(existingProgress.quiz_progress_percentage, percentageScore)
    : percentageScore
  const bestPassed = existingProgress?.quiz_passed || isPassed

  if (existingProgress) {
    const { error } = await supabase
      .from('user_lesson_progress')
      .update({ quiz_progress_percentage: bestProgressScore, quiz_completed: true, quiz_passed: bestPassed, updated_at: now })
      .eq('progress_id', existingProgress.progress_id)

    if (error) throw Object.assign(new Error('Error al actualizar el progreso del quiz'), { status: 500 })
    return
  }

  const { error } = await supabase.from('user_lesson_progress').insert({
    user_id: userId,
    lesson_id: lessonId,
    enrollment_id: enrollmentId,
    quiz_progress_percentage: bestProgressScore,
    quiz_completed: true,
    quiz_passed: bestPassed,
    started_at: now,
    last_accessed_at: now,
  })

  if (error) throw Object.assign(new Error('Error al guardar el progreso del quiz'), { status: 500 })
}
