import { createAdminClient } from '@/lib/supabase/admin'
import { fromLoose } from '@/lib/supabase/looseQuery'
import { logger } from '@/lib/utils/logger'
import type { LearningPathAssignmentOverview } from '../../types'
import type {
  OrganizationLearningPathAssignmentSummaryRow,
  UserLearningPathAssignmentSummaryRow,
} from './rows'

export async function listAssignmentsForLearningPath(
  learningPathId: string,
): Promise<LearningPathAssignmentOverview> {
  const supabase = createAdminClient()
  const [organizationAssignmentsResult, userAssignmentsResult] = await Promise.all([
    fromLoose<OrganizationLearningPathAssignmentSummaryRow>(
      supabase,
      'organization_learning_path_assignments',
    )
      .select(`
        id,
        organization_id,
        assigned_at,
        status,
        organizations:organization_id ( id, name, slug )
      `)
      .eq('learning_path_id', learningPathId)
      .order('assigned_at', { ascending: false }),
    fromLoose<UserLearningPathAssignmentSummaryRow>(
      supabase,
      'user_learning_path_assignments',
    )
      .select(`
        id,
        organization_id,
        user_id,
        assigned_at,
        status,
        organizations:organization_id ( id, name, slug ),
        users:user_id ( id, email, display_name, first_name, last_name )
      `)
      .eq('learning_path_id', learningPathId)
      .order('assigned_at', { ascending: false }),
  ])

  if (organizationAssignmentsResult.error) {
    logger.error('Error fetching organization summaries for learning path:', organizationAssignmentsResult.error)
    throw new Error('No se pudieron cargar las asignaciones organizacionales del learning path')
  }

  if (userAssignmentsResult.error) {
    logger.error('Error fetching user summaries for learning path:', userAssignmentsResult.error)
    throw new Error('No se pudieron cargar las asignaciones individuales del learning path')
  }

  return {
    organizationAssignments: (organizationAssignmentsResult.data || []).map((row) => ({
      id: row.id,
      organization_id: row.organization_id,
      organization_name: row.organizations?.name || 'Organizacion sin nombre',
      organization_slug: row.organizations?.slug || null,
      assigned_at: row.assigned_at,
      status: row.status,
    })),
    userAssignments: (userAssignmentsResult.data || []).map((row) => ({
      id: row.id,
      organization_id: row.organization_id,
      organization_name: row.organizations?.name || 'Organizacion sin nombre',
      user_id: row.user_id,
      assigned_at: row.assigned_at,
      status: row.status,
      user: row.users || null,
    })),
  }
}
