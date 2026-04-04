/**
 * Tipos para el sistema de asignaciones jerárquicas de cursos
 */

interface HierarchyCourseSummary {
  id: string
  title: string
  slug?: string | null
  thumbnail_url?: string | null
  category?: string | null
  level?: string | null
}

/**
 * Tipo de entidad jerárquica
 */
export type HierarchyEntityType = 'region' | 'zone' | 'team'

/**
 * Información básica de una entidad jerárquica
 */
export interface HierarchyEntity {
  id: string
  name: string
  code?: string | null
  description?: string | null
}

/**
 * Asignación jerárquica de curso
 */
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
  
  // Relaciones expandidas
  course?: HierarchyCourseSummary
  assigner?: {
    id: string
    display_name?: string | null
    first_name?: string | null
    last_name?: string | null
    email?: string | null
    profile_picture_url?: string | null
  }
  
  // Información de entidad
  entity_type?: HierarchyEntityType | null
  entity_id?: string | null
  entity?: HierarchyEntity | null
}

/**
 * Request para crear una asignación
 */
export interface CreateHierarchyAssignmentRequest {
  entity_type: HierarchyEntityType
  entity_id: string
  course_ids: string[]
  start_date?: string | null
  due_date?: string | null
  approach?: 'fast' | 'balanced' | 'long' | 'custom' | null
  message?: string | null
}

/**
 * Request para actualizar una asignación
 */
export interface UpdateHierarchyAssignmentRequest {
  due_date?: string | null
  start_date?: string | null
  approach?: 'fast' | 'balanced' | 'long' | 'custom' | null
  message?: string | null
  status?: 'active' | 'completed' | 'cancelled'
}

/**
 * Response de creación de asignación
 */
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

/**
 * Response de lista de asignaciones
 */
export interface ListHierarchyAssignmentsResponse {
  success: boolean
  data?: HierarchyCourseAssignment[]
  pagination?: {
    limit: number
    offset: number
    total: number
  }
}

/**
 * Response de detalle de asignación
 */
export interface GetHierarchyAssignmentResponse {
  success: boolean
  data?: HierarchyCourseAssignment
}

/**
 * Filtros para listar asignaciones
 */
export interface HierarchyAssignmentFilters {
  entity_type?: HierarchyEntityType
  entity_id?: string
  course_id?: string
  status?: 'active' | 'completed' | 'cancelled'
  limit?: number
  offset?: number
}

/**
 * Estadísticas de una asignación
 */
export interface HierarchyAssignmentStats {
  total_users: number
  assigned_users_count: number
  completed_users_count: number
  completion_rate: number // Porcentaje de completados sobre asignados
  pending_count: number // Usuarios asignados pero no completados
}
