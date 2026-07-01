export type CourseDefaultScopeType = 'organization' | 'node'
export type CourseDefaultRuleStatus = 'active' | 'revoked'
export type CourseAssignmentSource = 'manual' | 'bulk' | 'default_rule'

export interface LooseRow { [key: string]: unknown }
export interface OrganizationUserRow extends LooseRow { user_id: string; status: string | null }
export interface OrganizationNodeUserRow extends LooseRow { node_id: string; user_id: string }

export interface OrganizationNodeRow extends LooseRow {
  id: string
  organization_id: string
  name: string
  type: string
  path: string
  parent_id: string | null
  is_active: boolean | null
}

export interface CourseReference {
  id: string
  title: string
  is_active: boolean
}

export interface CourseDefaultRuleRow extends LooseRow {
  id: string
  organization_id: string
  course_id: string
  scope_type: CourseDefaultScopeType
  node_id: string | null
  include_descendants: boolean
  status: CourseDefaultRuleStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CourseDefaultRule {
  id: string
  organization_id: string
  course_id: string
  scope_type: CourseDefaultScopeType
  node_id: string | null
  include_descendants: boolean
  status: CourseDefaultRuleStatus
  created_by: string | null
  created_at: string
  updated_at: string
  course: CourseReference | null
  node: { id: string; name: string; type: string; path: string } | null
}

export interface CreatedCourseAssignment {
  id: string
  user_id: string
}

export interface CourseAssignResult {
  targetUsers: number
  assigned: number
  existing: number
  createdAssignments: CreatedCourseAssignment[]
}

export interface CourseBulkApplyResult {
  rulesApplied: number
  targetUsers: number
  assigned: number
  existing: number
}
