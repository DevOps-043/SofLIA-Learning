import type { BusinessUserStatsCourseData } from '../../types/business-user-stats.types'
import type { BusinessUserStatsLessonNoteRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'

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
