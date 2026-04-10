/**
 * Shared helpers and common service methods used across hierarchy sub-modules.
 */

import type {
  HierarchyStats,
  HierarchyAnalytics,
  HierarchyConfig,
  HierarchyCourse,
  HierarchyTree,
  SeedHierarchyResponse,
  UserWithHierarchy,
} from '../../types/hierarchy.types'

export const getApiBase = (orgSlug?: string) =>
  orgSlug ? `/api/${orgSlug}/business/hierarchy` : '/api/business/hierarchy'

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Generic fetch helper
 */
export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {},
  orgSlug?: string,
): Promise<ApiResponse<T>> {
  try {
    const apiBase = getApiBase(orgSlug)
    const response = await fetch(`${apiBase}${endpoint}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || `Error ${response.status}`,
      }
    }

    return {
      success: true,
      data: data.data ?? data,
      message: data.message,
    }
  } catch (error) {
    console.error('API Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error de conexión',
    }
  }
}

/**
 * Common service: config, stats, analytics, full hierarchy, validation, nodes
 */
export class HierarchyCommonService {
  // =============================================
  // CONFIGURACIÓN Y CONTROL
  // =============================================

  static async getConfig(orgSlug?: string): Promise<HierarchyConfig | null> {
    const result = await fetchApi<{ config: HierarchyConfig }>('/config', {}, orgSlug)
    return result.success ? result.data?.config ?? null : null
  }

  static async updateConfig(
    config: Partial<HierarchyConfig>,
    orgSlug?: string,
  ): Promise<ApiResponse<HierarchyConfig>> {
    return fetchApi<HierarchyConfig>(
      '/config',
      { method: 'PUT', body: JSON.stringify(config) },
      orgSlug,
    )
  }

  static async enableHierarchy(orgSlug?: string): Promise<ApiResponse<{ enabled: boolean }>> {
    return fetchApi<{ enabled: boolean }>('/enable', { method: 'POST' }, orgSlug)
  }

  static async disableHierarchy(orgSlug?: string): Promise<ApiResponse<{ enabled: boolean }>> {
    return fetchApi<{ enabled: boolean }>('/disable', { method: 'POST' }, orgSlug)
  }

  static async seedDefaultStructure(orgSlug?: string): Promise<ApiResponse<SeedHierarchyResponse>> {
    return fetchApi<SeedHierarchyResponse>('/seed', { method: 'POST' }, orgSlug)
  }

  static async getStats(orgSlug?: string): Promise<HierarchyStats | null> {
    const result = await fetchApi<{ stats: HierarchyStats }>('/stats', {}, orgSlug)
    return result.success ? result.data?.stats ?? null : null
  }

  static async getVisualAnalytics(
    entityType: 'region' | 'zone' | 'team',
    entityId: string,
    orgSlug?: string,
  ): Promise<HierarchyAnalytics | null> {
    const result = await fetchApi<{ analytics: HierarchyAnalytics }>(
      `/analytics?type=${entityType}&id=${entityId}`,
      {},
      orgSlug,
    )
    return result.success ? result.data?.analytics ?? null : null
  }

  static async getEntityCourses(
    entityType: 'region' | 'zone' | 'team',
    entityId: string,
    orgSlug?: string,
  ): Promise<HierarchyCourse[]> {
    const result = await fetchApi<{ courses: HierarchyCourse[] }>(
      `/courses?type=${entityType}&id=${entityId}`,
      {},
      orgSlug,
    )
    return result.success ? result.data?.courses ?? [] : []
  }

  static async getEntityAssignments(
    entityType: 'region' | 'zone' | 'team',
    entityId: string,
    orgSlug?: string,
  ) {
    const { HierarchyAssignmentsService } = await import('../hierarchy-assignments.service')
    return HierarchyAssignmentsService.getEntityAssignments(entityType, entityId, orgSlug)
  }

  static async assignCoursesToEntity(
    entityType: 'region' | 'zone' | 'team',
    entityId: string,
    courseIds: string[],
    options?: {
      start_date?: string
      due_date?: string
      approach?: 'fast' | 'balanced' | 'long' | 'custom'
      message?: string
    },
    orgSlug?: string,
  ): Promise<ApiResponse<{
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
  }>> {
    return fetchApi(
      `/courses/assign`,
      {
        method: 'POST',
        body: JSON.stringify({
          entity_type: entityType,
          entity_id: entityId,
          course_ids: courseIds,
          ...options,
        }),
      },
      orgSlug,
    )
  }

  // =============================================
  // JERARQUÍA COMPLETA
  // =============================================

  static async getFullHierarchy(orgSlug?: string): Promise<HierarchyTree> {
    const result = await fetchApi<HierarchyTree>('/full', {}, orgSlug)
    return result.success && result.data ? result.data : { regions: [] }
  }

  static async getHierarchySummary(orgSlug?: string): Promise<{
    regions: Array<{ id: string; name: string; code?: string }>
    zones: Array<{ id: string; name: string; region_id: string; code?: string }>
    teams: Array<{ id: string; name: string; zone_id: string; code?: string }>
  }> {
    const result = await fetchApi<{
      regions: Array<{ id: string; name: string; code?: string }>
      zones: Array<{ id: string; name: string; region_id: string; code?: string }>
      teams: Array<{ id: string; name: string; zone_id: string; code?: string }>
    }>('/summary', {}, orgSlug)

    return result.success && result.data
      ? result.data
      : { regions: [], zones: [], teams: [] }
  }

  // =============================================
  // VALIDACIONES
  // =============================================

  static async canEnableHierarchy(orgSlug?: string): Promise<{
    canEnable: boolean
    issues: string[]
  }> {
    const result = await fetchApi<{ canEnable: boolean; issues: string[] }>(
      '/can-enable',
      {},
      orgSlug,
    )
    return result.success && result.data
      ? result.data
      : { canEnable: false, issues: ['Error al verificar'] }
  }

  static async isRegionNameAvailable(name: string, orgSlug?: string): Promise<boolean> {
    const result = await fetchApi<{ available: boolean }>(
      `/regions/check-name?name=${encodeURIComponent(name)}`,
      {},
      orgSlug,
    )
    return result.success ? result.data?.available ?? false : false
  }

  static async isZoneNameAvailable(name: string, regionId: string, orgSlug?: string): Promise<boolean> {
    const result = await fetchApi<{ available: boolean }>(
      `/zones/check-name?name=${encodeURIComponent(name)}&regionId=${regionId}`,
      {},
      orgSlug,
    )
    return result.success ? result.data?.available ?? false : false
  }

  static async isTeamNameAvailable(name: string, zoneId: string, orgSlug?: string): Promise<boolean> {
    const result = await fetchApi<{ available: boolean }>(
      `/teams/check-name?name=${encodeURIComponent(name)}&zoneId=${zoneId}`,
      {},
      orgSlug,
    )
    return result.success ? result.data?.available ?? false : false
  }

  // =============================================
  // NODOS UNIFICADOS (V2)
  // =============================================

  static async getNodeDetails(
    nodeId: string,
    orgSlug?: string,
  ): Promise<import('../../types/dynamicHierarchy.types').NodeDetails | null> {
    const result = await fetchApi<import('../../types/dynamicHierarchy.types').NodeDetails>(
      `/nodes/${nodeId}`,
      {},
      orgSlug,
    )
    return result.success ? result.data ?? null : null
  }

  static async getNodeMembers(
    nodeId: string,
    orgSlug?: string,
  ): Promise<import('../../types/hierarchy.types').NodeMember[]> {
    const result = await fetchApi<{
      members: import('../../types/hierarchy.types').NodeMember[]
    }>(`/nodes/${nodeId}/members`, {}, orgSlug)
    return result.success ? result.data?.members ?? [] : []
  }

  static async assignUserToNode(
    nodeId: string,
    userId: string,
    role: string = 'member',
    isPrimary: boolean = false,
    orgSlug?: string,
  ): Promise<ApiResponse<import('../../types/hierarchy.types').NodeMember>> {
    return fetchApi(`/nodes/${nodeId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role, isPrimary }),
    }, orgSlug)
  }

  static async removeUserFromNode(
    nodeId: string,
    userId: string,
    orgSlug?: string,
  ): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/nodes/${nodeId}/members/${userId}`, { method: 'DELETE' }, orgSlug)
  }

  static async getAvailableUsersForNode(
    nodeId: string,
    query: string = '',
    includeCurrentMembers?: boolean,
    orgSlug?: string,
  ): Promise<UserWithHierarchy['user'][]> {
    const params = new URLSearchParams()
    if (query) params.set('query', query)
    if (includeCurrentMembers) params.set('includeCurrentMembers', 'true')

    const result = await fetchApi<{ users: UserWithHierarchy['user'][] }>(
      `/nodes/${nodeId}/members/available?${params.toString()}`,
      {},
      orgSlug,
    )
    return result.success ? result.data?.users ?? [] : []
  }

  static async searchOrganizationUsers(
    query: string = '',
    orgSlug?: string,
  ): Promise<NonNullable<UserWithHierarchy['user']>[]> {
    const params = new URLSearchParams()
    if (query) params.set('query', query)

    const result = await fetchApi<{ users: UserWithHierarchy['user'][] }>(
      `/users/search?${params.toString()}`,
      {},
      orgSlug,
    )
    return result.success
      ? (result.data?.users ?? []).filter(
          (user): user is NonNullable<UserWithHierarchy['user']> => Boolean(user)
        )
      : []
  }
}
