import type {
  LearningPath,
  OrganizationLearningPathAssignment,
  UserLearningPathAssignment,
} from '../../types'
import type {
  AssignmentSource,
  OrganizationLearningPathAssignmentRow,
  UserLearningPathAssignmentRow,
} from './rows'

interface UserAssignmentOverrides {
  status?: UserLearningPathAssignment['status']
  assignmentSource?: AssignmentSource
  defaultRuleId?: string | null
}

export function mapOrganizationAssignment(
  row: OrganizationLearningPathAssignmentRow,
  learningPath: LearningPath | null,
  status: OrganizationLearningPathAssignment['status'] = row.status,
): OrganizationLearningPathAssignment {
  return {
    id: row.id,
    organization_id: row.organization_id,
    learning_path_id: row.learning_path_id,
    assigned_at: row.assigned_at,
    status,
    learning_path: learningPath,
  }
}

export function mapUserAssignment(
  row: UserLearningPathAssignmentRow,
  learningPath: LearningPath | null,
  overrides: UserAssignmentOverrides = {},
): UserLearningPathAssignment {
  return {
    id: row.id,
    organization_id: row.organization_id,
    user_id: row.user_id,
    learning_path_id: row.learning_path_id,
    assigned_at: row.assigned_at,
    status: overrides.status ?? row.status,
    assignment_source: overrides.assignmentSource ?? row.assignment_source ?? 'manual',
    default_rule_id: overrides.defaultRuleId ?? row.default_rule_id ?? null,
    learning_path: learningPath,
    user: row.users || null,
  }
}
