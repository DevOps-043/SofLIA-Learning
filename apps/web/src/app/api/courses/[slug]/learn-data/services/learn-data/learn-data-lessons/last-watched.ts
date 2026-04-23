import type { LessonRow, ModuleRow, ProgressRow } from './types'

export function resolveLastWatchedLessonId(
  modules: ModuleRow[],
  lessons: LessonRow[],
  progressData: ProgressRow[],
) {
  if (progressData.length === 0 || lessons.length === 0) return null

  const progressLookup = new Map(progressData.map((progress) => [progress.lesson_id, progress]))
  const moduleOrderLookup = new Map(modules.map((module) => [module.module_id, module.module_order_index]))
  const orderedLessons = [...lessons].sort((left, right) => {
    const leftModuleOrder = moduleOrderLookup.get(left.module_id) || 0
    const rightModuleOrder = moduleOrderLookup.get(right.module_id) || 0
    if (leftModuleOrder !== rightModuleOrder) return leftModuleOrder - rightModuleOrder
    return left.lesson_order_index - right.lesson_order_index
  })

  let lastValidLessonId: string | null = null
  let lastAccessedInProgress: { lesson_id: string; accessed_at: number } | null = null

  for (const lesson of orderedLessons) {
    const progress = progressLookup.get(lesson.lesson_id)
    if (!progress) {
      if (!lastValidLessonId) lastValidLessonId = lesson.lesson_id
      break
    }
    if (progress.is_completed) {
      lastValidLessonId = lesson.lesson_id
      continue
    }
    if ((progress.video_progress_percentage || 0) > 0 || progress.lesson_status === 'in_progress') {
      const accessTime = progress.last_accessed_at ? new Date(progress.last_accessed_at).getTime() : progress.started_at ? new Date(progress.started_at).getTime() : 0
      if (!lastAccessedInProgress || accessTime > lastAccessedInProgress.accessed_at) {
        lastAccessedInProgress = { lesson_id: lesson.lesson_id, accessed_at: accessTime }
      }
      lastValidLessonId = lesson.lesson_id
    }
    if (progress.lesson_status === 'locked' || progress.lesson_status === 'not_started') break
  }

  return lastAccessedInProgress?.lesson_id || lastValidLessonId || orderedLessons[0]?.lesson_id || null
}
