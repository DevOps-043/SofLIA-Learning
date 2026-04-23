import type { LooseRow } from './learning-path-row.types'

export interface OrganizationLearningPathAssignmentRow extends LooseRow {
  id: string
  organization_id: string
  learning_path_id: string
  assigned_by: string | null
  assigned_at: string
  status: 'active' | 'revoked'
}

export interface OrganizationLearningPathAssignmentSummaryRow extends LooseRow {
  id: string
  organization_id: string
  assigned_at: string
  status: 'active' | 'revoked'
  organizations?: {
    id: string
    name: string
    slug: string | null
  } | null
}

export interface UserSummaryRow {
  id: string
  email: string
  display_name: string | null
  first_name: string | null
  last_name: string | null
}

export interface UserLearningPathAssignmentRow extends LooseRow {
  id: string
  organization_id: string
  user_id: string
  learning_path_id: string
  assigned_by: string | null
  assigned_at: string
  status: 'assigned' | 'revoked'
  users?: UserSummaryRow | null
}

export interface UserLearningPathAssignmentSummaryRow extends LooseRow {
  id: string
  organization_id: string
  user_id: string
  assigned_at: string
  status: 'assigned' | 'revoked'
  organizations?: {
    id: string
    name: string
    slug: string | null
  } | null
  users?: UserSummaryRow | null
}
