export type OrganizationRole = 'owner' | 'admin' | 'member'

export interface BusinessAuth {
  userId: string
  userEmail: string
  userRole: string
  organizationId?: string
  organizationSlug?: string
  organizationRole?: OrganizationRole
  isOrgAdmin?: boolean
}

export interface OrganizationAccessOptions {
  organizationId?: string
  organizationSlug?: string
}

export type RequireBusinessOptions = OrganizationAccessOptions
export type RequireBusinessUserOptions = OrganizationAccessOptions

export type BusinessAccessMode = 'business-admin' | 'business-user'

export interface AuthFailure {
  status: number
  message: string
}

export type AuthResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AuthFailure }

export interface AuthenticatedBusinessUser {
  id: string
  email: string | null
  cargo_rol: string | null
  isPlatformAdmin: boolean
}

export interface OrganizationAccessContext {
  organizationId?: string
  organizationSlug?: string
  organizationRole?: OrganizationRole
  isOrgAdmin: boolean
}
