import type {
  LessonTranslationRow,
  TranslationRequestOptions,
  TranslationSupabaseClient,
} from './types'

export async function fetchLessonsForTranslation(
  supabase: TranslationSupabaseClient,
  options: TranslationRequestOptions
): Promise<LessonTranslationRow[]> {
  let lessonsQuery = supabase
    .from('course_lessons')
    .select(
      'lesson_id, lesson_title, lesson_description, transcript_content, summary_content, module_id, course_modules!inner(course_id)'
    )

  if (Array.isArray(options.lessonIds) && options.lessonIds.length > 0) {
    lessonsQuery = lessonsQuery.in('lesson_id', options.lessonIds)
  }

  if (options.courseId) {
    lessonsQuery = lessonsQuery.eq('course_modules.course_id', options.courseId)
  }

  const { data: lessons, error } = await lessonsQuery

  if (error) {
    throw new Error(`Error al obtener lecciones: ${error.message}`)
  }

  return (lessons || []) as LessonTranslationRow[]
}
