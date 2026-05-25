import type { UserCourseEnrollmentRow } from './courses.mappers'
import type { UpdateProgressInput } from './courses.types'

export function buildLessonProgressPayload(
  userId: string,
  lessonId: string,
  enrollment: UserCourseEnrollmentRow,
  data: UpdateProgressInput,
) {
  const now = new Date().toISOString()
  const lessonStatus =
    data.isCompleted === true
      ? 'completed'
      : data.progressPercent > 0
        ? 'in_progress'
        : 'not_started'

  return {
    payload: {
      user_id: userId,
      lesson_id: lessonId,
      enrollment_id: enrollment.enrollment_id,
      time_spent_minutes:
        data.timeSpentSeconds !== undefined
          ? Math.max(0, Math.round(data.timeSpentSeconds / 60))
          : undefined,
      is_completed: data.isCompleted,
      completed_at:
        data.isCompleted === true
          ? now
          : data.isCompleted === false
            ? null
            : undefined,
      last_accessed_at: now,
      current_time_seconds: data.lastPosition,
      video_progress_percentage: data.progressPercent,
      lesson_status: lessonStatus,
      updated_at: now,
    },
    now,
  }
}
