import type { SupabaseServerClient } from './types'

export async function loadCourseBySlug(
  supabase: SupabaseServerClient,
  slug: string,
) {
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, description, thumbnail_url, instructor_id, category, level, price, is_active')
    .eq('slug', slug)
    .single()

  if (error || !data) throw new Error('COURSE_NOT_FOUND')
  return data
}
