const STATIC_ROUTE_PREFIXES = new Set([
  'api',
  'auth',
  '_next',
  'public',
  'courses',
  'profile',
  'settings',
  'communities',
  'news',
  'admin',
  'instructor',
  'business-panel',
  'business-user',
  'dashboard',
  'certificates',
  'account-settings',
  'privacy',
  'terms',
])

const ORG_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/

export function extractOrgSlugFromPath(pathname: string): string | null {
  const firstPart = pathname.split('/').filter(Boolean)[0]

  if (!firstPart || STATIC_ROUTE_PREFIXES.has(firstPart)) {
    return null
  }

  return ORG_SLUG_PATTERN.test(firstPart) ? firstPart : null
}
