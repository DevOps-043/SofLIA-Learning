import type { OrganizationContext } from './organization-context.types'

export const defaultOrganizationContext: OrganizationContext = {
  organizationId: null,
  organizationSlug: null,
  role: null,
  isB2B: false,
  isOrgAdmin: false,
}
