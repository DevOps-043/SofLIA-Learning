import { calculateCourseProgress } from '@/lib/utils/lesson-progress'
import type { LessonRow, ProgressSummaryRow, SupabaseServerClient } from './types'

export async function recalculateOverallProgress(
  supabase: SupabaseServerClient,
  enrollmentId: string,
  lessons: LessonRow[],
  now: string,
) {
  const lessonIds = lessons.map((lesson) => lesson.lesson_id)
  const [materialQuizzesResult, activityQuizzesResult, allProgressResult] = await Promise.all([
    supabase.from('lesson_materials').select('lesson_id').in('lesson_id', lessonIds).eq('material_type', 'quiz'),
    supabase.from('lesson_activities').select('lesson_id').in('lesson_id', lessonIds).eq('activity_type', 'quiz').eq('is_required', true),
    supabase.from('user_lesson_progress').select('lesson_id, video_progress_percentage, quiz_passed').eq('enrollment_id', enrollmentId),
  ])

  const lessonsWithQuizzes = new Set<string>()
  ;(materialQuizzesResult.data || []).forEach((quiz) => lessonsWithQuizzes.add(quiz.lesson_id))
  ;(activityQuizzesResult.data || []).forEach((quiz) => lessonsWithQuizzes.add(quiz.lesson_id))

  const progressMap = new Map(((allProgressResult.data || []) as ProgressSummaryRow[]).map((progress) => [progress.lesson_id, progress]))
  const overallProgress = calculateCourseProgress(
    lessons.map((lesson) => ({
      lesson_id: lesson.lesson_id,
      video_progress_percentage: progressMap.get(lesson.lesson_id)?.video_progress_percentage || 0,
      quiz_passed: progressMap.get(lesson.lesson_id)?.quiz_passed || false,
    })),
    lessonsWithQuizzes,
  )

  const { data: previousEnrollment } = await supabase
    .from('user_course_enrollments')
    .select('enrollment_status')
    .eq('enrollment_id', enrollmentId)
    .single()

  await supabase
    .from('user_course_enrollments')
    .update({
      overall_progress_percentage: overallProgress,
      last_accessed_at: now,
      updated_at: now,
      enrollment_status: overallProgress === 100 ? 'completed' : 'active',
      completed_at: overallProgress === 100 ? now : null,
    })
    .eq('enrollment_id', enrollmentId)

  return { overallProgress, wasCompleted: previousEnrollment?.enrollment_status === 'completed' }
}
