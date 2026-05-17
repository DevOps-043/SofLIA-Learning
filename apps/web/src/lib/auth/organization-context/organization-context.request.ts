import type { NextRequest } from 'next/server'
import { extractOrgSlugFromPath } from './organization-context-path'
import type { OrganizationIdentifier } from './organization-context.types'

export function readOrganizationIdentifier(request: NextRequest): OrganizationIdentifier {
  const pathOrgSlug = extractOrgSlugFromPath(request.nextUrl.pathname)
  const headerOrgId = request.headers.get('X-Organization-ID')
  const headerOrgSlug = request.headers.get('X-Organization-Slug')
  const queryOrgId = request.nextUrl.searchParams.get('organizationId')
  const queryOrgSlug = request.nextUrl.searchParams.get('org')

  return {
    organizationId: headerOrgId || queryOrgId,
    organizationSlug: headerOrgSlug || queryOrgSlug || pathOrgSlug,
  }
}
