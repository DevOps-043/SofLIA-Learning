import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { OrganizationLearningPathAssignmentRow } from './assignment-row.types'

export async function revokeLearningPathFromOrganization(
  organizationId: string,
  assignmentId: string,
) {
  const supabase = createAdminClient()
  const { error } = await fromLoose<OrganizationLearningPathAssignmentRow>(
    supabase,
    'organization_learning_path_assignments',
  )
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('organization_id', organizationId)
    .eq('id', assignmentId)

  if (error) {
    logger.error('Error revoking organization learning path assignment:', error)
    throw new Error('No se pudo revocar el learning path')
  }
}
