import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type {
  BusinessUserStatsActivityCompletionRecord,
  BusinessUserStatsCourseModuleRecord,
  BusinessUserStatsLessonActivityCatalogRecord,
  BusinessUserStatsLessonCountRecord,
} from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

export function applyActivityStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  completions: BusinessUserStatsActivityCompletionRecord[],
  lessonActivities: BusinessUserStatsLessonActivityCatalogRecord[] = [],
  lessonCounts: BusinessUserStatsLessonCountRecord[] = [],
  courseModules: BusinessUserStatsCourseModuleRecord[] = [],
) {
  const courseIdByLessonId = buildCourseIdByLessonId(lessonCounts, courseModules)
  const catalogActivityIdsByCourse = buildCatalogActivityIdsByCourse(lessonActivities, courseIdByLessonId)
  const completedActivityIdsByCourse = new Map<string, Set<string>>()

  completions.forEach((completion) => {
    const activity = unwrapRelation(completion.lesson_activities)
    const courseId = unwrapRelation(activity?.course_lessons)?.course_modules
    const resolvedCourseId = unwrapRelation(courseId)?.course_id
    if (!resolvedCourseId || !courseStatsMap.has(resolvedCourseId)) return

    if (completion.status === 'completed') {
      const catalogActivityIds = catalogActivityIdsByCourse.get(resolvedCourseId)
      if (catalogActivityIds && !catalogActivityIds.has(completion.activity_id)) return
      const completedIds = completedActivityIdsByCourse.get(resolvedCourseId) || new Set<string>()
      completedIds.add(completion.activity_id)
      completedActivityIdsByCourse.set(resolvedCourseId, completedIds)
    }
  })

  courseStatsMap.forEach((stats, courseId) => {
    const catalogActivityIds = catalogActivityIdsByCourse.get(courseId)
    const completedActivityIds = completedActivityIdsByCourse.get(courseId) || new Set<string>()

    stats.activities_total = catalogActivityIds?.size || countCompletionRowsForCourse(completions, courseId)
    stats.activities_completed = completedActivityIds.size
    stats.lia_activities_completed = completedActivityIds.size
  })
}

function buildCourseIdByLessonId(
  lessonCounts: BusinessUserStatsLessonCountRecord[],
  courseModules: BusinessUserStatsCourseModuleRecord[],
) {
  const courseIdByModuleId = new Map(courseModules.map((module) => [module.module_id, module.course_id]))

  return lessonCounts.reduce((map, lesson) => {
    const courseId = courseIdByModuleId.get(lesson.module_id)
    if (courseId) map.set(lesson.lesson_id, courseId)
    return map
  }, new Map<string, string>())
}

function buildCatalogActivityIdsByCourse(
  lessonActivities: BusinessUserStatsLessonActivityCatalogRecord[],
  courseIdByLessonId: Map<string, string>,
) {
  return lessonActivities.reduce((map, activity) => {
    if (!activity.lesson_id) return map
    const courseId = courseIdByLessonId.get(activity.lesson_id)
    if (!courseId) return map

    const activityIds = map.get(courseId) || new Set<string>()
    activityIds.add(activity.activity_id)
    map.set(courseId, activityIds)
    return map
  }, new Map<string, Set<string>>())
}

function countCompletionRowsForCourse(
  completions: BusinessUserStatsActivityCompletionRecord[],
  courseId: string,
) {
  const activityIds = completions.reduce((ids, completion) => {
    const activity = unwrapRelation(completion.lesson_activities)
    const completionCourseId = unwrapRelation(
      unwrapRelation(activity?.course_lessons)?.course_modules,
    )?.course_id
    if (completionCourseId === courseId) ids.add(completion.activity_id)
    return ids
  }, new Set<string>())

  return activityIds.size
}
