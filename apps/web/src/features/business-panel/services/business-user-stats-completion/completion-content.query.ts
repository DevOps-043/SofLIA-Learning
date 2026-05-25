import { logger } from '../../../../lib/utils/logger'
import type { BusinessUserStatsSupabaseClient } from './completion.client'
import type {
  BusinessUserStatsCourseModuleRecord,
  BusinessUserStatsLessonCountRecord,
  BusinessUserStatsLessonRecord,
} from './completion.records'

export async function fetchLessonsForProgress(
  supabase: BusinessUserStatsSupabaseClient,
  lessonIds: string[],
): Promise<BusinessUserStatsLessonRecord[]> {
  const result =
    lessonIds.length > 0
      ? await supabase
          .from('course_lessons')
          .select(`
            lesson_id,
            lesson_title,
            lesson_order_index,
            module_id,
            course_modules (
              module_id,
              module_title,
              module_order_index,
              course_id
            )
          `)
          .in('lesson_id', lessonIds)
      : { data: [], error: null }

  if (result.error) logger.error('Error fetching lessons:', result.error)
  return (result.data || []) as BusinessUserStatsLessonRecord[]
}

export async function fetchCourseModulesForCourses(
  supabase: BusinessUserStatsSupabaseClient,
  courseIds: string[],
): Promise<BusinessUserStatsCourseModuleRecord[]> {
  const result =
    courseIds.length > 0
      ? await supabase
          .from('course_modules')
          .select(`
            module_id,
            module_title,
            module_order_index,
            course_id
          `)
          .in('course_id', courseIds)
          .order('module_order_index', { ascending: true })
      : { data: [], error: null }

  if (result.error) logger.error('Error fetching course modules:', result.error)
  return (result.data || []) as BusinessUserStatsCourseModuleRecord[]
}

export async function fetchLessonCountsForModules(
  supabase: BusinessUserStatsSupabaseClient,
  moduleIds: string[],
): Promise<BusinessUserStatsLessonCountRecord[]> {
  const result =
    moduleIds.length > 0
      ? await supabase
          .from('course_lessons')
          .select('lesson_id, module_id')
          .in('module_id', moduleIds)
          .eq('is_published', true)
      : { data: [], error: null }

  if (result.error) logger.error('Error fetching lesson counts:', result.error)
  return (result.data || []) as BusinessUserStatsLessonCountRecord[]
}
