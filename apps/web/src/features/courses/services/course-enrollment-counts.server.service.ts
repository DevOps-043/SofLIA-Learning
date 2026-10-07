import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

/** Counts current enrollments in PostgreSQL without fetching student records.
 * Call only after authorizing the catalog request; business counts are org scoped.
 */
export async function getCourseEnrollmentCounts(
  supabase: SupabaseClient<Database>,
  courseIds: string[],
  organizationId?: string,
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  const uniqueIds = [...new Set(courseIds)]

  // Bound URL size and result rows, independently of the number of enrollments.
  for (let offset = 0; offset < uniqueIds.length; offset += 200) {
    let query = supabase
      .from('courses')
      .select('id, enrollments:user_course_enrollments(count)')
      .in('id', uniqueIds.slice(offset, offset + 200))
      .in('enrollments.enrollment_status', ['active', 'completed'])

    if (organizationId) query = query.eq('enrollments.organization_id', organizationId)

    const { data, error } = await query
    if (error) throw error

    for (const course of data ?? []) {
      counts.set(course.id, course.enrollments[0]?.count ?? 0)
    }
  }

  return counts
}
