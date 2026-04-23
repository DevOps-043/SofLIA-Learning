import { getLessonsTableName } from './lessons-table'
import type { LessonRow, ModuleRow, SupabaseServerClient } from './types'

async function loadLessonsFromTable(
  supabase: SupabaseServerClient,
  tableName: string,
  modules: ModuleRow[],
) {
  const { data } = await supabase
    .from(tableName)
    .select('lesson_id, lesson_title, lesson_description, lesson_order_index, duration_seconds, video_provider_id, video_provider, is_published, module_id, transcript_content, summary_content')
    .in('module_id', modules.map((module) => module.module_id))
    .order('lesson_order_index', { ascending: true })

  return (data || []) as LessonRow[]
}

export function loadBaseLessons(
  supabase: SupabaseServerClient,
  modules: ModuleRow[],
) {
  return loadLessonsFromTable(supabase, 'course_lessons', modules)
}

export async function loadTranslatedLessonsMap(
  supabase: SupabaseServerClient,
  requestedLanguage: string,
  modules: ModuleRow[],
) {
  if (requestedLanguage === 'es') return new Map<string, LessonRow>()

  const translatedLessons = await loadLessonsFromTable(
    supabase,
    getLessonsTableName(requestedLanguage),
    modules,
  )

  return new Map(
    translatedLessons.map((lesson) => [lesson.lesson_id, lesson]),
  )
}
