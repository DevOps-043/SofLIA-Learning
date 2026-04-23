import 'server-only'

import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPathAssignmentOverview } from '../../types'
import type {
  OrganizationLearningPathAssignmentSummaryRow,
  UserLearningPathAssignmentSummaryRow,
} from './assignment-row.types'
import {
  mapOrganizationAssignmentSummary,
  mapUserAssignmentSummary,
} from './assignment-overview-mappers'
import {
  ORGANIZATION_ASSIGNMENT_SUMMARY_SELECT,
  USER_ASSIGNMENT_SUMMARY_SELECT,
} from './selects'

export async function getLearningPathAssignmentOverview(
  learningPathId: string,
): Promise<LearningPathAssignmentOverview> {
  const supabase = createAdminClient()

  const [organizationResult, userResult] = await Promise.all([
    fromLoose<OrganizationLearningPathAssignmentSummaryRow>(
      supabase,
      'organization_learning_path_assignments',
    )
      .select(ORGANIZATION_ASSIGNMENT_SUMMARY_SELECT)
      .eq('learning_path_id', learningPathId)
      .order('assigned_at', { ascending: false }),
    fromLoose<UserLearningPathAssignmentSummaryRow>(supabase, 'user_learning_path_assignments')
      .select(USER_ASSIGNMENT_SUMMARY_SELECT)
      .eq('learning_path_id', learningPathId)
      .order('assigned_at', { ascending: false }),
  ])

  if (organizationResult.error) {
    logger.error('Error fetching organization summaries for learning path:', organizationResult.error)
    throw new Error('No se pudieron cargar las asignaciones organizacionales del learning path')
  }

  if (userResult.error) {
    logger.error('Error fetching user summaries for learning path:', userResult.error)
    throw new Error('No se pudieron cargar las asignaciones individuales del learning path')
  }

  return {
    organizationAssignments: (organizationResult.data || []).map(mapOrganizationAssignmentSummary),
    userAssignments: (userResult.data || []).map(mapUserAssignmentSummary),
  }
}
