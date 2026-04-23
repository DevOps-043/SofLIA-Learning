import { CourseImportError } from './errors'
import type { CourseImportPayload, ServiceSupabaseClient } from './types'

export async function upsertImportedCourse(
  supabase: ServiceSupabaseClient,
  courseData: CourseImportPayload['course'],
  instructorId: string,
  slug: string,
) {
  const { data, error } = await supabase
    .from('courses')
    .upsert(
      {
        title: courseData.title,
        description: courseData.description,
        category: courseData.category,
        level: courseData.level,
        instructor_id: instructorId,
        thumbnail_url: courseData.thumbnail_url,
        slug,
        price: 0,
        is_active: false,
        approval_status: 'pending',
        learning_objectives: [],
      },
      { onConflict: 'slug' },
    )
    .select()
    .single()

  if (error || !data) {
    console.error('[IMPORT API] Error upserting course:', error)
    throw new CourseImportError(500, {
      error: 'Failed to upsert course',
      details: error?.message || 'Unknown error',
    })
  }

  return data as { id: string }
}
