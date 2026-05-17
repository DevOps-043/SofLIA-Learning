import type { LearningPath } from '@/features/admin/types'

export type LearningPathDefaultScopeType = 'organization' | 'node'
export type LearningPathDefaultRuleStatus = 'active' | 'revoked'
export type LearningPathAssignmentSource = 'manual' | 'bulk' | 'default_rule'

export interface LooseRow { [key: string]: unknown }
export interface OrganizationUserRow extends LooseRow { user_id: string; status: string | null }

export interface OrganizationNodeRow extends LooseRow {
  id: string
  organization_id: string
  name: string
  type: string
  path: string
  parent_id: string | null
  is_active: boolean | null
}

export interface OrganizationNodeUserRow extends LooseRow { node_id: string; user_id: string }
export interface UserLearningPathAssignmentStatusRow extends LooseRow { id: string; status: 'assigned' | 'revoked' }

export interface LearningPathDefaultRuleRow extends LooseRow {
  id: string
  organization_id: string
  learning_path_id: string
  scope_type: LearningPathDefaultScopeType
  node_id: string | null
  include_descendants: boolean
  status: LearningPathDefaultRuleStatus
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface LearningPathDefaultRule {
  id: string
  organization_id: string
  learning_path_id: string
  scope_type: LearningPathDefaultScopeType
  node_id: string | null
  include_descendants: boolean
  status: LearningPathDefaultRuleStatus
  created_by: string | null
  created_at: string
  updated_at: string
  learning_path: LearningPath | null
  node: { id: string; name: string; type: string; path: string } | null
}

export interface LearningPathHierarchyNodeOption {
  id: string
  name: string
  type: string
  path: string
  parent_id: string | null
  depth: number
}

export interface LearningPathTarget {
  type: 'all' | 'node'
  nodeIds?: string[]
  includeDescendants?: boolean
}

export interface LearningPathBulkApplyResult {
  targetUsers: number
  assigned: number
  existing: number
  reactivated: number
  skippedRevoked: number
}
