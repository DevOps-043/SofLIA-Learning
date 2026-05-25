import type {
  BusinessLearningPath,
  BusinessLearningPathAssignment,
} from './business-learning-paths.types'

export interface BusinessLearningPathDefaultRule {
  id: string
  organization_id: string
  learning_path_id: string
  scope_type: 'organization' | 'node'
  node_id: string | null
  include_descendants: boolean
  status: 'active' | 'revoked'
  created_at: string
  updated_at: string
  learning_path: BusinessLearningPath | null
  node: BusinessLearningPathHierarchyNode | null
}

export interface BusinessLearningPathHierarchyNode {
  id: string
  name: string
  type: string
  path: string
  parent_id: string | null
  depth: number
}

export type BusinessLearningPathAssignTarget =
  | { type: 'all' }
  | { type: 'node'; nodeIds: string[]; includeDescendants: boolean }

export interface BusinessLearningPathDefaultRulePayload {
  learningPathId: string
  scopeType: 'organization' | 'node'
  nodeId?: string | null
  includeDescendants?: boolean
  applyNow?: boolean
}

export interface GetBusinessLearningPathsResponse {
  learningPaths: BusinessLearningPath[]
  assignments: BusinessLearningPathAssignment[]
  defaultRules: BusinessLearningPathDefaultRule[]
  hierarchyNodes: BusinessLearningPathHierarchyNode[]
}
