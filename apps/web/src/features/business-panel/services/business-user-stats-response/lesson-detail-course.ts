import type { LessonDetail } from '../../types/business-user-stats.types'
import type { BusinessUserStatsLessonRecord } from '../business-user-stats-query.service'
import { unwrapRelation } from '../business-user-stats-query.service'
import type { LessonDetailIndexes } from './lesson-detail-indexes'

export function buildCourseLessons(courseLessons: BusinessUserStatsLessonRecord[], indexes: LessonDetailIndexes): LessonDetail[] {
  return courseLessons.map((lesson): LessonDetail => buildLessonDetail(lesson, indexes)).sort((a, b) => {
    const modDiff = (a.module_order ?? 99) - (b.module_order ?? 99)
    if (modDiff !== 0) return modDiff
    return (a.lesson_order ?? 99) - (b.lesson_order ?? 99)
  })
}

function buildLessonDetail(lesson: BusinessUserStatsLessonRecord, indexes: LessonDetailIndexes): LessonDetail {
  const meta = indexes.lessonMetaById.get(lesson.lesson_id)
  const module = unwrapRelation(meta?.course_modules ?? lesson.course_modules)
  const progress = indexes.progressByLesson.get(lesson.lesson_id)
  const quiz = indexes.quizByLesson.get(lesson.lesson_id)
  const videoPct = progress?.video_progress_percentage ?? 0
  const actDone = progress?.required_activities_completed ?? 0
  const actTotal = progress?.required_activities_total ?? 0
  const status: 'not_started' | 'in_progress' | 'completed' = progress?.is_completed
    ? 'completed'
    : progress?.lesson_status === 'in_progress' ? 'in_progress' : 'not_started'

  return {
    lesson_id: lesson.lesson_id, lesson_title: lesson.lesson_title, lesson_order: lesson.lesson_order_index ?? null,
    module_id: lesson.module_id ?? null, module_title: module?.module_title ?? null, module_order: module?.module_order_index ?? null,
    status, video_progress_pct: videoPct, video_watched: videoPct >= 80 || status === 'completed',
    activities_completed: actDone, activities_total: actTotal, activity_done: actTotal > 0 ? actDone >= actTotal : false,
    quiz_completed: progress?.quiz_completed ?? false, quiz_passed: quiz?.passed ?? null, quiz_score: quiz?.score ?? null,
    lia_conversations: indexes.liaConvByLesson.get(lesson.lesson_id) ?? 0, lia_messages: indexes.liaMsgByLesson.get(lesson.lesson_id) ?? 0,
    notes_count: indexes.notesByLesson.get(lesson.lesson_id) ?? 0, time_spent_minutes: progress?.time_spent_minutes ?? 0,
  }
}
