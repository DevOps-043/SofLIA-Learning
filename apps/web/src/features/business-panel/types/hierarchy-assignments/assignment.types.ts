interface HierarchyCourseSummary {
  id: string
  title: string
  slug?: string | null
  thumbnail_url?: string | null
  category?: string | null
  level?: string | null
}

export type HierarchyEntityType = 'region' | 'zone' | 'team'

export interface HierarchyEntity {
  id: string
  name: string
  code?: string | null
  description?: string | null
}

export interface HierarchyCourseAssignment {
  id: string
  organization_id: string
  course_id: string
  assigned_by: string
  assigned_at: string
  due_date?: string | null
  start_date?: string | null
  approach?: 'fast' | 'balanced' | 'long' | 'custom' | null
  message?: string | null
  status: 'active' | 'completed' | 'cancelled'
  total_users: number
  assigned_users_count: number
  completed_users_count: number
  created_at: string
  updated_at: string
  course?: HierarchyCourseSummary
  assigner?: {
    id: string
    display_name?: string | null
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    profile_picture_url?: string | null
  }
  entity_type?: HierarchyEntityType | null
  entity_id?: string | null
  entity?: HierarchyEntity | null
}

export interface CreateHierarchyAssignmentRequest {
  entity_type: HierarchyEntityType
  entity_id: string
  course_ids: string[]
  start_date?: string | null
  due_date?: string | null
  approach?: 'fast' | 'balanced' | 'long' | 'custom' | null
  message?: string | null
}

export interface UpdateHierarchyAssignmentRequest {
  due_date?: string | null
  start_date?: string | null
  approach?: 'fast' | 'balanced' | 'long' | 'custom' | null
  message?: string | null
  status?: 'active' | 'completed' | 'cancelled'
}

export interface CreateHierarchyAssignmentResponse {
  success: boolean
  error?: string
  message?: string
  data?: {
    entity_type: HierarchyEntityType
    entity_id: string
    entity_name: string
    total_users: number
    results: Array<{
      course_id: string
      course_title?: string
      success: boolean
      assigned_count?: number
      already_assigned_count?: number
      error?: string
      message?: string
      hierarchy_assignment_id?: string
    }>
  }
}
