import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LooseRow } from './learning-path-row.types'

export async function syncCourseAccessForOrganization(
  organizationId: string,
  courseIds: string[],
  adminUserId: string,
) {
  if (courseIds.length === 0) return

  const supabase = createAdminClient()

  for (const courseId of courseIds) {
    const existing = await fromLoose<LooseRow>(supabase, 'hierarchy_course_assignments')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing.error) {
      logger.error('Error checking hierarchy assignment for learning path:', existing.error)
      throw new Error('No se pudo sincronizar el acceso organizacional')
    }

    if (existing.data) continue

    const { error } = await fromLoose<LooseRow>(supabase, 'hierarchy_course_assignments')
      .insert({
        organization_id: organizationId,
        course_id: courseId,
        assigned_by: adminUserId,
        status: 'active',
      })

    if (error) {
      logger.error('Error creating hierarchy assignment for learning path:', error)
      throw new Error('No se pudo sincronizar el acceso organizacional')
    }
  }
}
