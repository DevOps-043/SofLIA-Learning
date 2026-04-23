import { logger } from '@/lib/utils/logger'
import type { CourseRow, SupabaseServerClient } from './types'

async function resolveInstructorIdFromFirstLesson(
  supabase: SupabaseServerClient,
  courseId: string,
) {
  const { data: firstModule } = await supabase
    .from('course_modules')
    .select('module_id')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('module_order_index', { ascending: true })
    .limit(1)
    .single()

  if (!firstModule) return null

  const { data: firstLesson } = await supabase
    .from('course_lessons')
    .select('instructor_id')
    .eq('module_id', firstModule.module_id)
    .eq('is_published', true)
    .order('lesson_order_index', { ascending: true })
    .limit(1)
    .single()

  return firstLesson?.instructor_id || null
}

export async function loadCourseInstructor(
  supabase: SupabaseServerClient,
  course: CourseRow,
) {
  const instructorId =
    course.instructor_id ||
    (await resolveInstructorIdFromFirstLesson(supabase, course.id))

  if (!instructorId) return null

  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, display_name, username, email, profile_picture_url, bio, linkedin_url, github_url, website_url, location, cargo_rol, type_rol')
    .eq('id', instructorId)
    .single()

  if (error || !data) {
    logger.warn('Could not load instructor data:', error)
    return null
  }

  const name =
    data.display_name ||
    `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
    data.username ||
    'Instructor'

  return {
    id: data.id,
    name,
    email: data.email || '',
    profile_picture_url: data.profile_picture_url,
    bio: data.bio,
    linkedin_url: data.linkedin_url,
    github_url: data.github_url,
    website_url: data.website_url,
    location: data.location,
    cargo_rol: data.cargo_rol,
    type_rol: data.type_rol,
  }
}
