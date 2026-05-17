import { CourseLessonRecord } from './course-lesson-record'
import { getCourseIdFromLesson } from './get-course-id-from-lesson'
import { getNonNegativeNumber } from './get-non-negative-number'
import { getRelevantActivityCount } from './get-relevant-activity-count'
import { groupLessonActivitiesByLesson } from './group-lesson-activities-by-lesson'
import { hasLessonActivityProgressSignal } from './has-lesson-activity-progress-signal'
import { isLessonCompleted } from './is-lesson-completed'
import { LessonActivityRecord } from './lesson-activity-record'
import { LessonProgressRecord } from './lesson-progress-record'
import { normalizeLessonActivityProgress } from './normalize-lesson-activity-progress'

export function buildActivityProgressFallback(
  lessonProgress: LessonProgressRecord[],
  lessonActivities: LessonActivityRecord[],
  courseLessons: CourseLessonRecord[],
  completedCourseIds: Set<string>,
  shouldUseFallback: boolean,
): {
  completed: number
  dates: string[]
  scores: number[]
  total: number
} {
  if (!shouldUseFallback) {
    return {
      completed: 0,
      dates: [],
      scores: [],
      total: 0,
    }
  }

  const activitiesByLesson = groupLessonActivitiesByLesson(lessonActivities)
  const rows = lessonProgress.filter((progress) =>
    hasLessonActivityProgressSignal(progress) ||
    (isLessonCompleted(progress) && getRelevantActivityCount(activitiesByLesson.get(progress.lesson_id) || []) > 0),
  )
  const processedLessonIds = new Set<string>()
  let completed = 0
  let total = 0
  const scores: number[] = []
  const dates: string[] = []

  rows.forEach((progress) => {
    processedLessonIds.add(progress.lesson_id)
    const lessonActivitiesForProgress = activitiesByLesson.get(progress.lesson_id) || []
    const inferredActivityTotal = getRelevantActivityCount(lessonActivitiesForProgress)
    const requiredTotal = getNonNegativeNumber(progress.required_activities_total)
    const requiredCompleted = Math.min(
      getNonNegativeNumber(progress.required_activities_completed),
      requiredTotal > 0 ? requiredTotal : Number.POSITIVE_INFINITY,
    )
    const progressScore = normalizeLessonActivityProgress(progress)
    const canInferFromCompletedLesson =
      requiredTotal === 0 &&
      progressScore === 0 &&
      inferredActivityTotal > 0 &&
      isLessonCompleted(progress)

    if (canInferFromCompletedLesson) {
      total += inferredActivityTotal
      completed += inferredActivityTotal
      scores.push(100)
    } else if (requiredTotal > 0) {
      total += requiredTotal
      completed += requiredCompleted
      scores.push(progressScore)
    } else {
      total += 1
      if (progressScore >= 100 || requiredCompleted > 0) {
        completed += 1
      }
      scores.push(progressScore)
    }

    const activityDate =
      progress.last_activity_submission_at ||
      progress.updated_at ||
      progress.completed_at ||
      progress.last_accessed_at
    if (activityDate) dates.push(activityDate)
  })

  courseLessons.forEach((lesson) => {
    if (processedLessonIds.has(lesson.lesson_id)) return
    const courseId = getCourseIdFromLesson(lesson)
    if (!courseId || !completedCourseIds.has(courseId)) return

    const inferredActivityTotal = getRelevantActivityCount(activitiesByLesson.get(lesson.lesson_id) || [])
    if (inferredActivityTotal === 0) return

    total += inferredActivityTotal
    completed += inferredActivityTotal
    scores.push(100)
  })

  return {
    completed,
    dates,
    scores,
    total,
  }
}
