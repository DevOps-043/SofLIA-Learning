import type {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
  ListTeamsOptions,
  UserWithHierarchy,
  AssignUserToTeamRequest,
  AssignZoneManagerRequest,
  AssignRegionalManagerRequest,
} from '../../types/hierarchy.types'
import { fetchApi, type ApiResponse } from './hierarchy-common.service'

export class HierarchyTeamsService {
  // =============================================
  // EQUIPOS
  // =============================================

  /**
   * Lista todos los equipos (opcionalmente filtrados)
   */
  static async getTeams(options?: ListTeamsOptions, orgSlug?: string): Promise<Team[]> {
    const params = new URLSearchParams()
    if (options?.zoneId) params.set('zoneId', options.zoneId)
    if (options?.regionId) params.set('regionId', options.regionId)
    if (options?.includeInactive) params.set('includeInactive', 'true')
    if (options?.withCounts) params.set('withCounts', 'true')

    const queryString = params.toString()
    const endpoint = `/teams${queryString ? `?${queryString}` : ''}`

    const result = await fetchApi<{ teams: Team[] }>(endpoint, {}, orgSlug)
    return result.success ? result.data?.teams ?? [] : []
  }

  /**
   * Obtiene un equipo por ID
   */
  static async getTeam(teamId: string, orgSlug?: string): Promise<Team | null> {
    const result = await fetchApi<{ team: Team }>(`/teams/${teamId}`, {}, orgSlug)
    return result.success ? result.data?.team ?? null : null
  }

  /**
   * Crea un nuevo equipo
   */
  static async createTeam(data: CreateTeamRequest, orgSlug?: string): Promise<ApiResponse<Team>> {
    return fetchApi<Team>('/teams', { method: 'POST', body: JSON.stringify(data) }, orgSlug)
  }

  /**
   * Actualiza un equipo existente
   */
  static async updateTeam(
    teamId: string,
    data: UpdateTeamRequest,
    orgSlug?: string,
  ): Promise<ApiResponse<Team>> {
    return fetchApi<Team>(
      `/teams/${teamId}`,
      { method: 'PUT', body: JSON.stringify(data) },
      orgSlug,
    )
  }

  /**
   * Elimina un equipo
   */
  static async deleteTeam(teamId: string, orgSlug?: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/teams/${teamId}`, { method: 'DELETE' }, orgSlug)
  }

  /**
   * Obtiene los miembros de un equipo
   */
  static async getTeamMembers(teamId: string, orgSlug?: string): Promise<UserWithHierarchy[]> {
    const result = await fetchApi<{ members: UserWithHierarchy[] }>(
      `/teams/${teamId}/members`,
      {},
      orgSlug,
    )
    return result.success ? result.data?.members ?? [] : []
  }

  // =============================================
  // ASIGNACIÓN DE USUARIOS
  // =============================================

  /**
   * Asigna un usuario a un equipo
   */
  static async assignUserToTeam(
    data: AssignUserToTeamRequest,
    orgSlug?: string,
  ): Promise<ApiResponse<UserWithHierarchy>> {
    return fetchApi<UserWithHierarchy>(
      '/users/assign',
      { method: 'POST', body: JSON.stringify(data) },
      orgSlug,
    )
  }

  /**
   * Remueve un usuario de su equipo actual
   */
  static async removeUserFromTeam(userId: string, orgSlug?: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/users/${userId}/unassign`, { method: 'POST' }, orgSlug)
  }

  /**
   * Asigna un usuario como gerente de zona
   */
  static async assignZoneManager(
    data: AssignZoneManagerRequest,
    orgSlug?: string,
  ): Promise<ApiResponse<UserWithHierarchy>> {
    return fetchApi<UserWithHierarchy>(
      '/users/assign-zone-manager',
      { method: 'POST', body: JSON.stringify(data) },
      orgSlug,
    )
  }

  /**
   * Asigna un usuario como gerente regional
   */
  static async assignRegionalManager(
    data: AssignRegionalManagerRequest,
    orgSlug?: string,
  ): Promise<ApiResponse<UserWithHierarchy>> {
    return fetchApi<UserWithHierarchy>(
      '/users/assign-regional-manager',
      { method: 'POST', body: JSON.stringify(data) },
      orgSlug,
    )
  }

  /**
   * Obtiene usuarios sin equipo asignado
   */
  static async getUnassignedUsers(orgSlug?: string): Promise<UserWithHierarchy[]> {
    const result = await fetchApi<{ users: UserWithHierarchy[] }>(
      '/users/unassigned',
      {},
      orgSlug,
    )
    return result.success ? result.data?.users ?? [] : []
  }

  /**
   * Obtiene todos los usuarios con su información de jerarquía
   */
  static async getUsersWithHierarchy(orgSlug?: string): Promise<UserWithHierarchy[]> {
    const result = await fetchApi<{ users: UserWithHierarchy[] }>('/users', {}, orgSlug)
    return result.success ? result.data?.users ?? [] : []
  }

  /**
   * Obtiene usuarios disponibles para asignar como gerentes/líderes
   */
  static async getAvailableManagers(
    role?: 'regional_manager' | 'zone_manager' | 'team_leader',
    orgSlug?: string,
  ): Promise<UserWithHierarchy[]> {
    const params = new URLSearchParams()
    if (role) params.set('role', role)

    const queryString = params.toString()
    const endpoint = `/users/available-managers${queryString ? `?${queryString}` : ''}`

    const result = await fetchApi<{ users: UserWithHierarchy[] }>(endpoint, {}, orgSlug)
    return result.success ? result.data?.users ?? [] : []
  }
}
