import type {
  BusinessUserStatsCourseModuleRecord,
  BusinessUserStatsLessonCountRecord,
  BusinessUserStatsLessonRecord,
} from '../business-user-stats-query.service'

export function createLessonInfoById(records: BusinessUserStatsLessonRecord[]) {
  return records.reduce((map, record) => {
    map.set(record.lesson_id, record)
    return map
  }, new Map<string, BusinessUserStatsLessonRecord>())
}

export function createCourseModuleIdsByCourse(records: BusinessUserStatsCourseModuleRecord[]) {
  const map = new Map<string, string[]>()

  records.forEach((record) => {
    const moduleIds = map.get(record.course_id)
    if (moduleIds) moduleIds.push(record.module_id)
    else map.set(record.course_id, [record.module_id])
  })

  return map
}

export function createRealLessonsByCourse(
  courseModuleIdsByCourse: Map<string, string[]>,
  lessonCounts: BusinessUserStatsLessonCountRecord[],
) {
  const lessonCountByModule = lessonCounts.reduce((map, record) => {
    map.set(record.module_id, (map.get(record.module_id) || 0) + 1)
    return map
  }, new Map<string, number>())

  return Array.from(courseModuleIdsByCourse.entries()).reduce((map, [courseId, moduleIds]) => {
    map.set(courseId, moduleIds.reduce((sum, moduleId) => sum + (lessonCountByModule.get(moduleId) || 0), 0))
    return map
  }, new Map<string, number>())
}
