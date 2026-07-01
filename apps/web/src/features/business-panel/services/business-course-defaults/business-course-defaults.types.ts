import type { BusinessLearningPathHierarchyNode } from '../business-learning-paths/business-learning-paths-more.types'

export type { BusinessLearningPathHierarchyNode as BusinessCourseHierarchyNode } from '../business-learning-paths/business-learning-paths-more.types'

export interface BusinessCourseReference {
  id: string
  title: string
  is_active: boolean
}

export interface BusinessCourseDefaultRule {
  id: string
  organization_id: string
  course_id: string
  scope_type: 'organization' | 'node'
  node_id: string | null
  include_descendants: boolean
  status: 'active' | 'revoked'
  created_at: string
  updated_at: string
  course: BusinessCourseReference | null
  node: BusinessLearningPathHierarchyNode | null
}

export interface BusinessCourseDefaultRulePayload {
  courseId: string
  scopeType: 'organization' | 'node'
  nodeId?: string | null
  includeDescendants?: boolean
  applyNow?: boolean
}

export interface GetBusinessCourseDefaultsResponse {
  rules: BusinessCourseDefaultRule[]
  nodes: BusinessLearningPathHierarchyNode[]
}
