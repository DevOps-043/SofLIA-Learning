import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LooseRow } from './rows'

export async function syncCourseAccessForOrganization(
  organizationId: string,
  courseIds: string[],
  adminUserId: string | null,
) {
  if (courseIds.length === 0) return

  const supabase = createAdminClient()

  for (const courseId of courseIds) {
    const existing = await fromLoose<LooseRow>(supabase, 'hierarchy_course_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .limit(1)

    if (existing.error) {
      logger.error('Error checking hierarchy assignment for learning path:', existing.error)
      throw new Error('No se pudo sincronizar el acceso organizacional')
    }

    if (existing.data && existing.data.length > 0) continue

    const { error } = await fromLoose<LooseRow>(supabase, 'hierarchy_course_assignments')
      .insert({
        organization_id: organizationId,
        course_id: courseId,
        assigned_by: adminUserId,
        status: 'active',
      })

    if (error && error.code !== '23505') {
      logger.error('Error creating hierarchy assignment for learning path:', error)
      throw new Error('No se pudo sincronizar el acceso organizacional')
    }
  }
}
