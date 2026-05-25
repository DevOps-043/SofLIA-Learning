import type { LessonQueryData, LessonWithProgress, ModuleWithLessons } from './full-results.types'
import type { CourseLessonRow, CourseModuleRow } from './full.types'

function resolveVideoUrl(lesson: CourseLessonRow) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  let videoUrl = lesson.video_provider_id

  if (lesson.video_provider === 'direct' && videoUrl && !videoUrl.startsWith('http')) {
    videoUrl = `${supabaseUrl}/storage/v1/object/public/course-videos/videos/${videoUrl}`
  }

  return videoUrl
}

function mapLesson(lesson: CourseLessonRow, queryData: LessonQueryData): LessonWithProgress {
  const progress = queryData.progress.get(lesson.lesson_id)

  return {
    lesson_id: lesson.lesson_id,
    lesson_title: lesson.lesson_title,
    lesson_description: lesson.lesson_description,
    lesson_order_index: lesson.lesson_order_index,
    duration_seconds: lesson.duration_seconds,
    total_duration_minutes: lesson.total_duration_minutes || Math.ceil((lesson.duration_seconds || 0) / 60),
    video_provider_id: resolveVideoUrl(lesson),
    video_provider: lesson.video_provider,
    is_completed: progress?.is_completed || false,
    progress_percentage: progress?.video_progress_percentage || 0,
  }
}

export function mapModulesWithLessons(
  modules: CourseModuleRow[],
  queryData: LessonQueryData,
): ModuleWithLessons[] {
  const lessonsByModule = new Map<string, CourseLessonRow[]>()
  queryData.lessons.forEach((lesson) => {
    lessonsByModule.set(lesson.module_id, [...(lessonsByModule.get(lesson.module_id) || []), lesson])
  })

  return modules.map((module) => {
    const moduleLessons = lessonsByModule.get(module.module_id) || []
    const publishedLessons = moduleLessons.filter((lesson) => lesson.is_published === true)
    const lessons = publishedLessons.length > 0 ? publishedLessons : moduleLessons

    return {
      ...module,
      lessons: lessons.map((lesson) => mapLesson(lesson, queryData)),
    }
  })
}
