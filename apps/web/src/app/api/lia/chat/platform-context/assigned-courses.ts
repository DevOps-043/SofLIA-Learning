import type { PlatformContext } from './context.types'
import type { PlatformSupabaseClient } from './client.types'
import { mapAssignedCourse } from './mappers'
import type { AssignedCourseRow } from './row.types'

export async function applyAssignedCoursesContext(
  supabase: PlatformSupabaseClient,
  context: PlatformContext,
  userId: string | undefined,
  organizationId: string | null,
): Promise<void> {
  if (!userId) {
    markNoAssignedCourses(context)
    return
  }

  let query = supabase
    .from('organization_course_assignments')
    .select('course:courses!inner(id, title, slug, description, level, duration_total_minutes)')
    .eq('user_id', userId)
  query = organizationId ? query.eq('organization_id', organizationId) : query.is('organization_id', null)
  const { data } = await query.limit(20)

  if (data?.length) {
    context.coursesWithContent = (data as AssignedCourseRow[]).map(mapAssignedCourse)
    return
  }

  markNoAssignedCourses(context)
}

function markNoAssignedCourses(context: PlatformContext): void {
  context.coursesWithContent = []
  context.noCoursesAssigned = true
}
