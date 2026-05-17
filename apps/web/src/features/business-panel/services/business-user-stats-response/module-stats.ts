import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsCourseModuleRecord, BusinessUserStatsLessonProgressRecord, BusinessUserStatsLessonRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

type ModuleStats = { total: number; completedModules: Set<string> }

export function applyModuleStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  courseModules: BusinessUserStatsCourseModuleRecord[],
  progressRecords: BusinessUserStatsLessonProgressRecord[],
  lessonInfoById: Map<string, BusinessUserStatsLessonRecord>,
) {
  const moduleStatsByCourse = new Map<string, ModuleStats>()
  courseModules.forEach((module) => {
    const stats = moduleStatsByCourse.get(module.course_id) || createEmptyModuleStats()
    stats.total += 1
    moduleStatsByCourse.set(module.course_id, stats)
  })

  progressRecords.forEach((progress) => {
    const courseId = unwrapRelation(progress.user_course_enrollments)?.course_id
    const moduleId = lessonInfoById.get(progress.lesson_id)?.module_id
    if (!courseId || !moduleId) return
    const stats = moduleStatsByCourse.get(courseId) || createEmptyModuleStats()
    if (progress.is_completed) stats.completedModules.add(moduleId)
    moduleStatsByCourse.set(courseId, stats)
  })

  moduleStatsByCourse.forEach((moduleStats, courseId) => {
    const stats = courseStatsMap.get(courseId)
    if (!stats) return
    stats.modules_total = moduleStats.total
    stats.modules_completed = moduleStats.completedModules.size
  })
}

function createEmptyModuleStats(): ModuleStats {
  return { total: 0, completedModules: new Set<string>() }
}
