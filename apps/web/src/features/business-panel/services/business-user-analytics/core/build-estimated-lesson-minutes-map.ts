import { buildEstimatedActivityMinutesByLesson } from './build-estimated-activity-minutes-by-lesson'
import { CourseLessonRecord } from './course-lesson-record'
import { getEstimatedLessonMinutes } from './get-estimated-lesson-minutes'
import { LessonActivityRecord } from './lesson-activity-record'

export function buildEstimatedLessonMinutesMap(
  courseLessons: CourseLessonRecord[],
  lessonActivities: LessonActivityRecord[],
): Map<string, number> {
  const activityMinutesByLesson = buildEstimatedActivityMinutesByLesson(lessonActivities)

  return new Map(
    courseLessons.map((lesson) => [
      lesson.lesson_id,
      getEstimatedLessonMinutes(lesson, activityMinutesByLesson.get(lesson.lesson_id) || 0),
    ]),
  )
}
