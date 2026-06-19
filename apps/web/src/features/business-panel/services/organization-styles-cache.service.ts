import type { OrganizationStyles } from '../contexts/OrganizationStylesContext'

const ORGANIZATION_STYLES_CACHE_PREFIX = 'business-theme:v2'

export function getOrganizationStylesCacheKey(scope: string | null | undefined): string | null {
  const normalizedScope = scope?.trim()
  return normalizedScope ? `${ORGANIZATION_STYLES_CACHE_PREFIX}:${normalizedScope}` : null
}

export function readOrganizationStylesCache(scope: string | null | undefined): OrganizationStyles | null {
  const cacheKey = getOrganizationStylesCacheKey(scope)
  if (!cacheKey || typeof window === 'undefined') return null

  try {
    const cachedStyles = window.localStorage.getItem(cacheKey)
    return cachedStyles ? JSON.parse(cachedStyles) as OrganizationStyles : null
  } catch {
    return null
  }
}

export function writeOrganizationStylesCache(
  scope: string | null | undefined,
  styles: OrganizationStyles | null,
): void {
  const cacheKey = getOrganizationStylesCacheKey(scope)
  if (!cacheKey || !styles || typeof window === 'undefined') return

  try {
    window.localStorage.setItem(cacheKey, JSON.stringify(styles))
  } catch {
    // localStorage may be unavailable in private or restricted contexts.
  }
}

export function clearOrganizationStylesCache(scope: string | null | undefined): void {
  const cacheKey = getOrganizationStylesCacheKey(scope)
  if (!cacheKey || typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(cacheKey)
  } catch {
    // localStorage may be unavailable in private or restricted contexts.
  }
}

export function clearLegacyOrganizationStylesCache(organizationId: string | null | undefined): void {
  const normalizedOrganizationId = organizationId?.trim()
  if (!normalizedOrganizationId || typeof window === 'undefined') return

  try {
    window.localStorage.removeItem(`business-theme-${normalizedOrganizationId}`)
  } catch {
    // localStorage may be unavailable in private or restricted contexts.
  }
}
