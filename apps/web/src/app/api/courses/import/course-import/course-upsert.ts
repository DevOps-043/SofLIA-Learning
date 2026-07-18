import { logger as techDebtLogger } from '@/lib/utils/logger'
import type { CourseImportPayload } from './schemas'
import type { CourseImportSupabaseClient } from './service-client'

type CourseInput = CourseImportPayload['course']

export async function upsertImportedCourse(
  supabase: CourseImportSupabaseClient,
  courseData: CourseInput,
  instructorId: string
) {
  const { data: newCourse, error } = await supabase
    .from('courses')
    .upsert(
      {
        approval_status: 'pending',
        category: courseData.category,
        description: courseData.description,
        instructor_id: instructorId,
        is_active: false,
        learning_objectives: [],
        level: courseData.level,
        price: 0,
        slug: courseData.slug || createImportSlug(courseData.title),
        thumbnail_url: courseData.thumbnail_url,
        title: courseData.title,
      },
      { onConflict: 'slug' }
    )
    .select()
    .single()

  if (error || !newCourse) {
    throw new Error(`Failed to upsert course: ${error?.message || 'unknown error'}`)
  }

  await clearExistingCourseModules(supabase, newCourse.id)
  return newCourse
}

function createImportSlug(title: string): string {
  return `${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}-${Date.now().toString().slice(-4)}`
}

async function clearExistingCourseModules(
  supabase: CourseImportSupabaseClient,
  courseId: string
) {
  const { count } = await supabase
    .from('course_modules')
    .select('module_id', { count: 'exact', head: true })
    .eq('course_id', courseId)

  if (!count || count <= 0) {
    return
  }

  techDebtLogger.info(
    `[IMPORT API] Re-import detected for course "${courseId}". Clearing ${count} existing module(s) before re-inserting.`
  )
  const { error } = await supabase
    .from('course_modules')
    .delete()
    .eq('course_id', courseId)

  if (error) {
    throw new Error(`Failed to clear existing course content: ${error.message}`)
  }
}
