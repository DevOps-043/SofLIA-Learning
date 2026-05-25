import type {
  HierarchyTree,
  UserWithHierarchy,
} from '../../../types/hierarchy.types'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export type HierarchyEntityType = 'region' | 'zone' | 'team'

export interface AssignCoursesToEntityOptions {
  start_date?: string
  due_date?: string
  approach?: 'fast' | 'balanced' | 'long' | 'custom'
  message?: string
}

export interface AssignCoursesToEntityResponse {
  entity_type: string
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
  }>
}

export interface HierarchySummary {
  regions: Array<{ id: string; name: string; code?: string }>
  zones: Array<{ id: string; name: string; region_id: string; code?: string }>
  teams: Array<{ id: string; name: string; zone_id: string; code?: string }>
}

export type NodeUser = NonNullable<UserWithHierarchy['user']>

export const EMPTY_HIERARCHY: HierarchyTree = { regions: [] }
