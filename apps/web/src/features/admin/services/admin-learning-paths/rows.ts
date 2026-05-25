export type LooseRow = Record<string, unknown>
export type AssignmentSource = 'manual' | 'bulk' | 'default_rule'

export type SupabaseMutationError = {
  message: string
  code?: string
  details?: string
} | null

export interface LearningPathRow extends LooseRow {
  id: string
  title: string
  slug: string | null
  description: string | null
  is_active: boolean | null
  created_at: string
  updated_at: string
}

export interface LearningPathItemRow extends LooseRow {
  id: string
  learning_path_id: string
  course_id: string
  position: number
  courses?: {
    id: string
    title: string | null
    slug: string | null
    thumbnail_url: string | null
    category: string | null
    level: string | null
  } | null
}

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

export interface UserProfileRow {
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
  assignment_source?: AssignmentSource
  default_rule_id?: string | null
  users?: UserProfileRow | null
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
  users?: UserProfileRow | null
}
