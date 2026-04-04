import type {
  Zone,
  CreateZoneRequest,
  UpdateZoneRequest,
  ListZonesOptions,
} from '../../types/hierarchy.types'
import { fetchApi, type ApiResponse } from './hierarchy-common.service'

export class HierarchyZonesService {
  /**
   * Lista todas las zonas (opcionalmente filtradas por región)
   */
  static async getZones(options?: ListZonesOptions, orgSlug?: string): Promise<Zone[]> {
    const params = new URLSearchParams()
    if (options?.regionId) params.set('regionId', options.regionId)
    if (options?.includeInactive) params.set('includeInactive', 'true')
    if (options?.withCounts) params.set('withCounts', 'true')

    const queryString = params.toString()
    const endpoint = `/zones${queryString ? `?${queryString}` : ''}`

    const result = await fetchApi<{ zones: Zone[] }>(endpoint, {}, orgSlug)
    return result.success ? result.data?.zones ?? [] : []
  }

  /**
   * Obtiene una zona por ID
   */
  static async getZone(zoneId: string, orgSlug?: string): Promise<Zone | null> {
    const result = await fetchApi<{ zone: Zone }>(`/zones/${zoneId}`, {}, orgSlug)
    return result.success ? result.data?.zone ?? null : null
  }

  /**
   * Crea una nueva zona
   */
  static async createZone(data: CreateZoneRequest, orgSlug?: string): Promise<ApiResponse<Zone>> {
    return fetchApi<Zone>('/zones', { method: 'POST', body: JSON.stringify(data) }, orgSlug)
  }

  /**
   * Actualiza una zona existente
   */
  static async updateZone(
    zoneId: string,
    data: UpdateZoneRequest,
    orgSlug?: string,
  ): Promise<ApiResponse<Zone>> {
    return fetchApi<Zone>(
      `/zones/${zoneId}`,
      { method: 'PUT', body: JSON.stringify(data) },
      orgSlug,
    )
  }

  /**
   * Elimina una zona (y sus equipos en cascada)
   */
  static async deleteZone(zoneId: string, orgSlug?: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/zones/${zoneId}`, { method: 'DELETE' }, orgSlug)
  }
}
