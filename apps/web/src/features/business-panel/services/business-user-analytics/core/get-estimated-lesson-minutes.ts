import { CourseLessonRecord } from './course-lesson-record'

export function getEstimatedLessonMinutes(lesson: CourseLessonRecord, activityMinutes: number): number {
  const totalMinutes = Number(lesson.total_duration_minutes)
  if (Number.isFinite(totalMinutes) && totalMinutes > 0) {
    return totalMinutes
  }

  const durationSeconds = Number(lesson.duration_seconds)
  if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
    return Math.round(((durationSeconds / 60) + activityMinutes) * 10) / 10
  }

  return activityMinutes
}
