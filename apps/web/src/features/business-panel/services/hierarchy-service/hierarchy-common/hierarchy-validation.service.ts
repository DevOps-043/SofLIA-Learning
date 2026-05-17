import { fetchApi } from './hierarchy-api'

export async function canEnableHierarchy(orgSlug?: string): Promise<{
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

export async function isRegionNameAvailable(name: string, orgSlug?: string): Promise<boolean> {
  const result = await fetchApi<{ available: boolean }>(
    `/regions/check-name?name=${encodeURIComponent(name)}`,
    {},
    orgSlug,
  )
  return result.success ? result.data?.available ?? false : false
}

export async function isZoneNameAvailable(
  name: string,
  regionId: string,
  orgSlug?: string,
): Promise<boolean> {
  const result = await fetchApi<{ available: boolean }>(
    `/zones/check-name?name=${encodeURIComponent(name)}&regionId=${regionId}`,
    {},
    orgSlug,
  )
  return result.success ? result.data?.available ?? false : false
}

export async function isTeamNameAvailable(
  name: string,
  zoneId: string,
  orgSlug?: string,
): Promise<boolean> {
  const result = await fetchApi<{ available: boolean }>(
    `/teams/check-name?name=${encodeURIComponent(name)}&zoneId=${zoneId}`,
    {},
    orgSlug,
  )
  return result.success ? result.data?.available ?? false : false
}
