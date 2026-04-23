import type {
  LearningPathOrganizationAssignmentSummary,
  LearningPathUserAssignmentSummary,
} from '../../types'
import type {
  OrganizationLearningPathAssignmentSummaryRow,
  UserLearningPathAssignmentSummaryRow,
} from './assignment-row.types'

export function mapOrganizationAssignmentSummary(
  row: OrganizationLearningPathAssignmentSummaryRow,
): LearningPathOrganizationAssignmentSummary {
  return {
    id: row.id,
    organization_id: row.organization_id,
    organization_name: row.organizations?.name || 'Organizacion sin nombre',
    organization_slug: row.organizations?.slug || null,
    assigned_at: row.assigned_at,
    status: row.status,
  }
}

export function mapUserAssignmentSummary(
  row: UserLearningPathAssignmentSummaryRow,
): LearningPathUserAssignmentSummary {
  return {
    id: row.id,
    organization_id: row.organization_id,
    organization_name: row.organizations?.name || 'Organizacion sin nombre',
    user_id: row.user_id,
    assigned_at: row.assigned_at,
    status: row.status,
    user: row.users || null,
  }
}
