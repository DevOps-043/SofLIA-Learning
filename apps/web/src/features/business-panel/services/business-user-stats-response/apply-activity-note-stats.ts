import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type {
  BusinessUserStatsActivityCompletionRecord,
  BusinessUserStatsLessonNoteRecord,
} from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

export function applyActivityStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  completions: BusinessUserStatsActivityCompletionRecord[],
) {
  completions.forEach((completion) => {
    const activity = unwrapRelation(completion.lesson_activities)
    const courseModule = unwrapRelation(activity?.course_lessons)?.course_modules
    const resolvedCourseId = unwrapRelation(courseModule)?.course_id

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

export function applyNotesStats(
  courseStatsMap: Map<string, BusinessUserStatsCourseData>,
  notes: BusinessUserStatsLessonNoteRecord[],
  courseIdByLessonId: Map<string, string>,
) {
  notes.forEach((note) => {
    const noteCourseId =
      unwrapRelation(unwrapRelation(note.course_lessons)?.course_modules)?.course_id ||
      (note.lesson_id ? courseIdByLessonId.get(note.lesson_id) : null)

    if (!noteCourseId || !courseStatsMap.has(noteCourseId)) return

    const stats = courseStatsMap.get(noteCourseId)
    if (!stats) return

    stats.notes_count = (stats.notes_count || 0) + 1
    stats.readings_viewed = (stats.readings_viewed || 0) + 1
  })
}
