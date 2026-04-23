import { pickPublishedOrAll } from './published-items'
import type { LessonRow, ModuleRow, ProgressRow } from './types'

function resolveDirectVideoUrl(
  videoProviderId: string | null,
  videoProvider: string | null,
  supabaseUrl: string,
) {
  if (!videoProviderId || videoProvider !== 'direct' || videoProviderId.startsWith('http') || !supabaseUrl) {
    return videoProviderId
  }

  return videoProviderId.includes('/')
    ? `${supabaseUrl}/storage/v1/object/public/${videoProviderId}`
    : `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${videoProviderId}`
}

export function buildModulesWithLessons(
  modules: ModuleRow[],
  lessons: LessonRow[],
  progressData: ProgressRow[],
  translatedModulesById: Map<string, { module_title?: string | null; module_description?: string | null }>,
  supabaseUrl: string,
) {
  const progressMap = new Map(progressData.map((progress) => [progress.lesson_id, progress]))
  const lessonsByModule = new Map<string, LessonRow[]>()
  lessons.forEach((lesson) => {
    const current = lessonsByModule.get(lesson.module_id) || []
    current.push(lesson)
    lessonsByModule.set(lesson.module_id, current)
  })

  return modules.map((module) => {
    const translatedModule = translatedModulesById.get(module.module_id)
    const lessonsToShow = pickPublishedOrAll(lessonsByModule.get(module.module_id) || [])
    return {
      module_id: module.module_id,
      module_title: translatedModule?.module_title || module.module_title,
      module_description: translatedModule?.module_description || module.module_description,
      module_order_index: module.module_order_index,
      lessons: lessonsToShow.map((lesson) => {
        const progress = progressMap.get(lesson.lesson_id)
        return {
          lesson_id: lesson.lesson_id,
          lesson_title: lesson.lesson_title,
          lesson_description: lesson.lesson_description,
          lesson_order_index: lesson.lesson_order_index,
          duration_seconds: lesson.duration_seconds,
          video_provider_id: resolveDirectVideoUrl(lesson.video_provider_id, lesson.video_provider, supabaseUrl),
          video_provider: lesson.video_provider,
          is_completed: progress?.is_completed || false,
          progress_percentage: progress?.video_progress_percentage || 0,
          transcript_content: lesson.transcript_content || null,
          summary_content: lesson.summary_content || null,
        }
      }),
    }
  })
}
