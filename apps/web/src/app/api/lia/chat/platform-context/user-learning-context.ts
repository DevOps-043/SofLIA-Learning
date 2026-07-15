import type { PlatformContext } from './context.types'
import type { PlatformSupabaseClient } from './client.types'
import { buildUserDisplayName, mapLessonProgress, mapUserCourse } from './mappers'
import type { LessonProgressRow, UserEnrollmentRow, UserProfileNameRow } from './row.types'

export async function applyUserLearningContext(
  supabase: PlatformSupabaseClient,
  context: PlatformContext,
  userId: string,
  organizationId: string | null,
): Promise<void> {
  // Las tres cargas son independientes entre sí. En serie sumaban 3 viajes de
  // ida y vuelta a la base en CADA mensaje de chat de SofLIA; en paralelo el
  // coste es el de la consulta más lenta. Es una ruta caliente por excelencia.
  const [userCourses, userLessonProgress, userName] = await Promise.all([
    loadUserCourses(supabase, userId, organizationId),
    loadUserLessonProgress(supabase, userId, organizationId),
    loadUserDisplayName(supabase, userId),
  ])

  context.userCourses = userCourses
  context.userLessonProgress = userLessonProgress
  context.userName = userName
}

async function loadUserCourses(
  supabase: PlatformSupabaseClient,
  userId: string,
  organizationId: string | null,
) {
  let query = supabase
    .from('user_course_enrollments')
    .select('overall_progress_percentage, enrollment_status, course:courses(title, slug)')
    .eq('user_id', userId)
  query = organizationId ? query.eq('organization_id', organizationId) : query.is('organization_id', null)
  const { data } = await query.order('last_accessed_at', { ascending: false }).limit(5)
  return data ? (data as UserEnrollmentRow[]).map(mapUserCourse) : undefined
}

async function loadUserLessonProgress(
  supabase: PlatformSupabaseClient,
  userId: string,
  organizationId: string | null,
) {
  let query = supabase
    .from('user_lesson_progress')
    .select('lesson_status, is_completed, video_progress_percentage, current_time_seconds, time_spent_minutes, lesson:course_lessons(lesson_id, lesson_title, lesson_description, lesson_order_index, duration_seconds, summary_content, module:course_modules(module_title, module_order_index, course:courses(title, slug)))')
    .eq('user_id', userId)
  query = organizationId ? query.eq('organization_id', organizationId) : query.is('organization_id', null)
  const { data } = await query.order('last_accessed_at', { ascending: false }).limit(15)
  return data?.length ? (data as LessonProgressRow[]).map(mapLessonProgress) : undefined
}

async function loadUserDisplayName(
  supabase: PlatformSupabaseClient,
  userId: string,
): Promise<string | undefined> {
  const { data } = await supabase
    .from('users')
    .select('first_name, last_name, display_name, username')
    .eq('id', userId)
    .single()

  return data ? buildUserDisplayName(data as UserProfileNameRow) : undefined
}
