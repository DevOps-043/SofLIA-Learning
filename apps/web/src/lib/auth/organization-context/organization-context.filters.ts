import type { OrganizationContext } from './organization-context.types'

interface OrganizationFilterQuery<TSelf> {
  eq: (column: string, value: string) => TSelf
  is: (column: string, value: null) => TSelf
}

export function addOrganizationFilter<T extends OrganizationFilterQuery<T>>(
  query: T,
  organizationId: string | null,
): T {
  return organizationId
    ? query.eq('organization_id', organizationId)
    : query.is('organization_id', null)
}

export function hasOrganizationContext(
  context: OrganizationContext,
): context is OrganizationContext & { organizationId: string } {
  return context.organizationId !== null
}
