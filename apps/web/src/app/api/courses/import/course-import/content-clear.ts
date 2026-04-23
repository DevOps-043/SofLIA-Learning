import { CourseImportError } from './errors'
import type { ServiceSupabaseClient } from './types'

export async function clearExistingCourseContent(
  supabase: ServiceSupabaseClient,
  courseId: string,
) {
  const { count } = await supabase
    .from('course_modules')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId)

  if (!count) return

  console.info(`[IMPORT API] Re-import detected for course "${courseId}". Clearing ${count} existing module(s) before re-inserting.`)
  const { error } = await supabase
    .from('course_modules')
    .delete()
    .eq('course_id', courseId)

  if (error) {
    console.error('[IMPORT API] Error deleting existing modules:', error)
    throw new CourseImportError(500, {
      error: 'Failed to clear existing course content',
      details: error.message,
    })
  }
}
