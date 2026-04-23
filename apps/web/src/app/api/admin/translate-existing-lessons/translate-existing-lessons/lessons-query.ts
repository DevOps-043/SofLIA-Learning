import { TranslateExistingLessonsError } from './errors'
import type {
  LessonRow,
  TranslationOptions,
  TranslationSupabaseClient,
} from './types'

const LESSON_SELECT =
  'lesson_id, lesson_title, lesson_description, transcript_content, summary_content, module_id, course_modules!inner(course_id)'

export async function fetchLessonsForTranslation(
  supabase: TranslationSupabaseClient,
  options: TranslationOptions,
): Promise<LessonRow[]> {
  let query = supabase.from('course_lessons').select(LESSON_SELECT)

  if (options.lessonIds && options.lessonIds.length > 0) {
    query = query.in('lesson_id', options.lessonIds)
  }

  if (options.courseId) {
    query = query.eq('course_modules.course_id', options.courseId)
  }

  const { data, error } = await query
  if (error) {
    throw new TranslateExistingLessonsError(500, {
      error: 'Error al obtener lecciones',
      details: error.message,
    })
  }

  return (data || []) as LessonRow[]
}
