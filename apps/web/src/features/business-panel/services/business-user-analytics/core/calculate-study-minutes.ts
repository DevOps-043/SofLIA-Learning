import { buildEstimatedLessonMinutesMap } from './build-estimated-lesson-minutes-map'
import { CourseLessonRecord } from './course-lesson-record'
import { getLessonTrackingMinutes } from './get-lesson-tracking-minutes'
import { isCompletedStatus } from './is-completed-status'
import { LessonActivityRecord } from './lesson-activity-record'
import { LessonProgressRecord } from './lesson-progress-record'
import { LessonTrackingRecord } from './lesson-tracking-record'
import { roundNumber } from './round-number'

export function calculateStudyMinutes(
  lessonProgress: LessonProgressRecord[],
  lessonTracking: LessonTrackingRecord[],
  courseLessons: CourseLessonRecord[],
  lessonActivities: LessonActivityRecord[],
  isCourseCompleted: boolean,
): number {
  const progressMinutesByLesson = new Map<string, number>()
  const completedLessonIds = new Set<string>()
  lessonProgress.forEach((progress) => {
    progressMinutesByLesson.set(
      progress.lesson_id,
      (progressMinutesByLesson.get(progress.lesson_id) || 0) + (Number(progress.time_spent_minutes) || 0),
    )
    if (progress.is_completed || progress.lesson_status === 'completed') {
      completedLessonIds.add(progress.lesson_id)
    }
  })

  const trackingMinutesByLesson = new Map<string, number>()
  lessonTracking.forEach((tracking) => {
    trackingMinutesByLesson.set(
      tracking.lesson_id,
      (trackingMinutesByLesson.get(tracking.lesson_id) || 0) + getLessonTrackingMinutes(tracking),
    )
    if (isCompletedStatus(tracking.status) || tracking.completed_at) {
      completedLessonIds.add(tracking.lesson_id)
    }
  })

  const estimatedMinutesByLesson = buildEstimatedLessonMinutesMap(courseLessons, lessonActivities)
  if (isCourseCompleted && completedLessonIds.size === 0) {
    courseLessons.forEach((lesson) => completedLessonIds.add(lesson.lesson_id))
  }

  const lessonIds = new Set([
    ...progressMinutesByLesson.keys(),
    ...trackingMinutesByLesson.keys(),
    ...completedLessonIds,
  ])
  let total = 0
  lessonIds.forEach((lessonId) => {
    const progressMinutes = progressMinutesByLesson.get(lessonId) || 0
    const trackingMinutes = trackingMinutesByLesson.get(lessonId) || 0
    const actualMinutes = progressMinutes > 0 ? progressMinutes : trackingMinutes
    if (actualMinutes > 0) {
      total += actualMinutes
      return
    }

    if (completedLessonIds.has(lessonId)) {
      total += estimatedMinutesByLesson.get(lessonId) || 0
    }
  })

  return roundNumber(total)
}
