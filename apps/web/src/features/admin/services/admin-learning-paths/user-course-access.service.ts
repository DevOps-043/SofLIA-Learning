import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/utils/logger'

export async function syncCourseAccessForUser(
  organizationId: string,
  userId: string,
  courseIds: string[],
  adminUserId: string,
) {
  if (courseIds.length === 0) return

  const supabase = createAdminClient()

  for (const courseId of courseIds) {
    const existing = await supabase
      .from('organization_course_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing.error) {
      logger.error('Error checking user course assignment for learning path:', existing.error)
      throw new Error('No se pudo sincronizar la asignacion individual')
    }

    if (!existing.data) {
      const assignmentInsert = await supabase.from('organization_course_assignments').insert({
        organization_id: organizationId,
        user_id: userId,
        course_id: courseId,
        assigned_by: adminUserId,
        status: 'assigned',
      })

      if (assignmentInsert.error) {
        logger.error('Error creating user course assignment for learning path:', assignmentInsert.error)
        throw new Error('No se pudo sincronizar la asignacion individual')
      }
    }

    const enrollmentInsert = await supabase.from('user_course_enrollments').upsert(
      {
        user_id: userId,
        course_id: courseId,
        organization_id: organizationId,
        enrollment_status: 'active',
        enrolled_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,course_id', ignoreDuplicates: true },
    )

    if (enrollmentInsert.error) {
      logger.error('Error upserting user enrollment for learning path:', enrollmentInsert.error)
      throw new Error('No se pudo sincronizar el acceso del usuario')
    }
  }
}
