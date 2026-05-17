import type { JwtPayload } from 'jsonwebtoken'

export interface RawAuthMetadata {
  organization_id?: string
  organization_slug?: string
  org_slug?: string
  orgSlug?: string
  role?: string
}

export interface RawSupabaseJwtPayload extends JwtPayload {
  sub?: string
  email?: string
  role?: string
  app_metadata?: RawAuthMetadata
  user_metadata?: RawAuthMetadata
  organization_id?: string
  organization_slug?: string
  org_slug?: string
  orgSlug?: string
}

export interface AuthenticatedRequestUser {
  id: string
  email: string
  role: string
  organizationId?: string
  organizationSlug?: string
}
