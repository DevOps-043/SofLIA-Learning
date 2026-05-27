import { logger } from '@/lib/logger'

import type { ActivitySubmissionDetail } from '../types/activity-config'
import type { CourseActivityContext } from './activity-submission/types'

interface NotifyCourseActivityCompletedInput {
  context: CourseActivityContext
  courseSlug: string
  nextSubmission: ActivitySubmissionDetail | null
  previousSubmission: ActivitySubmissionDetail | null
}

export async function notifyCourseActivityCompletedBestEffort({
  context,
  courseSlug,
  nextSubmission,
  previousSubmission,
}: NotifyCourseActivityCompletedInput) {
  if (!nextSubmission?.completionSatisfied || previousSubmission?.completionSatisfied) {
    return
  }

  try {
    const { AutoNotificationsService } = await import(
      '@/features/notifications/services/auto-notifications.service'
    )

    await AutoNotificationsService.notifyCourseActivityCompleted(
      context.userId,
      context.courseId,
      context.courseTitle,
      context.lessonId,
      context.activity.activity_id,
      context.activity.activity_title || 'Actividad',
      {
        action_url: `/courses/${courseSlug}/learn`,
        courseSlug,
        organization_id: context.organizationId || undefined,
        source: 'course_activity_submission',
        submission_id: nextSubmission.submissionId,
      },
    )
  } catch (error) {
    logger.warn('No se pudo crear notificacion de actividad completada:', {
      activityId: context.activity.activity_id,
      error: error instanceof Error ? error.message : String(error),
      userId: context.userId,
    })
  }
}
