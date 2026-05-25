import type {
  HierarchyConfig,
  HierarchyStats,
  SeedHierarchyResponse,
} from '../../../types/hierarchy.types'
import { fetchApi } from './hierarchy-api'
import type { ApiResponse } from './hierarchy-common.types'

export async function getConfig(orgSlug?: string): Promise<HierarchyConfig | null> {
  const result = await fetchApi<{ config: HierarchyConfig }>('/config', {}, orgSlug)
  return result.success ? result.data?.config ?? null : null
}

export function updateConfig(
  config: Partial<HierarchyConfig>,
  orgSlug?: string,
): Promise<ApiResponse<HierarchyConfig>> {
  return fetchApi<HierarchyConfig>(
    '/config',
    { method: 'PUT', body: JSON.stringify(config) },
    orgSlug,
  )
}

export function enableHierarchy(orgSlug?: string): Promise<ApiResponse<{ enabled: boolean }>> {
  return fetchApi<{ enabled: boolean }>('/enable', { method: 'POST' }, orgSlug)
}

export function disableHierarchy(orgSlug?: string): Promise<ApiResponse<{ enabled: boolean }>> {
  return fetchApi<{ enabled: boolean }>('/disable', { method: 'POST' }, orgSlug)
}

export function seedDefaultStructure(orgSlug?: string): Promise<ApiResponse<SeedHierarchyResponse>> {
  return fetchApi<SeedHierarchyResponse>('/seed', { method: 'POST' }, orgSlug)
}

export async function getStats(orgSlug?: string): Promise<HierarchyStats | null> {
  const result = await fetchApi<{ stats: HierarchyStats }>('/stats', {}, orgSlug)
  return result.success ? result.data?.stats ?? null : null
}
