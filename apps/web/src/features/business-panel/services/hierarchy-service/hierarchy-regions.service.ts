import type {
  Region,
  CreateRegionRequest,
  UpdateRegionRequest,
  ListRegionsOptions,
} from '../../types/hierarchy.types'
import { fetchApi, type ApiResponse } from './hierarchy-common.service'

export class HierarchyRegionsService {
  /**
   * Lista todas las regiones de la organización
   */
  static async getRegions(options?: ListRegionsOptions, orgSlug?: string): Promise<Region[]> {
    const params = new URLSearchParams()
    if (options?.includeInactive) params.set('includeInactive', 'true')
    if (options?.withCounts) params.set('withCounts', 'true')

    const queryString = params.toString()
    const endpoint = `/regions${queryString ? `?${queryString}` : ''}`

    const result = await fetchApi<{ regions: Region[] }>(endpoint, {}, orgSlug)
    return result.success ? result.data?.regions ?? [] : []
  }

  /**
   * Obtiene una región por ID
   */
  static async getRegion(regionId: string, orgSlug?: string): Promise<Region | null> {
    const result = await fetchApi<{ region: Region }>(`/regions/${regionId}`, {}, orgSlug)
    return result.success ? result.data?.region ?? null : null
  }

  /**
   * Crea una nueva región
   */
  static async createRegion(data: CreateRegionRequest, orgSlug?: string): Promise<ApiResponse<Region>> {
    return fetchApi<Region>('/regions', { method: 'POST', body: JSON.stringify(data) }, orgSlug)
  }

  /**
   * Actualiza una región existente
   */
  static async updateRegion(
    regionId: string,
    data: UpdateRegionRequest,
    orgSlug?: string,
  ): Promise<ApiResponse<Region>> {
    return fetchApi<Region>(
      `/regions/${regionId}`,
      { method: 'PUT', body: JSON.stringify(data) },
      orgSlug,
    )
  }

  /**
   * Elimina una región (y sus zonas/equipos en cascada)
   */
  static async deleteRegion(regionId: string, orgSlug?: string): Promise<ApiResponse<void>> {
    return fetchApi<void>(`/regions/${regionId}`, { method: 'DELETE' }, orgSlug)
  }
}
