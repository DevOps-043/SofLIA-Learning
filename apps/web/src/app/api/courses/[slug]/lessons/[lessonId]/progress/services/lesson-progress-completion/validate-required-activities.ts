import { computeLessonActivityProgress } from '@/features/courses/services/activity-submission.server.service'
import { LessonProgressError } from '../lesson-progress.shared'
import type { SupabaseServerClient } from './types'

export async function validateRequiredActivities(
  supabase: SupabaseServerClient,
  userId: string,
  courseId: string,
  courseTitle: string,
  instructorId: string | null,
  lessonId: string,
  enrollmentId: string,
) {
  const activityProgress = await computeLessonActivityProgress(supabase, {
    courseId,
    courseTitle,
    enrollmentId,
    instructorId,
    lessonId,
    organizationId: null,
    userId,
  })

  if (
    activityProgress.requiredActivitiesTotal === 0 ||
    activityProgress.requiredActivitiesCompleted >= activityProgress.requiredActivitiesTotal
  ) {
    return
  }

  throw new LessonProgressError('REQUIRED_ACTIVITY_NOT_COMPLETED', 400, 'Hace falta realizar actividad', {
    totalRequired: activityProgress.requiredActivitiesTotal,
    passed: activityProgress.requiredActivitiesCompleted,
    message: `Debes completar todas las actividades obligatorias (${activityProgress.requiredActivitiesCompleted}/${activityProgress.requiredActivitiesTotal} completadas)`,
  })
}
