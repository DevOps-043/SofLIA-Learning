import { LessonProgressError } from '../lesson-progress.shared'
import { ensureEnrollment } from './ensure-enrollment'
import { loadCourseAndLessons } from './load-course-and-lessons'
import { recalculateOverallProgress } from './recalculate-overall-progress'
import { triggerLessonProgressSideEffectsAsync } from './side-effects'
import { upsertLessonProgress } from './upsert-lesson-progress'
import { validatePreviousLessonCompletion } from './validate-lesson-order'
import { validateRequiredActivities } from './validate-required-activities'
import { validateRequiredQuizzes } from './validate-required-quizzes'
import type { SupabaseServerClient } from './types'

export async function completeLessonProgress(
  supabase: SupabaseServerClient,
  userId: string,
  slug: string,
  lessonId: string,
  organizationId?: string | null,
) {
  const { course, lessons } = await loadCourseAndLessons(supabase, slug)
  const lessonIndex = lessons.findIndex((lesson) => lesson.lesson_id === lessonId)
  if (lessonIndex === -1) {
    throw new LessonProgressError('LESSON_NOT_FOUND', 404, 'Leccion no encontrada')
  }

  const enrollment = await ensureEnrollment(supabase, userId, course.id, organizationId)
  await validatePreviousLessonCompletion(supabase, enrollment.enrollment_id, lessons, lessonIndex)
  await validateRequiredQuizzes(supabase, userId, lessonId, enrollment.enrollment_id)
  await validateRequiredActivities(supabase, userId, course.id, course.title, course.instructor_id, lessonId, enrollment.enrollment_id)

  const now = new Date().toISOString()
  await upsertLessonProgress(supabase, userId, lessonId, enrollment.enrollment_id, now)
  const { overallProgress, wasCompleted } = await recalculateOverallProgress(supabase, enrollment.enrollment_id, lessons, now)

  triggerLessonProgressSideEffectsAsync(
    {
      supabase,
      userId,
      courseId: course.id,
      enrollmentId: enrollment.enrollment_id,
      courseTitle: course.title,
      lessonId,
      lessonTitle: lessons[lessonIndex]?.lesson_title,
      instructorId: course.instructor_id,
      wasCompleted,
      now,
    },
    overallProgress,
  )

  return { lessonId, overallProgress }
}
