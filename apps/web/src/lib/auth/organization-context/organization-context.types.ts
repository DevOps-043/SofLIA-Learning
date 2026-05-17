export interface OrganizationContext {
  organizationId: string | null
  organizationSlug: string | null
  role: 'owner' | 'admin' | 'member' | null
  isB2B: boolean
  isOrgAdmin: boolean
}

export interface OrganizationIdentifier {
  organizationId: string | null
  organizationSlug: string | null
}

export type OrganizationRole = NonNullable<OrganizationContext['role']>
