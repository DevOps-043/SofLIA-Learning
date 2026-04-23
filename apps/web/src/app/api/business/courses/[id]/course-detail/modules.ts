import type {
  CourseLessonRow,
  CourseModuleRow,
  ModuleWithLessons,
  SupabaseServerClient,
} from './types'
import { calculateModuleDurationMinutes } from './module-duration'

async function loadPublishedLessonsForModule(
  supabase: SupabaseServerClient,
  moduleId: string,
) {
  const { data } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, lesson_description, lesson_order_index, duration_seconds, total_duration_minutes, video_provider, video_provider_id, is_published')
    .eq('module_id', moduleId)
    .eq('is_published', true)
    .order('lesson_order_index', { ascending: true })
    .returns<CourseLessonRow[]>()

  return data || []
}

export async function loadModulesWithLessons(
  supabase: SupabaseServerClient,
  courseId: string,
) {
  const { data: modules } = await supabase
    .from('course_modules')
    .select('module_id, module_title, module_description, module_order_index, module_duration_minutes, is_required, is_published')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('module_order_index', { ascending: true })
    .returns<CourseModuleRow[]>()

  return Promise.all(
    (modules || []).map(async (module): Promise<ModuleWithLessons> => {
      const lessons = await loadPublishedLessonsForModule(supabase, module.module_id)
      return {
        ...module,
        lessons,
        calculated_duration_minutes: await calculateModuleDurationMinutes(
          supabase,
          lessons,
        ),
      }
    }),
  )
}
