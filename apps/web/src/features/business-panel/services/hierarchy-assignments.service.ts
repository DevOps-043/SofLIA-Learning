/**
 * Servicio para gestionar asignaciones jerárquicas de cursos
 */

import type {
  HierarchyCourseAssignment,
  CreateHierarchyAssignmentRequest,
  UpdateHierarchyAssignmentRequest,
  CreateHierarchyAssignmentResponse,
  ListHierarchyAssignmentsResponse,
  GetHierarchyAssignmentResponse,
  HierarchyAssignmentFilters,
  HierarchyAssignmentStats
} from '../types/hierarchy-assignments.types'

const getApiBase = (orgSlug?: string) => 
  orgSlug ? `/api/${orgSlug}/business/hierarchy/courses` : '/api/business/hierarchy/courses';

/**
 * Respuesta genérica de la API
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Helper para hacer requests
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  orgSlug?: string
): Promise<ApiResponse<T>> {
  try {
    const apiBase = getApiBase(orgSlug);
    const response = await fetch(`${apiBase}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Error ${response.status}`
      };
    }

    return {
      success: true,
      data: data.data ?? data,
      message: data.message
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión'
    };
  }
}

export class HierarchyAssignmentsService {


  /**
   * Crea una nueva asignación jerárquica de cursos
   */
  static async createAssignment(
    request: CreateHierarchyAssignmentRequest,
    orgSlug?: string
  ): Promise<CreateHierarchyAssignmentResponse> {
    return fetchApi(`/assign`, {
      method: 'POST',
      body: JSON.stringify(request)
    }, orgSlug);
  }

  /**
   * Lista asignaciones jerárquicas con filtros opcionales
   */
  static async listAssignments(
    filters?: HierarchyAssignmentFilters,
    orgSlug?: string
  ): Promise<HierarchyCourseAssignment[]> {
    const params = new URLSearchParams();

    if (filters?.entity_type) params.append('entity_type', filters.entity_type);
    if (filters?.entity_id) params.append('entity_id', filters.entity_id);
    if (filters?.course_id) params.append('course_id', filters.course_id);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.offset) params.append('offset', filters.offset.toString());

    const result = await fetchApi<HierarchyCourseAssignment[]>(
      `/assignments?${params.toString()}`,
      {},
      orgSlug
    );

    return result.success && result.data ? result.data : [];
  }

  /**
   * Obtiene el detalle de una asignación
   */
  static async getAssignment(
    assignmentId: string,
    orgSlug?: string
  ): Promise<HierarchyCourseAssignment | null> {
    const result = await fetchApi<HierarchyCourseAssignment>(
      `/assignments/${assignmentId}`,
      {},
      orgSlug
    );

    return result.success && result.data ? result.data : null;
  }

  /**
   * Actualiza una asignación
   */
  static async updateAssignment(
    assignmentId: string,
    request: UpdateHierarchyAssignmentRequest,
    orgSlug?: string
  ): Promise<HierarchyCourseAssignment | null> {
    const result = await fetchApi<HierarchyCourseAssignment>(
      `/assignments/${assignmentId}`,
      {
        method: 'PUT',
        body: JSON.stringify(request)
      },
      orgSlug
    );

    return result.success && result.data ? result.data : null;
  }

  /**
   * Cancela una asignación
   */
  static async cancelAssignment(assignmentId: string, orgSlug?: string): Promise<boolean> {
    const result = await fetchApi<{ success: boolean; message?: string }>(
      `/assignments/${assignmentId}`,
      {
        method: 'DELETE'
      },
      orgSlug
    );

    return result.success || false;
  }

  /**
   * Obtiene asignaciones de una entidad específica
   */
  static async getEntityAssignments(
    entityType: 'region' | 'zone' | 'team',
    entityId: string,
    orgSlug?: string
  ): Promise<HierarchyCourseAssignment[]> {
    return this.listAssignments({
      entity_type: entityType,
      entity_id: entityId
    }, orgSlug);
  }

  /**
   * Obtiene asignaciones de un curso específico
   */
  static async getCourseAssignments(
    courseId: string,
    orgSlug?: string
  ): Promise<HierarchyCourseAssignment[]> {
    return this.listAssignments({
      course_id: courseId
    }, orgSlug);
  }

  /**
   * Calcula estadísticas de una asignación
   */
  static calculateStats(
    assignment: HierarchyCourseAssignment
  ): HierarchyAssignmentStats {
    const completion_rate =
      assignment.assigned_users_count > 0
        ? (assignment.completed_users_count / assignment.assigned_users_count) * 100
        : 0

    const pending_count =
      assignment.assigned_users_count - assignment.completed_users_count

    return {
      total_users: assignment.total_users,
      assigned_users_count: assignment.assigned_users_count,
      completed_users_count: assignment.completed_users_count,
      completion_rate: Math.round(completion_rate * 100) / 100,
      pending_count
    }
  }
}

