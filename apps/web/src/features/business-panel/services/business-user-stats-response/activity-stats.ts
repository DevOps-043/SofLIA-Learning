import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsActivityCompletionRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

export function applyActivityStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  completions: BusinessUserStatsActivityCompletionRecord[],
) {
  completions.forEach((completion) => {
    const activity = unwrapRelation(completion.lesson_activities)
    const courseId = unwrapRelation(activity?.course_lessons)?.course_modules
    const resolvedCourseId = unwrapRelation(courseId)?.course_id
    if (!resolvedCourseId || !courseStatsMap.has(resolvedCourseId)) return
    const stats = courseStatsMap.get(resolvedCourseId)
    if (!stats) return
    stats.activities_total = (stats.activities_total || 0) + 1
    if (completion.status === 'completed') {
      stats.activities_completed = (stats.activities_completed || 0) + 1
      stats.lia_activities_completed = (stats.lia_activities_completed || 0) + 1
    }
  })
}
