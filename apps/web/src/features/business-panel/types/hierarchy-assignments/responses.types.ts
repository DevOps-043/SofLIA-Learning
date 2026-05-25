import type { HierarchyCourseAssignment, HierarchyEntityType } from './assignment.types'

export interface ListHierarchyAssignmentsResponse {
  success: boolean
  data?: HierarchyCourseAssignment[]
  pagination?: {
    limit: number
    offset: number
    total: number
  }
}

export interface GetHierarchyAssignmentResponse {
  success: boolean
  data?: HierarchyCourseAssignment
}

export interface HierarchyAssignmentFilters {
  entity_type?: HierarchyEntityType
  entity_id?: string
  course_id?: string
  status?: 'active' | 'completed' | 'cancelled'
  limit?: number
  offset?: number
}

export interface HierarchyAssignmentStats {
  total_users: number
  assigned_users_count: number
  completed_users_count: number
  completion_rate: number
  pending_count: number
}
